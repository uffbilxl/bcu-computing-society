# BCU Computing Society design system

The palette, type and components behind bcucompsoc.com. Tokens live in `src/app/globals.css`; Tailwind's colour names in `tailwind.config.ts` point at the same CSS variables, so both follow the active theme.

## Colour

Taken from the society logo: a navy field (`#0F1A2C`) with a bright blue accent (`#3B82F6`).

- **Dark mode** is the logo itself: navy surfaces, white text.
- **Light mode** is the logo's ink on a cool off-white.
- **Brand bands** (the home hero, the "You belong here" panel, the About mission, the footer) are navy in both themes. Text on them uses fixed light values, not theme tokens.

| Token | Use |
|---|---|
| `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-surface-hover` | Page, cards, raised areas, hover |
| `--color-border`, `--color-border-subtle` | Borders and dividers |
| `--color-text`, `--color-muted`, `--color-muted-2` | Primary, secondary and tertiary text. All pass WCAG AA (4.5:1) in both themes |
| `--color-accent` | Filled buttons and selected states (white text on it is 5.2:1) |
| `--color-accent-text` | Links and accent-coloured text on page backgrounds |
| `--color-accent-dim`, `--color-accent-border` | Tinted icon tiles, selected cells, badges |
| `--color-ok`, `--color-warn`, `--color-danger` (+ `-dim`) | Status. Each has a light and dark value; don't use fixed Tailwind shades like `amber-400`, which only read in one theme |

The legacy aliases (`--t1`…`--t4`, `--b1`…`--b3`, `--bg2`…) map onto these, so older and admin markup follows the palette. New code should use the `--color-*` names.

Colour means something: blue is for actions and selection, amber for "closing soon", green for open/OK, red for closed or errors. Opportunity types (internship, placement…) are neutral badges.

## Type

One family: Geist (loaded in `layout.tsx`). Hierarchy comes from size and weight.

- Page titles: `.page-title` with `.page-lede` underneath.
- Section headings: `.display-headline` at 26–40px.
- Body copy: 15px, line length capped around 65ch.
- Nothing below 12px.

## Components

All in the `@layer components` block of `globals.css`.

- **Buttons:** `.btn-primary`, `.btn-ghost`, `.btn-on-navy` (for navy bands), with `.btn-sm` / `.btn-lg`. One shape everywhere: 10px radius, 40px tall by default.
- **Badges:** `.badge-blue`, `-green`, `-amber`, `-red`, `-gray`.
- **Surfaces:** `.card`, and `.card-interactive` for whole-card links (lifts on hover).
- **Forms:** `.input`, `.label`.
- **Focus:** `.focus-ring` on interactive elements; anything without it still gets a visible outline.

The wordmark (`src/components/ui/Wordmark.tsx`) is set in type rather than an image, so it follows the theme.

## Motion

Two CSS utilities, both switched off for `prefers-reduced-motion`:

- `.enter`: a short rise-in as the page loads, for the first things on screen. Stagger with `style={{ '--i': n }}`.
- `.reveal`: tied to scroll position with a CSS view timeline. No JavaScript, so content can't get stuck invisible; browsers without view timelines simply show it.

Framer Motion handles state changes: the sliding nav highlight, dropdown and menu open/close, calendar month changes, committee filtering.

Avoid scroll-triggered reveals that start hidden and rely on JavaScript to show content. The old `FadeIn` component did this and left whole sections blank; it is now a plain wrapper kept for compatibility.

## Layout

- Content width: 1200px for wide pages, 960–1040px for reading pages, with `px-5 sm:px-8` gutters.
- Section rhythm: `py-20 sm:py-24`.
- Full navigation from 1024px; below that, the menu button.
- Layering uses the `--z-*` scale (sticky, dropdown, overlay, modal, toast).
