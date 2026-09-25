# Design System — Implementation Brief

You are implementing a visual redesign of this website. Apply the design system below consistently across every page and component. Do not invent new colors, radii, or shadows — use only the tokens defined here. If a value is missing for a case you encounter, derive it from the nearest existing token and note it in your summary.

## 1. Design direction

- **Mood:** calm, premium, trustworthy. Soft pale-green light sections alternating with near-black "dark" sections that carry a subtle green glow.
- **Surfaces:** white cards with large rounded corners and very soft, wide shadows. Lots of whitespace.
- **Accent:** emerald green. A green→gold gradient is used for progress indicators only.
- **Typography:** bold geometric sans with tight tracking on headings; relaxed, muted body copy; small uppercase letter-spaced "eyebrow" labels above section headings.

## 2. Tokens

Define these as CSS custom properties in the global stylesheet (e.g. `globals.css`) and reference them everywhere. Never hard-code hex values in components.

```css
:root {
  /* Light theme — page */
  --bg: #E8F1E3;
  --bg-gradient: linear-gradient(120deg, #E5F1D7 0%, #E8F1E3 50%, #DDECE4 100%);
  --surface: #FFFFFF;
  --text: #122119;
  --text-muted: #5C6B62;
  --text-subtle: #8A958D;

  /* Brand */
  --primary: #067353;        /* eyebrows, icons, links */
  --primary-bright: #01A978; /* step numbers, highlights */
  --primary-tint: #DFF4EE;   /* icon tile backgrounds, subtle fills */

  /* Dark sections */
  --dark: #101213;
  --dark-green: #0E1A15;
  --dark-glow: #0F2A24;
  --dark-panel: #202426;
  --dark-input: #2B2F33;
  --dark-border: #2A2F30;
  --dark-text: #F0EDE8;
  --dark-muted: #878E96;
  --dark-subtle: #5C6572;    /* placeholders, inactive tabs */
  --neon: #01E5A9;           /* eyebrow + active state on dark */
  --mint: #9FDCAF;           /* links on dark */
  --gold: #EAAA47;

  /* Gradients */
  --progress: linear-gradient(90deg, #3AD691, #EAAA47);
  --banner: linear-gradient(135deg, #124237, #0F342C);
  --dark-section: radial-gradient(ellipse at top left, #0F2A24 0%, #101213 55%);

  /* Typography */
  --font-sans: "Manrope", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Radius */
  --radius-sm: 12px;   /* inputs, small tiles */
  --radius-md: 24px;   /* cards, banners */
  --radius-lg: 40px;   /* full-width dark sections */
  --radius-pill: 999px;/* buttons, badges */

  /* Shadows */
  --shadow-card: 0 20px 50px rgba(18, 33, 25, 0.08);
  --shadow-float: 0 30px 60px rgba(0, 0, 0, 0.25);

  /* Layout */
  --container: 1120px;
  --section-y: 96px;
  --gutter: 24px;
}
```

Load Manrope from Google Fonts (weights 400, 500, 600, 700, 800). If the project uses Next.js, use `next/font/google`.

If the project uses Tailwind, map every token above into `theme.extend` (colors, borderRadius, boxShadow, fontFamily, maxWidth) and use the Tailwind names instead of raw CSS variables.

## 3. Typography scale

| Style | Size (desktop / mobile) | Weight | Line height | Letter spacing | Color |
|---|---|---|---|---|---|
| H1 (hero) | 64px / 40px | 800 | 1.02 | -0.035em | `--text` or `--dark-text` |
| H2 (section) | 50px / 34px | 700 | 1.05 | -0.03em | `--text` or `--dark-text` |
| H3 (card title) | 20px | 700 | 1.3 | -0.01em | `--text` |
| Body large | 18px | 400 | 1.65 | 0 | `--text-muted` |
| Body | 16px | 400 | 1.6 | 0 | `--text-muted` |
| Eyebrow | 12px | 700 | 1 | 0.14em, uppercase | `--primary` (light) / `--neon` (dark) |
| Form label | 12px | 700 | 1 | 0.06em, uppercase | `--dark-muted` |
| Step number | 22px | 700 | 1 | 0 | `--primary-bright` |
| Footnote | 13px | 400 | 1.5 | 0 | `--text-subtle` |

Rules:
- Every section heading has an eyebrow above it (12–16px gap) and optional muted intro paragraph below it (max-width ~620px, 16px gap).
- Headings never exceed ~14 words per line; constrain H2 width to ~700px.

## 4. Layout & spacing

- Container: `max-width: var(--container)`, centered, 24px side padding (16px on mobile).
- Section vertical padding: 96px desktop, 64px mobile.
- Page body background: `var(--bg-gradient)` fixed to the viewport.
- Spacing scale (use only these): 4, 8, 12, 16, 24, 32, 48, 64, 96px.
- Card grids: 3 columns desktop → 2 tablet → 1 mobile, 24px gap.
- No horizontal scroll at any width down to 360px.

## 5. Components

### Buttons
- **Primary (on light):** background `--text`, text white, pill radius, padding 14px 28px, 15px weight 700. Hover: background `--primary`.
- **Primary (on dark / banner):** background white, text `--text`, pill radius. Hover: background `--primary-tint`.
- **Ghost link:** text `--primary` weight 600 with trailing "→"; on dark use `--mint`.
- Transitions: 150ms ease on background, color, transform. Hover lift `translateY(-1px)`.

### Feature card
- Background `--surface`, radius `--radius-md`, padding 32px, shadow `--shadow-card`, no border.
- Icon tile: 48×48px, radius 14px, background `--primary-tint`, icon 22px in `--primary`.
- Then 24px gap → H3 → 8px gap → body text.

### Step card
- Same as feature card, but starts with a step number ("01", "02") in the step-number style, then 12px gap → H3 → body.

### CTA banner
- Background `--banner`, radius `--radius-md`, padding 40px 32px, shadow `--shadow-float`.
- Text color `#D6D8D4` at 17px; white pill button right-aligned (stacks below text on mobile).
- May overlap the bottom edge of the preceding dark hero section (negative margin-top) to create a floating effect.

### Dark section
- Full-width block with radius `--radius-lg` on the top corners (or all corners if inset), background `var(--dark-section)`.
- Heading `--dark-text`, body `--dark-muted`, eyebrow `--neon`.
- Optional subtle dot-grid texture: `radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)` at 24px size.

### Stepper / progress bar (dark)
- Track: 3px high, `--dark-panel` color, full width.
- Fill: `--progress` gradient, width = current step / total steps.
- Step labels beneath: 12px, uppercase, weight 700, letter spacing 0.14em, evenly distributed; active in `--neon`, inactive in `--dark-subtle`.
- Above the step heading: "STEP 1 OF 4" in form-label style, `--dark-subtle`.

### Form panel (dark)
- Container: background `--dark-panel`, border 1px `--dark-border`, radius `--radius-md`, padding 24px.
- Two-column field grid on desktop (24px gap), single column on mobile.
- Label: form-label style, 8px above input.
- Input: background `--dark-input`, border 1px `--dark-border`, radius `--radius-sm`, height 50px, padding 0 16px, text `--dark-text`, placeholder `--dark-subtle`.
- Focus: border `--neon`, plus `box-shadow: 0 0 0 3px rgba(1, 229, 169, 0.15)`. No default outline.

### Browser mockup frame (optional, for product previews)
- Background `--dark-green`, radius 16px, top bar 44px with `--dark-border` bottom border.
- Traffic-light dots 12px: `#FE6158`, `#FDBC2F`, `#2BC841`.
- Centered URL pill: background `#0D1814`, radius 8px, text in `--font-mono` 12px `--dark-muted`.

### Navbar
- Transparent over the page, 72px tall, container width.
- Logo left, links centered (15px, weight 500, `--text-muted`, hover `--text`), Login ghost + Sign up primary button right.
- On dark backgrounds, links use `--dark-muted` and hover `--dark-text`.
- Mobile: collapse links into a menu button below 768px.

### Footer
- Light background, top border `rgba(18,33,25,0.08)`.
- Brand + one-line description left; link columns (Product, Legal, Contact) with 13px uppercase column headings in `--text` and links in `--text-muted`.
- Bottom row: copyright in footnote style.

## 6. Accessibility & quality bar

- Body text contrast must meet WCAG AA (4.5:1). `--text-muted` on `--bg` passes; do not use `--text-subtle` for anything longer than a footnote.
- All interactive elements have visible focus states (use the neon focus ring on dark, `--primary` ring on light).
- Respect `prefers-reduced-motion`: disable transforms and transitions.
- Use semantic HTML (`header`, `main`, `section`, `footer`, proper heading order).

## 7. Implementation steps

1. Add the tokens (section 2) and font loading to the global stylesheet / Tailwind config.
2. Set base styles: body font, background gradient, heading and paragraph defaults from section 3.
3. Build reusable components from section 5 (Button, Card, StepCard, CTABanner, DarkSection, Stepper, Input, Navbar, Footer).
4. Replace existing ad-hoc styles on every page with these components and tokens.
5. Verify at 360px, 768px, 1280px and 1440px widths; fix any overflow or cramped spacing.
6. Report back: files changed, components created, and any place you had to deviate from this spec and why.