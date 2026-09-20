---
name: Whimsical Forest
colors:
  surface: '#fcf9f3'
  surface-dim: '#dcdad4'
  surface-bright: '#fcf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ed'
  surface-container: '#f0eee8'
  surface-container-high: '#ebe8e2'
  surface-container-highest: '#e5e2dc'
  on-surface: '#1c1c18'
  on-surface-variant: '#42493e'
  inverse-surface: '#31312d'
  inverse-on-surface: '#f3f0ea'
  outline: '#72796e'
  outline-variant: '#c2c9bb'
  surface-tint: '#3b6934'
  primary: '#154212'
  on-primary: '#ffffff'
  primary-container: '#2d5a27'
  on-primary-container: '#9dd090'
  inverse-primary: '#a1d494'
  secondary: '#00668a'
  on-secondary: '#ffffff'
  secondary-container: '#87d2fd'
  on-secondary-container: '#005b7c'
  tertiary: '#572f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#784300'
  on-tertiary-container: '#ffb268'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bcf0ae'
  primary-fixed-dim: '#a1d494'
  on-primary-fixed: '#002201'
  on-primary-fixed-variant: '#23501e'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#84cffa'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#ffb874'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6b3b00'
  background: '#fcf9f3'
  on-background: '#1c1c18'
  surface-variant: '#e5e2dc'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-desktop: 40px
  container-padding-mobile: 20px
  gutter: 24px
  stack-gap: 16px
---

## Brand & Style
The design system is a digital tribute to the hand-painted, nostalgic aesthetic of classic animation. It targets users seeking an emotional, slow-tech experience that prioritizes comfort, warmth, and a sense of wonder. 

The design style is **Tactile & Organic**, blending watercolor-inspired surfaces with soft, illustrative depth. It avoids the clinical precision of modern SaaS in favor of "imperfect" beauty. Key visual traits include:
- **Hand-Painted Textures:** Subtle paper grain and watercolor washes on container backgrounds.
- **Organic Softness:** High roundedness and fluid, non-geometric shapes that feel like polished river stones.
- **Nostalgic Atmosphere:** A focus on natural lighting and high-quality serif typography to evoke a "storybook" feel.

## Colors
The palette is derived from natural landscapes—forest canopies, summer skies, and aged parchment.

- **Primary (Forest Green):** A deep, grounded green used for call-to-actions and primary navigation elements.
- **Secondary (Sky Blue):** A soft, breezy blue used for accents, links, and supportive UI elements.
- **Tertiary (Sunset Ochre):** A warm, earthy orange used sparingly for highlights or notification badges to add a "pop" of warmth.
- **Neutral (Cream Parchment):** The foundation of the design system. Instead of pure white, this warm cream reduces eye strain and provides a paper-like canvas.

Surface colors should utilize subtle gradients (top-down) to mimic watercolor drying patterns, moving from a slightly more saturated tint to the base neutral.

## Typography
The typographic hierarchy balances editorial elegance with modern readability. 

**Playfair Display** serves as the emotional anchor. Use it for large titles and storytelling moments. It should always feel "inked" onto the page, using the deep Forest Green rather than pure black.

**Plus Jakarta Sans** provides a friendly, soft-geometric counterpart for functional text. Its open counters and rounded terminals complement the organic shape language while ensuring the UI remains accessible and easy to navigate. Large body text (body-lg) is preferred for long-form reading to maintain a "storybook" pace.

## Layout & Spacing
The layout follows a **Fluid Grid** model with generous "breathing room" (white space). The goal is to avoid density and clutter.

- **Desktop:** A 12-column grid with wide margins (40px+) to center the content like a book layout.
- **Mobile:** A single-column flow with 20px side margins. 
- **Rhythm:** Use an 8px base unit. Vertical spacing between sections should be intentionally large (64px to 96px) to signify a transition in the "narrative" of the interface. 

Avoid harsh dividers; use spacing and subtle background color shifts to define areas.

## Elevation & Depth
In this design system, depth is achieved through **Tonal Layers** and **Ambient Shadows** rather than stark borders.

- **Shadows:** Use extremely soft, diffused shadows with a slight color tint derived from the Primary Green (#2D5A27 at 5-10% opacity). Shadows should feel like they are cast by soft, natural light.
- **Layering:** Elements "lift" off the page using subtle paper textures. A "Card" is not just a white box; it is a slightly lighter cream surface with a very faint watercolor-edge border (1px, low opacity).
- **Interactive Depth:** On hover, elements shouldn't just "glow"—they should appear to physically rise or expand slightly, mimicking the tactile feel of a pop-up book.

## Shapes
The shape language is dominated by **Rounded** and **Organic** forms. 

Standard components use a `0.5rem` radius, while larger containers (Cards, Modals) use `1.5rem` to feel more like natural, hand-drawn enclosures. Avoid any sharp 90-degree angles. To further the whimsical feel, consider using "squircle" masks for imagery and subtle, non-uniform corner radii where the platform permits to simulate a hand-cut paper effect.

## Components
- **Buttons:** Primary buttons are pill-shaped with a soft top-to-bottom gradient of Forest Green. Text is "Cream Parchment." Secondary buttons use a thick 2px Forest Green border with a transparent center.
- **Cards:** Cards use the Neutral background with a `rounded-xl` corner. Apply a subtle "Grain" overlay (SVG filter) to the card surface to mimic paper.
- **Input Fields:** Fields are soft-filled with a slightly darker cream than the background. Borders only appear on focus, using the Sky Blue accent.
- **Chips/Labels:** Use the Secondary Sky Blue at low opacity with Primary-colored text. These should look like small, smooth pebbles.
- **Selection Controls:** Checkboxes and Radio buttons are fully rounded. When "Checked," they should feature a custom "leaf" or "seed" icon rather than a generic tick.
- **Decorative Dividers:** Instead of lines, use organic flourishes like a centered three-dot motif or a subtle horizontal watercolor brush stroke.