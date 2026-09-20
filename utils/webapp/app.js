(() => {
    'use strict';

    const BOOT = window.__DATA__;
    let library = BOOT.results || [];
    // Server mode is claimed by the boot payload, then verified against the API;
    // a static report.html opened from disk degrades to read-only.
    let serverMode = !!BOOT.serverMode;

    const STATUSES = ['backlog', 'watching', 'completed', 'on-hold', 'dropped'];
    const STATUS_LABELS = {
        'backlog': 'Backlog', 'watching': 'Watching', 'completed': 'Completed',
        'on-hold': 'On Hold', 'dropped': 'Dropped'
    };
    const TABS = ['all', ...STATUSES];

    const state = {
        tab: 'all',
        search: '',
        genre: '',
        sort: 'avg',
        view: localStorage.getItem('ab-view') || 'grid'
    };

    const $ = id => document.getElementById(id);
    const grid = $('libraryGrid');

    /* ---------------- helpers ---------------- */

    function getTier(score) {
        if (score >= 8.5) return 'S';
        if (score >= 8.0) return 'A';
        if (score >= 7.5) return 'B';
        return 'C';
    }

    function esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    // Source descriptions can contain markup (AniList uses <br>); strip to text.
    function plain(s) {
        const div = document.createElement('div');
        div.innerHTML = String(s ?? '');
        return div.textContent || '';
    }

    function score(item, key) {
        if (key === 'anilist') return item.anilist?.rating ? item.anilist.rating / 10 : -1;
        if (key === 'mal') { const v = parseFloat(item.mal?.rating); return isNaN(v) ? -1 : v; }
        if (key === 'imdb') { const v = parseFloat(item.imdb?.rating); return isNaN(v) ? -1 : v; }
        return item.averageRating || 0;
    }

    let toastTimer;
    function toast(msg, opts = {}) {
        const el = $('toast');
        el.textContent = msg;
        if (opts.actionLabel) {
            const btn = document.createElement('button');
            btn.className = 'toast-action';
            btn.textContent = opts.actionLabel;
            btn.addEventListener('click', () => { el.hidden = true; opts.onAction(); });
            el.append(btn);
        }
        el.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { el.hidden = true; }, opts.actionLabel ? 9000 : 2600);
    }

    async function api(method, path, body) {
        const res = await fetch(path, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Request failed (${res.status})`);
        }
        return res.json();
    }

    /* ---------------- theme ---------------- */

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        $('iconSun').hidden = theme !== 'dark';
        $('iconMoon').hidden = theme === 'dark';
        $('heroTitle').textContent = theme === 'dark'
            ? 'Tonight’s lineup, curated'
            : 'The stories waiting for you';
        localStorage.setItem('ab-theme', theme);
    }

    function initTheme() {
        const saved = localStorage.getItem('ab-theme');
        const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        applyTheme(saved || preferred);
        $('themeToggle').addEventListener('click', () => {
            const cur = document.documentElement.getAttribute('data-theme');
            applyTheme(cur === 'dark' ? 'light' : 'dark');
        });
    }

    /* ---------------- rendering ---------------- */

    function heroSummary() {
        const n = library.length;
        const done = library.filter(i => i.status === 'completed').length;
        const watching = library.filter(i => i.status === 'watching').length;
        const rated = library.filter(i => i.averageRating > 0);
        const avg = rated.length ? (rated.reduce((s, i) => s + i.averageRating, 0) / rated.length).toFixed(2) : '—';
        $('heroSub').textContent =
            `${n} titles in the library · ${watching} in progress · ${done} finished · average rating ${avg}`;
    }

    function renderTabs() {
        const counts = { all: library.length };
        STATUSES.forEach(s => { counts[s] = library.filter(i => i.status === s).length; });
        $('statusTabs').innerHTML = TABS.map(t => `
            <button class="status-tab ${state.tab === t ? 'active' : ''}" data-tab="${t}">
                ${t === 'all' ? 'All' : STATUS_LABELS[t]}
                <span class="count">${counts[t]}</span>
            </button>`).join('');
        $('statusTabs').querySelectorAll('.status-tab').forEach(btn =>
            btn.addEventListener('click', () => { state.tab = btn.dataset.tab; render(); }));
    }

    function populateGenres() {
        const genres = [...new Set(library.flatMap(i => i.genres || []))].sort();
        const sel = $('genreSelect');
        const current = state.genre;
        sel.innerHTML = '<option value="">All genres</option>' +
            genres.map(g => `<option value="${esc(g)}" ${g === current ? 'selected' : ''}>${esc(g)}</option>`).join('');
    }

    function visibleItems() {
        let items = library.slice();
        if (state.tab !== 'all') items = items.filter(i => i.status === state.tab);
        if (state.search) {
            const q = state.search.toLowerCase();
            items = items.filter(i =>
                i.title.toLowerCase().includes(q) || (i.fetchedTitle || '').toLowerCase().includes(q));
        }
        if (state.genre) items = items.filter(i => (i.genres || []).includes(state.genre));
        if (state.sort === 'title') {
            items.sort((a, b) => a.title.localeCompare(b.title));
        } else {
            items.sort((a, b) => score(b, state.sort) - score(a, state.sort));
        }
        return items;
    }

    function cardHTML(item) {
        const tier = getTier(item.averageRating);
        const meta = [item.year, item.format, item.episodes ? `${item.episodes} EP` : null]
            .filter(Boolean).join(' · ');
        const pct = item.episodes ? Math.min(100, (item.progress / item.episodes) * 100) : 0;
        const showBar = item.status === 'watching' && item.progress > 0 && item.episodes;
        return `
        <article class="card" data-title="${esc(item.title)}" tabindex="0" role="button"
                 aria-label="${esc(item.fetchedTitle || item.title)}">
            <div class="card-img">
                ${item.image
                    ? `<img src="${esc(item.image)}" alt="" loading="lazy">`
                    : `<div class="no-img">${esc((item.fetchedTitle || item.title).slice(0, 1))}</div>`}
                <span class="tier-badge tier-${tier}">${tier}</span>
                <span class="status-chip st-${item.status}">${STATUS_LABELS[item.status]}</span>
                ${showBar ? `<div class="card-progress"><span style="width:${pct}%"></span></div>` : ''}
            </div>
            <div class="card-body">
                <h3 class="card-title">${esc(item.fetchedTitle || item.title)}</h3>
                <div class="card-meta">${esc(meta || '—')}</div>
                <div class="card-rating">
                    <span class="num">${item.averageRating > 0 ? item.averageRating.toFixed(2) : '—'}</span>
                    <span class="lbl">avg</span>
                </div>
            </div>
        </article>`;
    }

    function render() {
        heroSummary();
        renderTabs();
        const items = visibleItems();
        grid.classList.toggle('list-view', state.view === 'list');
        $('viewGrid').classList.toggle('active', state.view === 'grid');
        $('viewList').classList.toggle('active', state.view === 'list');
        grid.innerHTML = items.map(cardHTML).join('');
        $('emptyState').hidden = items.length > 0;

        grid.querySelectorAll('.card').forEach(card => {
            const open = () => openDetail(card.dataset.title);
            card.addEventListener('click', open);
            card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        });
    }

    /* ---------------- detail modal ---------------- */

    let activeTitle = null;

    function findItem(title) {
        return library.find(i => i.title === title);
    }

    function openDetail(title) {
        activeTitle = title;
        renderDetail();
        $('modalBackdrop').hidden = false;
        document.body.style.overflow = 'hidden';
    }

    function closeDetail() {
        activeTitle = null;
        $('modalBackdrop').hidden = true;
        document.body.style.overflow = '';
    }

    function progressQuote(item) {
        if (item.status === 'completed') return '“What a journey that was.”';
        if (!item.progress) return '“Every story starts at page one.”';
        if (item.episodes && item.progress >= item.episodes - 1) return '“So close to the finale…”';
        return '“Just one more episode…”';
    }

    function renderDetail() {
        const item = findItem(activeTitle);
        if (!item) return closeDetail();

        const tier = getTier(item.averageRating);
        const total = item.episodes || null;
        // Completed always shows a full bar, even when the episode count is unknown
        const pct = item.status === 'completed' ? 100
            : total ? Math.min(100, (item.progress / total) * 100)
                : (item.progress > 0 ? 100 : 0);
        const synopsis = plain(item.description);
        const tagline = synopsis.split(/(?<=[.!?])\s/)[0] || '';
        const al = item.anilist, mal = item.mal, imdb = item.imdb;

        const ratingRow = (label, url, val, denom) => `
            <div class="rating-row">
                <span class="rating-src">${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${label} ↗</a>` : label}</span>
                <span class="rating-val">${val ?? '—'}${val != null ? `<small> / ${denom}</small>` : ''}</span>
            </div>`;

        $('modalContent').innerHTML = `
        <div class="detail-hero" ${item.image ? `style="background-image:url('${esc(item.image)}')"` : ''}>
            <div class="detail-hero-scrim"></div>
            <div class="detail-hero-content">
                <div class="detail-genres">${(item.genres || []).slice(0, 5).map(g => `<span class="genre-chip">${esc(g)}</span>`).join('')}</div>
                <h2 class="detail-title">${esc(item.fetchedTitle || item.title)}</h2>
                ${tagline ? `<p class="detail-tagline">${esc(tagline)}</p>` : ''}
            </div>
        </div>
        <div class="detail-body">
            <div class="detail-main">
                <section class="panel" id="progressPanel">
                    <div class="progress-top">
                        <div>
                            <h3 class="panel-heading">Your progress</h3>
                            <p class="panel-eyebrow">${item.status === 'completed' ? 'Story complete' : 'Ongoing narrative'}</p>
                        </div>
                        <div class="progress-count">
                            <input id="progInput" class="progress-input" type="text" inputmode="numeric"
                                   value="${String(item.progress).padStart(2, '0')}"
                                   aria-label="Episodes watched" ${!serverMode ? 'disabled' : ''}><small> / ${total ?? '?'}</small>
                        </div>
                    </div>
                    <div class="progress-bar"><span style="width:${pct}%"></span></div>
                    <div class="progress-controls">
                        <button class="round-btn" id="progMinus" aria-label="One episode back" ${!serverMode || item.progress <= 0 ? 'disabled' : ''}>−</button>
                        <div class="progress-quote">${progressQuote(item)}</div>
                        <button class="round-btn fill" id="progPlus" aria-label="One episode forward" ${!serverMode || (total && item.progress >= total) ? 'disabled' : ''}>+</button>
                    </div>
                </section>
                <section class="panel">
                    <h3 class="panel-heading">Shelf</h3>
                    <p class="panel-eyebrow">Where does this story live?</p>
                    <div class="status-pills">
                        ${STATUSES.map(s => `<button class="status-pill ${item.status === s ? 'active' : ''}" data-status="${s}" ${!serverMode ? 'disabled' : ''}>${STATUS_LABELS[s]}</button>`).join('')}
                    </div>
                </section>
                <section>
                    <h3 class="panel-heading">Synopsis</h3>
                    <p class="synopsis">${esc(synopsis) || 'No description available.'}</p>
                </section>
                <section class="panel">
                    <h3 class="panel-heading">Personal journal</h3>
                    <p class="panel-eyebrow">Notes to your future self</p>
                    <textarea class="notes-area" id="notesArea" placeholder="${serverMode ? 'What did this story leave you with?' : 'Notes are editable when running the local server.'}" ${!serverMode ? 'disabled' : ''}>${esc(item.notes)}</textarea>
                    <p class="notes-hint" id="notesHint"></p>
                </section>
            </div>
            <aside class="detail-side">
                <section class="panel ratings-panel">
                    <h3 class="panel-heading">Ratings</h3>
                    ${ratingRow('AniList', al?.url, al?.rating ?? null, 100)}
                    ${ratingRow('MyAnimeList', mal?.url, mal?.rating ?? null, 10)}
                    ${ratingRow('IMDb', imdb?.url, imdb?.rating ?? null, 10)}
                    <div class="rating-row rating-avg">
                        <span class="rating-src">Average · Tier ${tier}</span>
                        <span class="rating-val">${item.averageRating > 0 ? item.averageRating.toFixed(2) : '—'}</span>
                    </div>
                </section>
                <section class="panel">
                    <ul class="meta-list">
                        <li><span class="k">Format</span><span class="v">${esc(item.format || '?')}</span></li>
                        <li><span class="k">Episodes</span><span class="v">${total ?? '?'}</span></li>
                        <li><span class="k">Year</span><span class="v">${item.year ?? '?'}</span></li>
                        ${item.season ? `<li><span class="k">Season</span><span class="v">${esc(item.season)}</span></li>` : ''}
                    </ul>
                </section>
                ${serverMode && item.status === 'completed' ? '<div id="upNext"></div>' : ''}
                ${serverMode ? `
                <div class="side-actions">
                    <button class="ghost-btn" id="refetchBtn">Refetch ratings</button>
                    <button class="ghost-btn danger" id="removeBtn">Remove from library</button>
                </div>` : ''}
            </aside>
        </div>`;

        if (!serverMode) return;

        $('progMinus').addEventListener('click', () => stepProgress(item, -1));
        $('progPlus').addEventListener('click', () => stepProgress(item, +1));

        const progInput = $('progInput');
        progInput.addEventListener('change', () => {
            const v = parseInt(progInput.value, 10);
            if (Number.isNaN(v)) renderDetail(); // revert junk input
            else applyProgress(item, v);
        });
        progInput.addEventListener('keydown', e => { if (e.key === 'Enter') progInput.blur(); });
        progInput.addEventListener('focus', () => progInput.select());

        document.querySelectorAll('.status-pill').forEach(btn =>
            btn.addEventListener('click', () => setStatus(item, btn.dataset.status)));

        const notes = $('notesArea');
        let notesTimer;
        notes.addEventListener('input', () => {
            $('notesHint').textContent = 'Writing…';
            clearTimeout(notesTimer);
            notesTimer = setTimeout(async () => {
                try {
                    const updated = await api('PATCH', '/api/anime', { title: item.title, notes: notes.value });
                    Object.assign(item, { notes: updated.notes });
                    $('notesHint').textContent = 'Saved';
                    setTimeout(() => { if ($('notesHint')) $('notesHint').textContent = ''; }, 1500);
                } catch (e) {
                    $('notesHint').textContent = `Could not save: ${e.message}`;
                }
            }, 600);
        });

        $('refetchBtn').addEventListener('click', async () => {
            $('refetchBtn').textContent = 'Refetching…';
            try {
                const updated = await api('POST', '/api/refetch', { title: item.title });
                replaceItem(updated);
                renderDetail();
                render();
                toast('Ratings refreshed');
            } catch (e) {
                toast(`Refetch failed: ${e.message}`);
                renderDetail();
            }
        });

        loadUpNext(item); // no-op unless the "Up next" slot rendered (completed items)

        $('removeBtn').addEventListener('click', async () => {
            if (!confirm(`Remove "${item.fetchedTitle || item.title}" from your library?`)) return;
            try {
                await api('DELETE', '/api/anime', { title: item.title });
                library = library.filter(i => i.title !== item.title);
                closeDetail();
                render();
                toast('Removed from library');
            } catch (e) {
                toast(`Remove failed: ${e.message}`);
            }
        });
    }

    function replaceItem(updated) {
        const idx = library.findIndex(i => i.title === updated.title);
        if (idx !== -1) library[idx] = updated; else library.push(updated);
    }

    async function applyProgress(item, next) {
        const total = item.episodes || null;
        next = Math.max(0, next);
        if (total) next = Math.min(total, next);
        if (next === item.progress) { renderDetail(); return; }

        const patch = { title: item.title, progress: next };
        // Starting a show moves it to Watching; finishing it moves it to Completed.
        if (next > 0 && total && next >= total) patch.status = 'completed';
        else if (next > 0 && item.status === 'backlog') patch.status = 'watching';
        else if (total && item.status === 'completed' && next < total) patch.status = 'watching';

        try {
            const updated = await api('PATCH', '/api/anime', patch);
            replaceItem(updated);
            renderDetail();
            render();
            if (patch.status === 'completed') {
                toast('Marked as completed — congrats!');
                offerSequel(updated);
            }
        } catch (e) {
            toast(`Could not update progress: ${e.message}`);
        }
    }

    function stepProgress(item, delta) {
        return applyProgress(item, item.progress + delta);
    }

    async function setStatus(item, status) {
        if (status === item.status) return;
        const patch = { title: item.title, status };
        // Completed implies fully watched — snap progress when the count is known.
        // Backlog implies not started — reset progress.
        // Other moves away from completed leave progress untouched.
        if (status === 'completed' && item.episodes) patch.progress = item.episodes;
        if (status === 'backlog') patch.progress = 0;
        try {
            const updated = await api('PATCH', '/api/anime', patch);
            replaceItem(updated);
            renderDetail();
            render();
            if (status === 'completed') offerSequel(updated);
        } catch (e) {
            toast(`Could not change status: ${e.message}`);
        }
    }

    /* ---------------- sequel nudge ---------------- */

    async function fetchSequel(item) {
        if (!serverMode) return null;
        try {
            const res = await api('GET', `/api/sequel?title=${encodeURIComponent(item.title)}`);
            return res.sequel || null;
        } catch { return null; }
    }

    async function offerSequel(item) {
        const sequel = await fetchSequel(item);
        if (!sequel) return;
        toast(`Next up: ${sequel.title}`, {
            actionLabel: 'Add to backlog',
            onAction: () => addAnime(sequel.title, sequel.id)
        });
    }

    // Fills the detail sidebar's "Up next" slot for completed items
    async function loadUpNext(item) {
        if (!$('upNext')) return;
        const sequel = await fetchSequel(item);
        const holder = $('upNext'); // re-check: modal may have re-rendered meanwhile
        if (!sequel || !holder || activeTitle !== item.title) return;
        const meta = [sequel.year, sequel.format, sequel.episodes ? `${sequel.episodes} EP` : null]
            .filter(Boolean).join(' · ');
        holder.innerHTML = `
            <section class="panel up-next">
                <h3 class="panel-heading">Up next</h3>
                <p class="panel-eyebrow">The story continues</p>
                <div class="up-next-row">
                    ${sequel.image ? `<img src="${esc(sequel.image)}" alt="">` : ''}
                    <div>
                        <p class="up-next-title">${esc(sequel.title)}</p>
                        <p class="up-next-meta">${esc(meta)}</p>
                    </div>
                </div>
                <button class="pill-btn up-next-add">Add to backlog</button>
            </section>`;
        holder.querySelector('.up-next-add').addEventListener('click', () => {
            closeDetail();
            addAnime(sequel.title, sequel.id);
        });
    }

    /* ---------------- add anime ---------------- */

    function initAddBox() {
        const box = $('addBox');
        const input = $('addInput');
        const results = $('addResults');
        box.hidden = false;

        let timer;
        input.addEventListener('input', () => {
            clearTimeout(timer);
            const q = input.value.trim();
            if (q.length < 2) { results.hidden = true; return; }
            timer = setTimeout(async () => {
                try {
                    const found = await api('GET', `/api/search?q=${encodeURIComponent(q)}`);
                    if (!found.length) {
                        results.innerHTML = '<div class="add-result-note">No matches on AniList.</div>';
                    } else {
                        results.innerHTML = found.map(r => `
                            <button class="add-result" data-title="${esc(r.title)}" data-id="${r.id || ''}">
                                ${r.image ? `<img src="${esc(r.image)}" alt="">` : '<img alt="">'}
                                <span>
                                    <span class="add-result-title">${esc(r.title)}</span><br>
                                    <span class="add-result-meta">${[r.year, r.format, r.episodes ? `${r.episodes} EP` : null].filter(Boolean).join(' · ')}</span>
                                </span>
                            </button>`).join('');
                        results.querySelectorAll('.add-result').forEach(btn =>
                            btn.addEventListener('click', () => addAnime(btn.dataset.title, Number(btn.dataset.id) || undefined)));
                    }
                    results.hidden = false;
                } catch (e) {
                    results.innerHTML = `<div class="add-result-note">Search failed: ${esc(e.message)}</div>`;
                    results.hidden = false;
                }
            }, 350);
        });

        document.addEventListener('click', e => {
            if (!box.contains(e.target)) results.hidden = true;
        });
        input.addEventListener('keydown', e => { if (e.key === 'Escape') results.hidden = true; });
    }

    async function addAnime(title, anilistId) {
        $('addResults').hidden = true;
        $('addInput').value = '';
        toast(`Adding "${title}" — fetching ratings…`);
        try {
            const result = await api('POST', '/api/anime', { title, anilistId });
            replaceItem(result);
            state.tab = 'backlog';
            render();
            toast(`"${result.fetchedTitle || title}" added to your backlog`);
        } catch (e) {
            toast(`Could not add: ${e.message}`);
        }
    }

    /* ---------------- surprise me ---------------- */

    function surpriseMe() {
        const pool = library.filter(i => i.status === 'backlog' && i.averageRating >= 8)
            .concat(library.filter(i => i.status === 'backlog' && i.averageRating >= 7.5));
        const candidates = pool.length ? pool : library.filter(i => i.status === 'backlog');
        const pick = (candidates.length ? candidates : library)[Math.floor(Math.random() * (candidates.length || library.length))];
        if (!pick) return;

        state.tab = 'all';
        state.search = '';
        $('searchInput').value = '';
        state.genre = '';
        render();

        const card = grid.querySelector(`.card[data-title="${CSS.escape(pick.title)}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('spotlight');
            setTimeout(() => card.classList.remove('spotlight'), 2500);
            setTimeout(() => openDetail(pick.title), 1200);
        }
    }

    /* ---------------- init ---------------- */

    async function verifyServer() {
        if (!serverMode) return;
        try {
            const fresh = await api('GET', '/api/library');
            library = fresh;
            initAddBox();
            populateGenres();
            render();
        } catch {
            serverMode = false; // opened statically; keep read-only
        }
    }

    function init() {
        initTheme();

        $('searchInput').addEventListener('input', e => { state.search = e.target.value.trim(); render(); });
        $('genreSelect').addEventListener('change', e => { state.genre = e.target.value; render(); });
        $('sortSelect').addEventListener('change', e => { state.sort = e.target.value; render(); });
        $('viewGrid').addEventListener('click', () => { state.view = 'grid'; localStorage.setItem('ab-view', 'grid'); render(); });
        $('viewList').addEventListener('click', () => { state.view = 'list'; localStorage.setItem('ab-view', 'list'); render(); });
        $('surpriseBtn').addEventListener('click', surpriseMe);

        $('modalClose').addEventListener('click', closeDetail);
        $('modalBackdrop').addEventListener('click', e => { if (e.target === $('modalBackdrop')) closeDetail(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('modalBackdrop').hidden) closeDetail(); });

        populateGenres();
        render();
        verifyServer();
    }

    init();
})();
