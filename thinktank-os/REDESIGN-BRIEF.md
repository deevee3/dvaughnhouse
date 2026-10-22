# REBRAND BRIEF — thinktank-os (.org + store) — Impeccable pass #3, 2026-10-21

World: **Glenride, identical tokens to the gateway** (dvaughnhouse.com, shipped 2026-10-21 — see
gateway-com/DESIGN.md). Modes: .org = Read/Operate (institutional); store = Persuade, restrained.
Copy is FROZEN. Working tree only — no commit, push, or deploy.
Welcome.jsx is UNROUTED Breeze residue (the .org home is Library/Index) — do not spend effort on it; note it as dead code in your report.

## Tokens (tailwind.config.js — replace the empty extend)
paper #FAF5EC · paper-deep #F3ECDC · ink #221D18 · ink-soft #57504A · sienna #E97451 ·
sienna-deep #B84A2B · line = ink 12%. Dark world (Tailwind default 'media' strategy, add dark:
variants): night #1B1611 · night-deep #241D16 · night-card #2A231C · cream #F3ECDC ·
cream-soft #CFC6B4 · line-dark = paper 14%.
Type: display = 'Bricolage Grotesque' 700/800; body/serif = 'Newsreader' 400/500/600 + italics.
Load via Bunny Fonts in app.blade.php (replace the Figtree link; verify the URL returns 200):
family=bricolage-grotesque:700,800|newsreader:400,400i,500,500i,600,600i
Set fontFamily: display + serif (Newsreader as the default body face via app.css base layer).

## Contrast law (verified on the gateway — do not re-derive)
White on sienna = 2.97:1 FAILS. Buttons: sienna fill + INK text (5.63:1); hover sienna-deep + paper
text. Sienna-deep for text on paper (4.77:1); sienna #E97451 is fills/large display only, never
body text. Dark grounds: sienna as text passes (5.2–6.1:1); sienna-deep as dark text fails — don't.

## Scope
1. tailwind.config.js tokens + app.css base (body ground/type, selection color = sienna family).
2. Shared chrome: InstitutionalHeader, SiteFooter, GuestLayout.
3. Shared components: PrimaryButton, SecondaryButton, TextInput, NavLink, ResponsiveNavLink,
   Checkbox, Dropdown — retoken (indigo focus rings → sienna-deep; slate text → ink family).
4. Public pages: Library/Index, Library/Show, Library/Thesis, Sops/Index, Sops/Show,
   Standards/Show, Essays/Index, Essays/Show.
5. Store/Index: full treatment — kill the slate-900→950 gradient hero (flat ink/night band or
   paper hero; NO gradient), white-on-sienna buttons → ink-on-sienna, slate surfaces → paper/night
   tokens, keep its mono accents only for prices/labels.
6. Auth pages + Dashboard/Portfolio/Manuscripts/Profile: inherit via shared components/layouts
   ONLY — no page-by-page restyle in this pass; note what still clashes in your report.

## Absolute bans
No purple/indigo anywhere (visual or hex). No eyebrow/kicker above a heading. No gradient text,
glass-as-decoration, hard offset shadows. Hero rule: any hero image stays a full-bleed hero —
never demoted to a card or side plate. No invented copy, no invented imagery.

## Verification (all required)
- `npm run build` passes (npm ci first if node_modules is absent).
- Grep proof: zero slate-/gray-/zinc-/indigo- classes remain in the scoped files.
- Bunny font URL returns HTTP 200.
- Report: files changed, per-page summary, contrast pairs shipped, what still clashes in the
  authenticated app, dead code noted.
