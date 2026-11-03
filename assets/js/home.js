/* Home — hero entrance, measuring-tape marquees, workbook accordion */
(() => {
  const SS = window.SS || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');

  const live = () => {
    hero?.classList.add('is-live');
    hero?.querySelectorAll('[data-chars]').forEach(el => el.classList.add('is-in'));
  };
  SS.revealed ? requestAnimationFrame(live) : document.addEventListener('ss:reveal', () => setTimeout(live, 200), { once: true });

  /* tapes: drift, and run faster with the scroll */
  const tapes = [...document.querySelectorAll('[data-tape]')].map(el => ({
    el, track: el.querySelector('.tape__track'), dir: parseFloat(el.dataset.tape), x: 0, w: 0,
  }));
  const measure = () => tapes.forEach(t => { t.w = t.track.scrollWidth / 2; });
  measure(); addEventListener('resize', measure);
  (document.fonts?.ready || Promise.resolve()).then(measure);
  let lastY = scrollY, boost = 0, visible = false;
  if (tapes.length) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(tapes[0].el.parentElement);
  const loop = () => {
    requestAnimationFrame(loop);
    const v = SS.lenis ? SS.lenis.velocity : scrollY - lastY;
    lastY = scrollY;
    boost += (Math.min(Math.abs(v) * .9, 16) - boost) * .1;
    if (!visible || reduce) return;
    tapes.forEach(t => {
      if (!t.w) return;
      t.x += t.dir * (.6 + boost) * (v < 0 ? -1 : 1);
      if (t.x <= -t.w) t.x += t.w; if (t.x > 0) t.x -= t.w;
      t.track.style.transform = `translate3d(${t.x}px,0,0)`;
    });
  };
  loop();

  /* workbook rows */
  document.querySelectorAll('.proj__row').forEach(b => b.addEventListener('click', () => {
    const li = b.closest('.proj');
    const open = !li.classList.contains('is-open');
    document.querySelectorAll('.proj.is-open').forEach(o => { o.classList.remove('is-open'); o.querySelector('.proj__row').setAttribute('aria-expanded', 'false'); });
    li.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', open);
  }));

  document.querySelectorAll('.yy').forEach(el => { el.textContent = String(new Date().getFullYear()).slice(2); });
})();
