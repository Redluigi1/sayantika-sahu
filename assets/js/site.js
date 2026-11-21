/* ==========================================================================
   Sayantika Sahu — site shell, shared by every page
   · SECTIONS data (the swatches)
   · cloth curtain page transitions
   · swatch-book Index menu
   · toile textures for sections still "on the cutting table"
   ========================================================================== */
(() => {
  const html = document.documentElement;
  const ROOT = html.dataset.root || '';
  const PAGE = html.dataset.page || '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.classList.add('js');

  const SECTIONS = [
    { key: 'styling',  n: '01', title: 'Styling & Photography', href: 'styling/',   img: 'assets/img/sp/veil-01-sm.webp', note: 'Four stories', color: '#2A0E06', fg: '#F6E3C8' },
    { key: 'garment',  n: '02', title: 'Garment Collection',   href: 'garment/',   img: 'assets/img/gc/gc-cover-sm.webp', note: 'Beneath the Canopy', color: '#E8DDC7', fg: '#1A1412' },
  ];
  const HOME = { key: 'home', title: 'Sayantika Sahu', color: '#EFEAE2', fg: '#1A1412' };

  const SS = (window.SS = window.SS || {});
  SS.ROOT = ROOT; SS.SECTIONS = SECTIONS; SS.reduce = reduce;
  SS.url = p => ROOT + p;

  /* ------------------------------------------------------------------
     Wavy hem path animation (shared by curtain + menu)
     ------------------------------------------------------------------ */
  const hemPath = (t, amp = 1) => {
    // 1000 x 100 viewbox; hem hangs down from y=0
    const pts = [];
    const N = 14;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * 1000;
      const y = 38 + amp * (Math.sin(i * 1.3 + t * 2.1) * 18 + Math.sin(i * .55 - t * 1.3) * 14);
      pts.push([x, Math.max(4, y)]);
    }
    let d = `M0,0 L0,${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2;
      d += ` Q${x0.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${((y0 + y1) / 2).toFixed(1)}`;
    }
    d += ` L1000,${pts[pts.length - 1][1].toFixed(1)} L1000,0 Z`;
    return d;
  };
  const animateHem = (path, getAmp) => {
    let raf, t0 = performance.now();
    const loop = now => { path.setAttribute('d', hemPath((now - t0) / 1000, getAmp())); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  };

  /* ------------------------------------------------------------------
     Curtain
     ------------------------------------------------------------------ */
  const curtain = document.querySelector('.curtain');
  const hemSVG = curtain?.querySelector('.curtain__hem path');
  const thread = curtain?.querySelector('.curtain__thread');
  if (hemSVG) hemSVG.setAttribute('d', hemPath(0));

  const setCurtain = ({ color, fg, label }) => {
    html.style.setProperty('--curtain', color);
    if (curtain) curtain.style.setProperty('--curtain', color);
    curtain?.style.setProperty('--curtain-fg', fg || '#1A1412');
    html.style.setProperty('--curtain-label', JSON.stringify(label || ''));
    curtain?.style.setProperty('--curtain-label', JSON.stringify(label || ''));
  };

  const tween = (dur, fn, ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)) => new Promise(res => {
    const s = performance.now();
    const step = now => {
      const p = Math.min(1, (now - s) / dur);
      fn(ease(p), p);
      p < 1 ? requestAnimationFrame(step) : res();
    };
    requestAnimationFrame(step);
  });

  let hemAmp = 1, stopHem = null;
  const OFF = () => -(innerHeight + innerHeight * .14);

  SS.curtainCover = (opts) => {
    if (!curtain) return Promise.resolve();
    setCurtain(opts);
    curtain.style.pointerEvents = 'auto';
    if (thread) thread.style.setProperty('--p', 0);
    if (reduce) { curtain.style.transform = 'none'; return Promise.resolve(); }
    stopHem?.(); stopHem = animateHem(hemSVG, () => hemAmp);
    hemAmp = 1.6;
    return tween(900, (e, p) => {
      curtain.style.transform = `translate3d(0, ${(1 - e) * OFF()}px, 0)`;
      hemAmp = 1.6 - p * 1.2;
      if (thread) thread.style.setProperty('--p', Math.min(1, p * 1.2));
    });
  };

  SS.curtainReveal = () => {
    if (!curtain) return Promise.resolve();
    html.classList.remove('curtain-in', 'first-visit');
    curtain.style.pointerEvents = 'none';
    if (thread) thread.style.setProperty('--p', 1);
    if (reduce) { curtain.style.transform = ''; return Promise.resolve(); }
    stopHem?.(); stopHem = animateHem(hemSVG, () => hemAmp);
    curtain.style.transform = 'translate3d(0,0,0)';
    return tween(1150, (e, p) => {
      curtain.style.transform = `translate3d(0, ${e * OFF()}px, 0)`;
      hemAmp = .4 + Math.sin(p * Math.PI) * 1.8;
    }).then(() => { stopHem?.(); stopHem = null; curtain.style.transform = ''; });
  };

  SS.go = (href, opts = {}) => {
    try { sessionStorage.setItem('ss-curtain', JSON.stringify({ color: opts.color, fg: opts.fg, label: opts.label })); } catch (e) {}
    SS.lenis?.stop();
    return SS.curtainCover(opts).then(() => { location.href = href; });
  };

  const sectionFor = href => {
    const u = new URL(href, location.href);
    const path = u.pathname.replace(/index\.html$/, '');
    for (const s of SECTIONS) if (s.href && path.endsWith('/' + s.href)) return s;
    return null;
  };

  /* intercept internal navigations */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download') || a.dataset.noCurtain !== undefined) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) return; // same page (hash links)
    e.preventDefault();
    const s = sectionFor(url.href);
    const isHome = !s;
    SS.go(url.href, s
      ? { color: s.color, fg: s.fg, label: s.title }
      : { color: HOME.color, fg: HOME.fg, label: isHome ? HOME.title : '' });
  });

  /* entering: lift the curtain once the page is ready */
  const boot = () => {
    if (!html.classList.contains('curtain-in') && !html.classList.contains('first-visit')) return;
    if (curtain) {
      const st = getComputedStyle(html);
      curtain.style.setProperty('--curtain', st.getPropertyValue('--curtain') || '#EFEAE2');
      curtain.style.setProperty('--curtain-label', st.getPropertyValue('--curtain-label') || '""');
      curtain.style.setProperty('--curtain-fg', st.getPropertyValue('--curtain-fg') || '#1A1412');
    }
    // progress "thread" while images load
    const imgs = [...document.images].filter(i => i.loading !== 'lazy').slice(0, 8);
    let done = 0;
    const bump = () => { done++; thread?.style.setProperty('--p', Math.min(1, .15 + done / Math.max(1, imgs.length) * .85)); };
    thread?.style.setProperty('--p', .15);
    const waits = imgs.map(i => i.complete ? (bump(), 0) : new Promise(r => { i.addEventListener('load', () => { bump(); r(); }, { once: true }); i.addEventListener('error', r, { once: true }); }));
    const ready = Promise.all([document.fonts?.ready, ...waits, SS.waitFor || 0]);
    const minTime = new Promise(r => setTimeout(r, html.classList.contains('first-visit') ? 1100 : 350));
    const cap = new Promise(r => setTimeout(r, 4500));
    Promise.race([Promise.all([ready, minTime]), cap]).then(() => {
      try { sessionStorage.removeItem('ss-curtain'); sessionStorage.setItem('ss-seen', '1'); } catch (e) {}
      document.dispatchEvent(new CustomEvent('ss:reveal'));
      SS.revealed = true;
      SS.curtainReveal();
    });
  };
  SS.revealed = !html.classList.contains('curtain-in') && !html.classList.contains('first-visit');
  if (SS.revealed) { try { sessionStorage.setItem('ss-seen', '1'); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0)); else setTimeout(boot, 0);

  addEventListener('pageshow', e => {
    if (e.persisted && curtain) { // back/forward cache: never leave the curtain down
      html.classList.remove('curtain-in', 'first-visit');
      curtain.style.transform = ''; curtain.style.pointerEvents = 'none';
      SS.lenis?.start();
    }
  });

  /* ------------------------------------------------------------------
     Toile textures (canvas) — for sections still in the making
     ------------------------------------------------------------------ */
  const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
  const muslin = (ctx, w, h, base = '#E8DDC7') => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    // warp + weft threads
    for (let y = 0; y < h; y += 2) { ctx.fillStyle = `rgba(90,70,40,${.02 + rnd() * .05})`; ctx.fillRect(0, y, w, 1); }
    for (let x = 0; x < w; x += 2) { ctx.fillStyle = `rgba(255,255,255,${.02 + rnd() * .05})`; ctx.fillRect(x, 0, 1, h); }
    // slubs
    for (let i = 0; i < w * h / 900; i++) {
      ctx.fillStyle = `rgba(110,85,50,${.08 + rnd() * .12})`;
      const x = rnd() * w, y = rnd() * h, l = 3 + rnd() * 14;
      rnd() > .5 ? ctx.fillRect(x, y, l, 1) : ctx.fillRect(x, y, 1, l);
    }
  };
  const chalk = (ctx, color, width = 2) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; };

  SS.toile = (kind, w = 600, h = 860) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    muslin(ctx, w, h);
    const S = w / 600;
    ctx.save(); ctx.scale(S, S);
    const H = h / S;
    if (kind === 'garment') {
      // front bodice block, drafted in tailor's chalk
      const blue = 'rgba(46,72,140,.78)', pencil = 'rgba(30,26,22,.75)';
      chalk(ctx, blue, 2.4);
      ctx.beginPath();
      ctx.moveTo(150, 170);                 // neck point
      ctx.lineTo(330, 210);                 // shoulder
      ctx.bezierCurveTo(318, 300, 330, 360, 400, 392); // armhole
      ctx.lineTo(420, 640);                 // side seam
      ctx.lineTo(120, 660);                 // waist
      ctx.lineTo(120, 260);                 // centre front
      ctx.bezierCurveTo(175, 255, 160, 200, 150, 170); // neckline
      ctx.stroke();
      // dart
      ctx.beginPath(); ctx.moveTo(230, 650); ctx.lineTo(258, 450); ctx.lineTo(288, 646); ctx.stroke();
      // seam allowance
      ctx.setLineDash([9, 8]); chalk(ctx, pencil, 1.4);
      ctx.beginPath(); ctx.moveTo(138, 150); ctx.lineTo(346, 192); ctx.bezierCurveTo(336, 296, 348, 344, 418, 376); ctx.lineTo(440, 662); ctx.lineTo(100, 682); ctx.lineTo(100, 250); ctx.stroke();
      ctx.setLineDash([]);
      // grainline
      chalk(ctx, pencil, 1.6);
      ctx.beginPath(); ctx.moveTo(190, 330); ctx.lineTo(190, 590); ctx.stroke();
      [[190, 330, -1], [190, 590, 1]].forEach(([x, y, d]) => { ctx.beginPath(); ctx.moveTo(x - 7, y - d * 12); ctx.lineTo(x, y); ctx.lineTo(x + 7, y - d * 12); ctx.stroke(); });
      // notches
      ctx.fillStyle = blue;
      [[352, 318], [410, 520]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12, y - 6); ctx.lineTo(x + 12, y + 6); ctx.fill(); });
      // writing
      ctx.fillStyle = pencil;
      ctx.font = 'italic 40px "Instrument Serif", serif';
      ctx.save(); ctx.translate(205, 460); ctx.rotate(-Math.PI / 2); ctx.fillText('Front bodice', -90, 0); ctx.restore();
      ctx.font = '500 15px "Geist Mono", monospace';
      ctx.fillText('CUT 1 ON FOLD', 268, 560);
      ctx.fillText('C.F.', 72, 470);
      ctx.fillStyle = 'rgba(126,14,20,.85)';
      ctx.font = 'italic 46px "Instrument Serif", serif';
      ctx.fillText('toile —', 60, 770);
      ctx.fillText('in progress', 60, 815);
      // pins
      [[150, 170], [400, 392], [120, 660]].forEach(([x, y]) => {
        ctx.strokeStyle = 'rgba(80,80,90,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 4, y - 26); ctx.lineTo(x + 6, y + 10); ctx.stroke();
        ctx.fillStyle = '#B0141C'; ctx.beginPath(); ctx.arc(x - 5, y - 29, 5, 0, 7); ctx.fill();
      });
    } else {
      // embroidery sampler inside a hoop
      const cx = 300, cy = 380, R = 210;
      // hoop shadow + ring
      ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 26; ctx.beginPath(); ctx.arc(cx + 4, cy + 8, R, 0, 7); ctx.stroke();
      const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, '#D6B07C'); g.addColorStop(1, '#9C7344');
      ctx.strokeStyle = g; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(60,40,20,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R - 11, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, R + 11, 0, 7); ctx.stroke();
      // hoop screw
      ctx.fillStyle = '#8a8478'; ctx.fillRect(cx - 9, cy - R - 34, 18, 22);
      // chain-stitch spiral (crimson)
      ctx.strokeStyle = '#A3121C'; ctx.lineWidth = 2.6;
      for (let a = 0; a < Math.PI * 5.2; a += .32) {
        const r = 14 + a * 9.5, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2);
        ctx.beginPath(); ctx.ellipse(0, 0, 4.2, 8.5, 0, 0, 7); ctx.stroke(); ctx.restore();
      }
      // satin-stitch leaves (gold)
      const leaf = (x, y, rot, len) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
        ctx.strokeStyle = '#C79A2E'; ctx.lineWidth = 1.6;
        for (let i = -len; i <= len; i += 3) {
          const wdt = Math.sqrt(Math.max(0, 1 - (i / len) ** 2)) * len * .42;
          ctx.beginPath(); ctx.moveTo(i - 4, -wdt); ctx.lineTo(i + 4, wdt); ctx.stroke();
        }
        ctx.restore();
      };
      leaf(cx + 120, cy - 110, -.6, 34); leaf(cx - 128, cy + 96, 2.4, 30); leaf(cx - 112, cy - 120, .8, 26); leaf(cx + 130, cy + 110, -2.3, 28);
      // french knots (green)
      for (let i = 0; i < 26; i++) {
        const a = rnd() * 7, r = 150 + rnd() * 35, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        ctx.fillStyle = '#2E6B45'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x - 1.2, y - 1.2, 1.4, 0, 7); ctx.fill();
      }
      // running stitch outside hoop
      ctx.strokeStyle = 'rgba(30,26,22,.7)'; ctx.lineWidth = 2; ctx.setLineDash([12, 9]);
      ctx.beginPath(); ctx.moveTo(40, 660); ctx.bezierCurveTo(180, 620, 380, 700, 560, 650); ctx.stroke(); ctx.setLineDash([]);
      // loose thread + needle
      ctx.strokeStyle = '#A3121C'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx + 64, cy + 32); ctx.bezierCurveTo(470, 520, 380, 600, 500, 700); ctx.stroke();
      ctx.strokeStyle = '#9a9aa2'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(500, 700); ctx.lineTo(540, 790); ctx.stroke();
      ctx.fillStyle = 'rgba(126,14,20,.85)';
      ctx.font = 'italic 46px "Instrument Serif", serif';
      ctx.fillText('sampler —', 60, 765);
      ctx.fillText('in progress', 60, 810);
    }
    ctx.restore();
    return c;
  };

  /* ------------------------------------------------------------------
     Index menu — the swatch book
     ------------------------------------------------------------------ */
  const toast = document.createElement('div');
  toast.className = 'toast'; toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  let toastT;
  SS.toast = (msg, x = innerWidth / 2, y = innerHeight / 2) => {
    toast.textContent = msg;
    toast.style.left = x + 'px'; toast.style.top = y + 'px';
    toast.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('is-on'), 1800);
  };

  const sb = document.createElement('div');
  sb.className = 'sb'; sb.setAttribute('role', 'dialog'); sb.setAttribute('aria-modal', 'true'); sb.setAttribute('aria-label', 'Index');
  sb.innerHTML = `
    <div class="sb__scrim"></div>
    <div class="sb__panel">
      <div class="sb__top mono"><span>The swatch book — Index</span><button class="sb__close mono" type="button">Close <span>✕</span></button></div>
      <div class="sb__head"><h2 class="sb__title">Pick a <i>swatch</i>.</h2><p>Two sections: styling &amp; photography, and the garment collection.</p></div>
      <div class="sb__rail"><ol class="sb__list">${SECTIONS.map((s, i) => `
        <li class="sb__item ${s.soon ? 'is-soon' : 'is-live'} ${PAGE === s.key ? 'is-current' : ''}" style="--i:${i}">
          ${s.soon ? `<button class="sb__link" type="button" data-soon="${s.note}">` : `<a class="sb__link" href="${ROOT + s.href}">`}
            <span class="sb__clip"></span>
            <span class="sb__swatch">${s.soon ? `<span data-toile="${s.toile}"></span>` : `<img src="${ROOT + s.img}" alt="" loading="lazy">`}</span>
            <span class="sb__tag"><span class="mono">N°${s.n}</span><b>${s.title.replace('&', '&amp;')}</b><small class="mono muted">${s.soon ? 'Coming soon' : s.note}</small></span>
          ${s.soon ? '</button>' : '</a>'}
        </li>`).join('')}
      </ol></div>
      <div class="sb__foot mono">
        <nav><a href="${ROOT || './'}">Home</a><a href="${ROOT}#about" data-close>About</a><a href="${ROOT}#contact" data-close>Contact</a></nav>
        <nav><a href="mailto:Sahusayantika2@gmail.com">Email</a><a href="https://www.instagram.com/sayabcdefghijklmnopqrstuvw/" target="_blank" rel="noopener">Instagram ↗</a></nav>
      </div>
    </div>
    <svg class="sb__hem" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path/></svg>`;
  document.body.appendChild(sb);
  const sbHem = sb.querySelector('.sb__hem path');
  sbHem.setAttribute('d', hemPath(0));
  let sbStop = null, lastFocus = null, toilesDrawn = false;

  const drawToiles = () => {
    if (toilesDrawn) return; toilesDrawn = true;
    sb.querySelectorAll('[data-toile]').forEach(el => {
      const c = SS.toile(el.dataset.toile, 450, 600);
      el.replaceWith(c);
    });
  };

  SS.openMenu = () => {
    if (sb.classList.contains('is-open')) return;
    lastFocus = document.activeElement;
    (document.fonts?.ready || Promise.resolve()).then(drawToiles);
    sb.classList.add('is-open');
    SS.lenis?.stop();
    html.style.overflow = 'hidden';
    if (!reduce) { let a = 2; sbStop = animateHem(sbHem, () => (a = Math.max(.35, a * .985))); }
    setTimeout(() => sb.querySelector('.sb__close').focus(), 50);
    document.querySelectorAll('[data-menu-open]').forEach(b => b.setAttribute('aria-expanded', 'true'));
  };
  SS.closeMenu = () => {
    if (!sb.classList.contains('is-open')) return;
    sb.classList.remove('is-open');
    html.style.overflow = '';
    SS.lenis?.start();
    setTimeout(() => { sbStop?.(); sbStop = null; }, 1000);
    lastFocus?.focus?.();
    document.querySelectorAll('[data-menu-open]').forEach(b => b.setAttribute('aria-expanded', 'false'));
  };
  sb.querySelector('.sb__close').addEventListener('click', SS.closeMenu);
  sb.querySelector('.sb__scrim').addEventListener('click', SS.closeMenu);
  sb.querySelectorAll('[data-close]').forEach(a => a.addEventListener('click', e => {
    const u = new URL(a.href);
    if (u.pathname === location.pathname) { e.preventDefault(); SS.closeMenu(); setTimeout(() => SS.scrollTo(u.hash), 500); }
  }));
  sb.querySelectorAll('[data-soon]').forEach(b => b.addEventListener('click', e => {
    const r = b.getBoundingClientRect();
    b.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(-1.5deg)' }, { transform: 'rotate(0)' }], { duration: 700, easing: 'ease-out' });
    SS.toast(b.dataset.soon + ' — coming soon', r.left + r.width / 2, r.top + r.height * .45);
  }));
  addEventListener('keydown', e => {
    if (e.key === 'Escape') SS.closeMenu();
    if (e.key === 'Tab' && sb.classList.contains('is-open')) { // keep focus inside
      const f = [...sb.querySelectorAll('a, button')];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.querySelectorAll('[data-menu-open]').forEach(b => {
    b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', SS.openMenu);
  });

  SS.scrollTo = hash => {
    const el = hash && document.querySelector(hash);
    if (!el) return;
    if (SS.lenis) SS.lenis.scrollTo(el, { offset: 0, duration: 1.6 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
