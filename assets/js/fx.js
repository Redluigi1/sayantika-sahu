/* ==========================================================================
   Sayantika Sahu — motion layer (home + styling)
   Lenis smooth scroll · GSAP ScrollTrigger · split text · reveals
   · tone shifts · parallax · cursor · lightbox
   ========================================================================== */
(() => {
  const SS = (window.SS = window.SS || {});
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  if (!reduce && typeof window.Lenis !== 'undefined') {
    const lenis = new Lenis({ lerp: .09, smoothWheel: true, wheelMultiplier: 1 });
    SS.lenis = lenis;
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    if (!SS.revealed) lenis.stop();
    document.addEventListener('ss:reveal', () => lenis.start());
    // hash links on this page
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { duration: 1.6 }); }
    }));
  }
  SS.velocity = () => (SS.lenis ? SS.lenis.velocity : 0);
  // sections that change height after load (the horizontal woods) must update Lenis' scroll limit
  if (SS.lenis && 'ResizeObserver' in window) new ResizeObserver(() => SS.lenis.resize()).observe(document.body);

  /* ---------- start lazy images early ----------
     Reveal animations clip images to nothing, and Chrome treats a fully clipped
     lazy image as off-screen, so it would only start downloading once the reveal
     began (slow, sometimes blank). Switch them to eager ~1.5 screens ahead. */
  const lazyImgs = document.querySelectorAll('img[loading="lazy"]');
  if ('IntersectionObserver' in window) {
    const lio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { (e.target._imgs || [e.target]).forEach(i => { i.loading = 'eager'; }); lio.unobserve(e.target); }
    }), { rootMargin: '150% 0px 150% 0px' });
    lazyImgs.forEach(img => { const t = img.closest('figure') || img.parentElement || img; (t._imgs = t._imgs || []).push(img); lio.observe(t); });
  } else lazyImgs.forEach(img => { img.loading = 'eager'; });


  /* ---------- text splitting ---------- */
  const splitLines = el => {
    // wrap words, measure, regroup into lines
    const text = el.innerHTML;
    const tmp = document.createElement('div');
    tmp.innerHTML = text;
    const words = [];
    const walk = (node, wrapTag) => {
      node.childNodes.forEach(n => {
        if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(w => { if (w.trim()) words.push({ w, tag: wrapTag }); else if (w) words.push({ space: true }); });
        else if (n.nodeType === 1) walk(n, n.cloneNode(false));
      });
    };
    walk(tmp, null);
    let prevSpace = true;
    el.innerHTML = words.map(o => {
      if (o.space) { prevSpace = true; return ' '; }
      const glue = !prevSpace; prevSpace = false;
      return `<span class="w${glue ? ' nsp' : ''}">${o.tag ? o.tag.outerHTML.replace('></', `>${o.w}</`) : o.w}</span>`;
    }).join('');
    const ws = [...el.querySelectorAll('.w')];
    const lines = [];
    let lastTop = null;
    ws.forEach(w => {
      const t = w.offsetTop;
      if (lastTop === null || Math.abs(t - lastTop) > 4) { lines.push([]); lastTop = t; }
      lines[lines.length - 1].push(w);
    });
    el.innerHTML = lines.map((l, i) => `<span class="split-line" style="--li:${i}"><span>${l.map((w, j) => (j && !w.classList.contains('nsp') ? ' ' : '') + w.outerHTML).join('')}</span></span>`).join('');
  };
  const doSplit = () => document.querySelectorAll('[data-split]').forEach(el => {
    if (!el.dataset.orig) el.dataset.orig = el.innerHTML; else el.innerHTML = el.dataset.orig;
    splitLines(el);
  });
  (document.fonts?.ready || Promise.resolve()).then(() => {
    doSplit();
    let w = innerWidth;
    addEventListener('resize', () => { if (Math.abs(innerWidth - w) > 40) { w = innerWidth; doSplit(); document.querySelectorAll('[data-split]').forEach(el => el.classList.add('is-in')); } });
    observeReveals();
  });

  /* chars for big display words */
  document.querySelectorAll('[data-chars]').forEach(el => {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; frag.appendChild(s); });
        n.replaceWith(frag);
      } else walk(n);
    });
    walk(el);
    el.querySelectorAll('.ch').forEach((c, i) => c.style.setProperty('--ci', i));
  });

  /* ---------- reveal on scroll ---------- */
  let io;
  function observeReveals() {
    const els = document.querySelectorAll('[data-reveal], [data-split], [data-wipe], [data-chars], .stitch, [data-io]');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    // clip-path:inset(100%) hides a wipe frame from IntersectionObserver, so watch its parent instead
    const proxy = new Map();
    io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      (proxy.get(e.target) || [e.target]).forEach(el => el.classList.add('is-in'));
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -10% 0px', threshold: .05 });
    const go = () => els.forEach(el => {
      if (el.hasAttribute('data-wipe') && el.parentElement) {
        const p = el.parentElement;
        proxy.set(p, [...(proxy.get(p) || ([...els].includes(p) ? [p] : [])), el]);
        io.observe(p);
      } else io.observe(el);
    });
    SS.revealed ? go() : document.addEventListener('ss:reveal', () => setTimeout(go, 250), { once: true });
  }

  /* ---------- tone follows the section in view ---------- */
  // the innermost [data-tone] block crossing the middle of the screen wins
  const toned = [...document.querySelectorAll('[data-tone]:not(body)')];
  if (toned.length) {
    const meta = document.querySelector('meta[name="theme-color"]');
    let current = document.body.dataset.tone, queued = false;
    const pick = () => {
      queued = false;
      const mid = innerHeight / 2;
      let tone = null;
      for (const el of toned) { const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid) tone = el.dataset.tone; }
      if (tone && tone !== current) {
        current = document.body.dataset.tone = tone;
        if (meta) requestAnimationFrame(() => { meta.content = getComputedStyle(document.body).getPropertyValue('--bg').trim(); });
      }
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(pick); } }, { passive: true });
    addEventListener('resize', pick);
    pick();
  }

  /* ---------- header hides on the way down ---------- */
  const hdr = document.querySelector('.hdr');
  if (hdr) {
    let last = 0;
    addEventListener('scroll', () => {
      const y = scrollY;
      hdr.classList.toggle('is-scrolled', y > 60);
      hdr.classList.toggle('is-hidden', y > last + 2 && y > 500);
      if (y < last - 2) hdr.classList.remove('is-hidden');
      last = y;
    }, { passive: true });
  }

  /* ---------- parallax ---------- */
  if (hasGSAP && !reduce) {
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const amt = parseFloat(el.dataset.parallax) || 12;
      gsap.fromTo(el, { yPercent: -amt / 2 }, { yPercent: amt / 2, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // words that light up as you read
    document.querySelectorAll('[data-scrub-words]').forEach(el => {
      const words = el.textContent.trim().split(/\s+/);
      const emph = (el.dataset.emph || '').split('|').filter(Boolean);
      el.innerHTML = words.map(w => {
        const clean = w.replace(/[^\w’']/g, '');
        return `<span class="sw${emph.includes(clean) ? ' sw--em' : ''}">${w}</span>`;
      }).join(' ');
      gsap.fromTo(el.querySelectorAll('.sw'), { opacity: .14 }, { opacity: 1, stagger: .05, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });
  } else {
    document.querySelectorAll('[data-scrub-words]').forEach(el => el.style.opacity = 1);
  }

  /* ---------- cursor ---------- */
  const cur = document.querySelector('.cursor');
  if (cur && fine && !reduce) {
    const ring = cur.querySelector('.cursor__ring span');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; cur.classList.add('is-moving'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-moving'));
    const tick = () => {
      cx += (x - cx) * .2; cy += (y - cy) * .2;
      cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(tick);
    };
    tick();
    SS.cursorLabel = label => {
      if (label) { ring.textContent = label; cur.classList.add('is-label'); } else cur.classList.remove('is-label');
    };
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor], [data-lightbox]');
      if (t) SS.cursorLabel(t.dataset.cursor || 'View');
    });
    document.addEventListener('pointerout', e => {
      const t = e.target.closest('[data-cursor], [data-lightbox]');
      if (t && !t.contains(e.relatedTarget)) SS.cursorLabel(null);
    });
  } else {
    SS.cursorLabel = () => {};
    cur?.remove();
  }

  /* ---------- magnetic ---------- */
  if (fine && !reduce) document.querySelectorAll('[data-magnetic]').forEach(el => {
    const s = parseFloat(el.dataset.magnetic) || .3;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * s}px, ${(e.clientY - r.top - r.height / 2) * s}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- lightbox ---------- */
  const box = document.querySelector('.lightbox');
  const items = [...document.querySelectorAll('[data-lightbox]')];
  if (box && items.length) {
    const img = box.querySelector('.lightbox__img');
    const cap = box.querySelector('.lightbox__caption');
    const count = box.querySelector('.lightbox__count');
    let group = items, idx = 0, lastFocus = null;
    const pad = n => String(n).padStart(2, '0');
    const show = i => {
      idx = (i + group.length) % group.length;
      const el = group[idx];
      img.classList.remove('is-loaded');
      img.onload = () => img.classList.add('is-loaded');
      img.src = el.dataset.full;
      img.alt = el.querySelector('img')?.alt || '';
      cap.textContent = el.dataset.caption || '';
      count.textContent = `${pad(idx + 1)} / ${pad(group.length)}`;
      new Image().src = group[(idx + 1) % group.length].dataset.full;
    };
    const open = el => {
      lastFocus = document.activeElement;
      group = el.dataset.group ? items.filter(i => i.dataset.group === el.dataset.group) : items;
      show(group.indexOf(el));
      box.hidden = false;
      requestAnimationFrame(() => box.classList.add('is-open'));
      SS.lenis?.stop(); document.documentElement.style.overflow = 'hidden';
      SS.cursorLabel(null);
      box.querySelector('.lightbox__close').focus();
    };
    const close = () => {
      box.classList.remove('is-open');
      SS.lenis?.start(); document.documentElement.style.overflow = '';
      setTimeout(() => { box.hidden = true; }, 400);
      lastFocus?.focus();
    };
    SS.openLightbox = open;
    items.forEach(el => {
      el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button');
      if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Open image: ' + (el.dataset.caption || ''));
      el.addEventListener('click', e => { if (el.dataset.dragged === '1') return; open(el); });
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); } });
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
  }

  addEventListener('load', () => hasGSAP && ScrollTrigger.refresh());
})();
