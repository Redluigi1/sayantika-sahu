# Sayantika Sahu — Portfolio

Static site with no build step. It is hosted on GitHub Pages from `main` at the repo root.

```
index.html              Home: the swatch rail (WebGL cloth), about, skills, workbook, contact
styling/index.html      N°01 Styling & Photography: four shoots
modelling/index.html    N°02 Modelling: the original modelling site, unchanged design
assets/css/core.css     design tokens, type, header, cursor, reveals, lightbox (home + styling)
assets/css/shell.css    shared by every page: Index label, cloth curtain, swatch-book menu
assets/css/home.css     home page
assets/css/styling.css  styling page
assets/css/atelier.css  modelling page
assets/js/site.js       SECTIONS list, curtain page transitions, swatch-book menu, toile textures
assets/js/fx.js         Lenis smooth scroll, reveals, tone shifts, cursor, lightbox
assets/js/swatchbook.js three.js cloth shader for the home rail
assets/js/styling.js    veil lift, memo + draggable desk + phone cord, horizontal woods, tilt
assets/img/sp/          shoot images (`*-sm.webp` for the page, full size for the lightbox)
```

Libraries load from jsdelivr at pinned versions: three 0.170.0, GSAP 3.13.0 + ScrollTrigger, Lenis 1.3.4.
Fonts are Instrument Serif, Geist, Geist Mono and Courier Prime (Office Affair memo only), all from Google Fonts.

## Adding Garment Collection / Value Addition later
1. Create `garment/index.html` (or `value-addition/`), copying the structure of `styling/index.html`.
2. In `assets/js/site.js`, edit that entry in `SECTIONS`. Remove `soon`/`toile`, then add `href: 'garment/'`, `img: 'assets/img/...-sm.webp'`, `note`, `color` and `fg`.
3. In `index.html`, edit that `.slot`. Remove `data-toile` and the `is-soon` class, then add `data-img="…"`. Point the link's `href` at the new folder and add `data-color`, `data-fg` and `data-title`.

## Images
Untouched originals live in `originals/`, which is git-ignored because it's too large for Pages.
Shoot photos are resized only, with no regrade. Full size is 2000px on the long edge at q84; `-sm` is 900px (1100px for landscape) at q80.

## Local preview
`python -m http.server 5173`, then open http://localhost:5173
