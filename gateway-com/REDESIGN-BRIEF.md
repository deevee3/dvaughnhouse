# REDESIGN BRIEF — dvaughnhouse.com gateway (shape step, approved order 2026-10-21)

Mode: **Persuade.** World: **Glenride identity, editorial-institutional** (GLENRIDE-DESIGN-SYNTHESIS.md:
warm paper, ink, one signal accent, serif + mono, hairline grids, pill nav, restraint is credibility).
This is a token-and-treatment transplant onto the existing structure and copy. **Copy does not change.**
No commit, no push, no deploy — working tree only, for D'Vaughn's review.

## Tokens (tailwind.config.js theme.extend)
- colors: paper #FAF5EC · paper-deep #F3ECDC (alternating section ground) · ink #221D18 ·
  ink-soft #57504A (secondary text, ≥4.5:1 on paper) · sienna #E97451 · sienna-deep #B84A2B · line: ink at 12%
- darkMode: 'media' (owner's correction 2026-10-21: **dark mode is NOT retired** — it follows the
  visitor's OS, as the incumbent does, and gets its own Glenride dark world below)
- fontFamily: display = "Bricolage Grotesque" (700/800; the voice already shipped on the Dispatch Desk
  Glenride surface) · serif = "Newsreader" (body serif, 400/500/600 + italic) · mono = ui-monospace stack (labels, sources, chips only)
- Fonts: self-host via @fontsource packages imported in index.css; if npm is unreachable, Google Fonts
  <link> in index.html and note the substitution in the build report.
- Type scale (fix flat hierarchy): H1 display ~4.5–5rem tight; H2 ~2.25rem; body 1.0625rem/1.7 serif;
  every adjacent step ≥1.25×.

## Treatment rules (binding)
1. **No gradients anywhere** — delete every bg-gradient-*, the hero slate overlay, and the H1
   gradient-text span (solid ink; emphasis via sienna-deep italic serif word if needed, never a gradient).
2. **No kicker/eyebrow above any heading** — delete the hero pill (App.jsx:122) and every mono
   uppercase label sitting above an H2 (e.g. About's). Headings stand alone. Mono labels survive
   only as source lines / chips *below* content.
3. **Buttons are pills** (rounded-full). Primary: sienna fill with **ink text** (5.63:1 — white on
   sienna is banned, 2.97:1). Secondary: 1px ink border, ink text, transparent ground. No colored
   shadows, no scale-on-hover tricks; hover = sienna-deep border/fill shift only.
4. **Hero:** keep the photo, but as a framed plate on paper (hairline border, modest radius),
   not a full-bleed dark overlay. H1 and intro copy sit on paper in ink. CTAs below the copy.
5. **Cards:** paper ground, 1px line border, no glass/blur/shadow-lg, radius ≤ 1rem. Work cards keep
   their images and links; identical-grid is acceptable here only because content differs per card —
   break monotony with the serif/summary treatment, not decoration.
6. **"By the numbers" → ledger.** Keep all 4 stats and their Source lines verbatim. Restyle as
   hairline-ruled rows: value in ink display type (not amber, not extrabold-huge), label in serif,
   source in mono beneath. No metric-template styling.
7. **Header:** paper/95 with hairline bottom border; wordmark in display type, ink; nav ink-soft →
   ink on hover; Donate = primary pill. Mobile menu same tokens.
8. **Footer/sections:** alternate paper / paper-deep grounds separated by hairlines; section
   spacing rhythm 6rem; max-w-6xl measure stays.
9. All states: focus-visible rings in sienna-deep; links underlined on hover; reduced-motion respected
   (no new animation beyond a single subtle headline reveal at most — prefer none).
10. index.css base: bg paper, text ink, font serif default; selection = sienna fill, ink text.

## Dark world (media dark: variants, restyled — never slate)
- Grounds: page #1B1611 · raised/card #2A231C · alternating section #241D16
- Text: #F3ECDC primary · #CFC6B4 secondary (verify ≥4.5:1 on the dark grounds, report ratios)
- Hairlines: paper at 14%. Primary pill unchanged: sienna fill, ink text (works in both modes).
- Sienna as text on dark: #E97451 only where it verifies ≥4.5:1 at that size, else lightened
  tint #F0835F. sienna-deep #B84A2B is never small text on dark.
- Every dark: utility in the incumbent gets a warm-ink equivalent — the slate/amber purge
  applies in both modes.

## Out of scope
Copy edits, new pages, contact-function changes, asset regeneration.

## Verification (builder must do all)
- `npm run build` passes (Vite + SSR prerender).
- Impeccable detector on the prerendered dist/index.html → zero *unexplained* findings
  (cream-palette is the documented Glenride override; anything else gets fixed, not explained away).
- Grep proof: no `bg-gradient`, `bg-clip-text`, `backdrop-blur`, `slate-`, `amber-` left in src/.
- Report: files changed, build status, detector output summary, font route used (fontsource vs link).
