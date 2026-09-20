# Design System Document

## 1. Overview & Creative North Star: "The Neon Curator"
This design system is built to transform the anime tracking experience from a utilitarian database into a high-end editorial gallery. The Creative North Star is **"The Neon Curator"**—a concept that blends the clinical precision of a luxury watch interface with the vibrant, kinetic energy of neo-Tokyo nightscapes.

We move beyond the "template" look by rejecting rigid, boxed grids in favor of **intentional asymmetry** and **tonal depth**. The interface should feel like a series of layered obsidian glass panels, illuminated from within by electric accents. We prioritize whitespace (or "darkspace") to let the high-quality anime key art breathe, using typography scale to create a clear, cinematic hierarchy.

---

## 2. Colors: Tonal Depth & Electric Accents
The palette is rooted in a deep, nocturnal violet (`background: #15052b`) to ensure that neon accents and vibrant anime art pop with maximum contrast.

### The "No-Line" Rule
**Explicit Instruction:** Prohibit 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background creates a natural, sophisticated edge. 

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent glass.
*   **Base:** `surface` (#15052b) - The bottom-most layer.
*   **Low Contrast:** `surface-container-low` (#1b0933) - For large secondary content areas.
*   **High Contrast:** `surface-container-high` (#291446) - For interactive cards or highlighted sections.
*   **The "Glass & Gradient" Rule:** Floating elements (like navigation bars or modals) should use a semi-transparent `surface-container` color with a `backdrop-blur` (16px–32px). This creates "Visual Soul" by allowing the background colors to bleed through softly.

### Signature Accents
*   **Primary (Electric Purple):** Use `primary` (#ca98ff) for critical actions. Apply a subtle gradient from `primary` to `primary-dim` (#9c42f4) on large CTAs to provide a premium, rounded feel.
*   **Secondary (Cyber Blue):** Use `secondary` (#00e3fd) for data-heavy accents like rating bars or episode progress.
*   **Tertiary (Neon Pink):** Use `tertiary` (#ff9bbe) sparingly for "Trending" indicators or "S-Tier" labels.

---

## 3. Typography: Editorial Authority
We utilize two distinct typefaces to balance character with readability.

*   **Display & Headlines (Space Grotesk):** This typeface provides a technical, "tech-noir" vibe. Use `display-lg` (3.5rem) for hero titles to create an unapologetic editorial feel.
*   **Body & Titles (Manrope):** A highly legible geometric sans-serif. Use `body-lg` (1rem) for synopsis text to ensure comfortable reading on mobile devices.
*   **Hierarchy as Brand:** Use `label-md` (0.75rem) in all-caps with increased letter-spacing for metadata (e.g., "STUDIO," "SEASON") to mimic high-end fashion magazine layouts.

---

## 4. Elevation & Depth: The Layering Principle
Shadows are rarely used; instead, we rely on **Tonal Layering**.

*   **Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background. This "inner-glow" or "outer-dimming" effect creates a soft, natural lift.
*   **Ambient Shadows:** If a card must "float" (e.g., a modal), use a shadow with a blur of 40px, 4% opacity, using the `on-surface` color (#efdfff) as the shadow tint.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use the `outline-variant` (#514068) at **15% opacity**. Never use 100% opaque borders; they shatter the "glass" illusion.

---

## 5. Components

### Cards & Lists
*   **The Anime Card:** Use `surface-container-highest` for the card body. Forbid divider lines. Use `8px` of vertical whitespace between metadata units. Image containers should use the `lg` (1rem) roundedness scale.
*   **Tier Labels (S, A, B):** These must be high-impact. Use `secondary` for S-Tier and `primary` for A-Tier. Apply a subtle `0.1` opacity glow of the label's own color behind the text.

### Buttons
*   **Primary:** A gradient fill from `primary` to `primary-container`. Use `xl` (1.5rem) roundedness for a modern, pill-shaped feel.
*   **Secondary:** No fill. Use a "Ghost Border" (outline-variant at 20%) with `on-surface` text.

### Inputs & Chips
*   **Search Input:** Use `surface-container-lowest` with a `secondary` 2px bottom-accent line only when focused.
*   **Selection Chips:** Use `secondary-container` for the selected state. Text should be `on-secondary-container`. Use `full` (9999px) roundedness.

### Tier Progress & Ratings
*   **Ratings:** Display IMDb/MAL scores using `display-sm` in `Space Grotesk`. The numerical value is the hero; the label "Rating" is `label-sm` in `secondary`.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins. For example, a 24px left margin and a 16px right margin on mobile can make a list feel more dynamic.
*   **Do** use `surface-bright` for hover states on dark surfaces to create a "specular highlight" effect.
*   **Do** prioritize "vibrant" imagery. If an anime has muted art, use a `primary-container` color overlay at 10% to pull it into the system’s color space.

### Don't:
*   **Don't** use pure `#000000` for backgrounds unless it is the `surface-container-lowest` for deep contrast.
*   **Don't** use standard "Drop Shadows." They feel dated. Use background color shifts.
*   **Don't** use more than three font weights. Let the font size and color (`on-surface` vs `on-surface-variant`) do the work.
*   **Don't** use icons with different stroke weights. Stick to a 1.5px or 2px consistent line weight to match the `outline` tokens.