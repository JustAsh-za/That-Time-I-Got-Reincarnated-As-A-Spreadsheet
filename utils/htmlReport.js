const fs = require('fs');
const path = require('path');

const WEBAPP_DIR = path.join(__dirname, 'webapp');

function asset(name) {
    return fs.readFileSync(path.join(WEBAPP_DIR, name), 'utf-8');
}

// Render the full self-contained HTML page. serverMode enables the edit UI
// (status, progress, notes, add/remove) backed by the local API.
function renderHTML(results, { serverMode = false } = {}) {
    const payload = JSON.stringify({ results, serverMode, generatedAt: Date.now() })
        .replace(/</g, '\\u003c'); // avoid closing the script tag from data

    // Function replacements so `$`-sequences in the assets/JSON stay literal
    return asset('template.html')
        .replace('/*__STYLES__*/', () => asset('styles.css'))
        .replace('"__DATA__"', () => payload)
        .replace('/*__APP__*/', () => asset('app.js'));
}

function generateHTMLReport(results) {
    const html = renderHTML(results, { serverMode: false });
    fs.writeFileSync(path.join(__dirname, '../report.html'), html);
    console.log('HTML Report saved to report.html');
}

module.exports = generateHTMLReport;
module.exports.renderHTML = renderHTML;
module.exports.generateHTMLReport = generateHTMLReport;
