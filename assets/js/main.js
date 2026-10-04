/* Sayantika Sahu — portfolio interactions (shared by both designs) */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  document.documentElement.classList.add('js');

  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- page tone follows the series in view ---------- */
  const toned = document.querySelectorAll('[data-tone]');
  if (toned.length && 'IntersectionObserver' in window) {
    const body = document.body;
    const tio = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) body.dataset.tone = e.target.dataset.tone; });
    }, { rootMargin: '-45% 0px -45% 0px' });
    toned.forEach(el => tio.observe(el));
  }

  /* ---------- header state ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    let last = 0;
    addEventListener('scroll', () => {
      const y = scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      header.classList.toggle('is-hidden', y > last && y > 400);
      last = y;
    }, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  const menuBtn = document.querySelector('.menu-toggle');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.site-nav a').forEach(a => a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------- custom "view" cursor (mouse only) ---------- */
  const cursor = document.querySelector('.cursor');
  if (cursor && fine && !reduce) {
    let x = 0, y = 0, cx = 0, cy = 0;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
    const tick = () => {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(tick);
    };
    tick();
    document.querySelectorAll('[data-lightbox]').forEach(el => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-on'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
    });
  }

  /* ---------- year ---------- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- lightbox ---------- */
  const items = [...document.querySelectorAll('[data-lightbox]')];
  const box = document.querySelector('.lightbox');
  if (!box || !items.length) return;
  const img = box.querySelector('.lightbox__img');
  const cap = box.querySelector('.lightbox__caption');
  const count = box.querySelector('.lightbox__count');
  let idx = 0, lastFocus = null;
  const pad = n => String(n).padStart(2, '0');

  const show = i => {
    idx = (i + items.length) % items.length;
    const el = items[idx];
    img.classList.remove('is-loaded');
    img.onload = () => img.classList.add('is-loaded');
    img.src = el.dataset.full;
    img.alt = el.querySelector('img')?.alt || '';
    cap.textContent = el.dataset.caption || '';
    count.textContent = `${pad(idx + 1)} / ${pad(items.length)}`;
    new Image().src = items[(idx + 1) % items.length].dataset.full; // preload next
  };
  const open = i => {
    lastFocus = document.activeElement;
    show(i);
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add('is-open'));
    document.documentElement.style.overflow = 'hidden';
    box.querySelector('.lightbox__close').focus();
  };
  const close = () => {
    box.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    setTimeout(() => { box.hidden = true; }, 350);
    lastFocus?.focus();
  };

  items.forEach((el, i) => {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.addEventListener('click', () => open(i));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
  });
  box.querySelector('.lightbox__close').addEventListener('click', close);
  box.querySelector('.lightbox__prev').addEventListener('click', () => show(idx - 1));
  box.querySelector('.lightbox__next').addEventListener('click', () => show(idx + 1));
  box.addEventListener('click', e => { if (e.target === box || e.target.classList.contains('lightbox__stage')) close(); });
  addEventListener('keydown', e => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });
  let sx = 0, sy = 0;
  box.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  box.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
    else if (dy > 90) close();
  }, { passive: true });

})();
