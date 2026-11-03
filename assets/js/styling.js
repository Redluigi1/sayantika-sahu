/* ==========================================================================
   N°03 — Styling & Photography interactions
   ========================================================================== */
(() => {
  const SS = window.SS || {};
  const ROOT = SS.ROOT ?? '../';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- hero: entrance + contact-sheet strip ---------- */
  const heroIn = () => document.querySelectorAll('.sp-hero [data-chars]').forEach(el => el.classList.add('is-in'));
  SS.revealed ? requestAnimationFrame(heroIn) : document.addEventListener('ss:reveal', () => setTimeout(heroIn, 150), { once: true });

  const FRAMES = [
    ...[1, 2, 3, 4, 5, 6, 7].map(i => `veil-0${i}`),
    ...[1, 2, 3, 4, 5].map(i => `office-0${i}`),
    ...[1, 2, 3, 4, 5].map(i => `outdoor-0${i}`),
    ...[1, 2, 3, 4, 5].map(i => `still-0${i}`),
  ];
  const track = document.querySelector('.strip__track');
  if (track) {
    const one = FRAMES.map((f, i) => `<span class="strip__f"><img src="${ROOT}assets/img/sp/${f}-sm.webp" alt="" decoding="async"><span>SS 400 ▸ ${String(i + 1).padStart(2, '0')}A</span></span>`).join('');
    track.innerHTML = one + one;
  }

  /* ---------- contents: floating preview ---------- */
  const prev = document.querySelector('.toc-preview');
  if (prev && fine && !reduce) {
    const pimg = prev.querySelector('img');
    let x = 0, y = 0, cx = 0, cy = 0, vx = 0, on = false;
    document.querySelectorAll('.toc a').forEach(a => {
      a.addEventListener('pointerenter', () => { pimg.src = a.dataset.preview; prev.classList.add('is-on'); on = true; });
      a.addEventListener('pointerleave', () => { prev.classList.remove('is-on'); on = false; });
    });
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; }, { passive: true });
    const loop = () => {
      requestAnimationFrame(loop);
      const nx = lerp(cx, x, .14), ny = lerp(cy, y, .14);
      vx = lerp(vx, nx - cx, .2); cx = nx; cy = ny;
      prev.style.transform = `translate3d(${cx + 30}px, ${cy}px, 0) translate(-0%, -50%) rotate(${clamp(vx * .6, -12, 12)}deg) scale(${on ? 1 : .6})`;
    };
    loop();
  }

  document.querySelectorAll('.palette i').forEach(i => { i.title = i.dataset.name; i.setAttribute('role', 'img'); i.setAttribute('aria-label', i.dataset.name); });

  /* ---------- I. veil opener: word indices ---------- */
  document.querySelectorAll('.veil-open__title > span').forEach((s, i) => s.style.setProperty('--i', i));

  /* ---------- veiled frames: the cursor lifts the tulle ---------- */
  const veiled = [...document.querySelectorAll('.veiled')];
  if (fine && !reduce) {
    veiled.forEach(el => {
      el.addEventListener('pointerenter', () => el.classList.add('is-lens'));
      el.addEventListener('pointerleave', () => el.classList.remove('is-lens'));
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }
  // every veil lifts by itself once the photograph is properly in view
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const el = e.target;
    if (e.isIntersecting) el._t = setTimeout(() => { el.classList.add('is-lifted'); vio.unobserve(el); }, fine ? 1100 : 450);
    else clearTimeout(el._t);
  }), { threshold: .65 });
  veiled.forEach(el => vio.observe(el));

  /* ---------- II. memo: typewriter, then the stamp ---------- */
  const memo = document.querySelector('.memo');
  const typeEl = memo?.querySelector('[data-type]');
  if (memo && typeEl) {
    const text = typeEl.textContent.trim();
    if (!reduce) {
      typeEl.innerHTML = `<span class="ghost">${text}</span><span class="typed"></span>`;
      const out = typeEl.querySelector('.typed');
      out.innerHTML = '<span class="caret"></span>';
      const mio = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        mio.disconnect();
        let i = 0;
        const step = () => {
          i = Math.min(text.length, i + 3);
          out.innerHTML = text.slice(0, i) + '<span class="caret"></span>';
          if (i < text.length) setTimeout(step, 16);
          else setTimeout(() => memo.classList.add('is-stamped'), 250);
        };
        setTimeout(step, 300);
      }, { threshold: .45 });
      mio.observe(memo);
    } else memo.classList.add('is-stamped');
  }

  /* ---------- II. the desk: draggable prints + coiled phone cord ---------- */
  const desk = document.querySelector('[data-desk]');
  const cordPath = desk?.querySelector('.cord__path');
  const prints = desk ? [...desk.querySelectorAll('.print')] : [];
  let cordLen = 0, cordDirty = true;

  const catmull = (pts, steps = 40) => {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push([
          .5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  };
  const buildCord = () => {
    if (!desk || !cordPath) return;
    const dr = desk.getBoundingClientRect();
    const pts = [[innerWidth > 760 ? 28 : dr.width * .5, -40]];
    prints.forEach(p => {
      const r = p.getBoundingClientRect();
      pts.push([r.left - dr.left + r.width / 2, r.top - dr.top + r.height * .45]);
    });
    pts.push([dr.width * .5, dr.height + 30]);
    // densify the base curve, then wind a coil around it
    const base = catmull(pts, 60);
    const R = innerWidth > 760 ? 9 : 7, pitch = 13;
    let d = '', s = 0;
    for (let i = 1; i < base.length; i++) {
      const [x0, y0] = base[i - 1], [x1, y1] = base[i];
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
      const tx = dx / len, ty = dy / len, nx = -ty, ny = tx;
      for (let u = 0; u < len; u += 1.6) {
        const a = ((s + u) / pitch) * Math.PI * 2;
        const bx = x0 + tx * u, by = y0 + ty * u;
        const px = bx + nx * Math.sin(a) * R + tx * Math.cos(a) * R * .75;
        const py = by + ny * Math.sin(a) * R + ty * Math.cos(a) * R * .75;
        d += (d ? 'L' : 'M') + px.toFixed(1) + ',' + py.toFixed(1);
      }
      s += len;
    }
    cordPath.setAttribute('d', d);
    cordLen = cordPath.getTotalLength();
    cordPath.style.strokeDasharray = cordLen;
    cordDirty = false;
  };

  if (desk) {
    const canDrag = () => fine && innerWidth > 760;
    prints.forEach(p => {
      let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, id = null;
      const frame = p.querySelector('[data-lightbox]');
      p.addEventListener('pointerdown', e => {
        if (!canDrag() || e.button !== 0) return;
        id = e.pointerId; p.setPointerCapture(id);
        sx = e.clientX; sy = e.clientY;
        ox = parseFloat(p.style.getPropertyValue('--tx')) || 0; oy = parseFloat(p.style.getPropertyValue('--ty')) || 0;
        moved = false; p.classList.add('is-dragging');
        prints.forEach(o => o.style.zIndex = o === p ? 6 : 1);
      });
      p.addEventListener('pointermove', e => {
        if (id !== e.pointerId) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.hypot(dx, dy) > 5) moved = true;
        p.style.setProperty('--tx', ox + dx + 'px'); p.style.setProperty('--ty', oy + dy + 'px');
        p.style.setProperty('--r', `${clamp(dx * .03, -10, 10)}deg`);
        cordDirty = true;
      });
      const end = e => {
        if (id !== e.pointerId) return;
        id = null; p.classList.remove('is-dragging');
        if (moved) { frame.dataset.dragged = '1'; setTimeout(() => { frame.dataset.dragged = ''; }, 60); }
        cordDirty = true;
      };
      p.addEventListener('pointerup', end); p.addEventListener('pointercancel', end);
    });
    addEventListener('resize', () => { cordDirty = true; });
    (document.fonts?.ready || Promise.resolve()).then(() => { cordDirty = true; });
    addEventListener('load', () => { cordDirty = true; });
  }

  /* ---------- III. horizontal walk ---------- */
  const hs = document.querySelector('[data-hscroll]');
  const hsTrack = hs?.querySelector('.hs__track');
  const hsImgs = hs ? [...hs.querySelectorAll('[data-hpar]')] : [];
  let hsDist = 0;
  const layoutHS = () => {
    if (!hs) return;
    if (innerWidth <= 900 || reduce) { hs.style.height = ''; hsDist = 0; hsTrack.style.transform = ''; return; }
    hsDist = Math.max(0, hsTrack.scrollWidth - innerWidth);
    hs.style.height = (hsDist + innerHeight) + 'px';
  };
  if (hs) {
    layoutHS();
    addEventListener('resize', layoutHS);
    addEventListener('load', () => { layoutHS(); window.ScrollTrigger?.refresh(); });
    (document.fonts?.ready || Promise.resolve()).then(layoutHS);
  }

  /* ---------- IV. tilt + glare ---------- */
  if (fine && !reduce) document.querySelectorAll('[data-tilt]').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', `${(px - .5) * 12}deg`);
      el.style.setProperty('--rx', `${(.5 - py) * 10}deg`);
      el.style.setProperty('--gx', `${px * 100}%`);
      el.style.setProperty('--gy', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });

  /* ---------- one loop for every scroll-driven piece ---------- */
  const veilOpen = document.querySelector('.veil-open[data-progress]');
  let lastVeil = -1;
  const frame = () => {
    requestAnimationFrame(frame);
    const vh = innerHeight;

    if (veilOpen && !reduce) {
      const r = veilOpen.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = clamp(-r.top / (r.height - vh));
        if (Math.abs(p - lastVeil) > .0005) { veilOpen.style.setProperty('--p', p.toFixed(4)); lastVeil = p; }
      }
    }

    if (hs && hsDist) {
      const r = hs.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = clamp(-r.top / (r.height - vh));
        hsTrack.style.transform = `translate3d(${-p * hsDist}px,0,0)`;
        hs.style.setProperty('--p', p.toFixed(4));
        hsImgs.forEach(img => {
          const ir = img.parentElement.getBoundingClientRect();
          const c = (ir.left + ir.width / 2 - innerWidth / 2) / innerWidth;
          img.style.setProperty('--hp', (c * -9).toFixed(2));
        });
      }
    }

    if (desk && cordPath) {
      const r = desk.getBoundingClientRect();
      if (r.bottom > -200 && r.top < vh + 200) {
        if (cordDirty) buildCord();
        const p = reduce ? 1 : clamp((vh * .9 - r.top) / (r.height * .85));
        cordPath.style.strokeDashoffset = (cordLen * (1 - p)).toFixed(1);
      }
    }
  };
  requestAnimationFrame(frame);
})();
