# Sayantika Sahu — Portfolio

Static site with no build step. It is hosted on GitHub Pages from `main` at the repo root.

```
index.html              Home: the swatch rail (WebGL cloth), about, skills, workbook, contact
garment/index.html      N°01 Garment Collection: Beneath the Canopy, 17 portfolio pages in order
styling/index.html      N°02 Styling & Photography: three shoots, each a short text + photo grid
product/index.html      N°03 Product Photography: the fragrance shoot
modelling/index.html    Old modelling page. No longer linked from the site.
assets/css/core.css     design tokens, type, header, cursor, reveals, lightbox
assets/css/shell.css    shared by every page: Index label, cloth curtain, swatch-book menu
assets/css/home.css     home page
assets/css/gallery.css  garment, styling and product pages
assets/css/atelier.css  modelling page
assets/js/site.js       SECTIONS list, curtain page transitions, swatch-book menu
assets/js/fx.js         Lenis smooth scroll, reveals, tone shifts, cursor, lightbox
assets/js/swatchbook.js three.js cloth shader for the home rail
assets/img/sp/          shoot images (`*-sm.webp` for the page, full size for the lightbox)
assets/img/gc/          garment collection pages (`gc-NN-sm.webp` 1000px, `gc-NN.webp` 2200px)
```

Libraries load from jsdelivr at pinned versions: three 0.170.0, GSAP 3.13.0 + ScrollTrigger, Lenis 1.3.4.
Fonts are Instrument Serif, Geist and Geist Mono, from Google Fonts.

## Adding a section
1. Create a folder with an `index.html`, copying the structure of `garment/index.html`.
2. In `assets/js/site.js`, add an entry to `SECTIONS` with `href`, `img`, `note`, `color` and `fg`.
3. In `index.html`, add a `.slot` to the rail with `data-img`, and set the link's `href`, `data-color`, `data-fg` and `data-title`. Update the `.rack` column count in `home.css`.

## Images
Untouched originals live in `originals/`, which is git-ignored because it's too large for Pages.
Shoot photos are resized only, with no regrade. Full size is 2000px on the long edge at q84; `-sm` is 900px (1100px for landscape) at q80.

## Local preview
`python -m http.server 5173`, then open http://localhost:5173 (hard-refresh after edits; the browser caches JS/CSS)
