# Sayantika Sahu — Portfolio

Static site, no build step. Light editorial design; the page colour shifts with each photo series.

## Images
Web-ready, colour-graded WebP files live in `assets/img/` (`*-sm.webp` for the grid, full size for the lightbox).
Untouched originals are in `originals/` (git-ignored; too large for GitHub Pages).

## Deploy on GitHub Pages
1. `git init && git add . && git commit -m "Portfolio"`
2. Create a repo on GitHub, push to `main`.
3. Repo → Settings → Pages → Source: *Deploy from a branch* → `main` / root.

## Local preview
`python -m http.server 5173` → http://localhost:5173
