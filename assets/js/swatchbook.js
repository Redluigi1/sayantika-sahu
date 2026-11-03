/* ==========================================================================
   The swatch rail — four pieces of cloth hanging in front of her name.
   Each swatch is a WebGL plane with a cloth shader: pinned at the top,
   folding in a breeze, billowing on hover, rippling under the cursor,
   pinking-shear hem. Layout comes from the DOM slots (CSS grid), so
   the page is fully usable without WebGL.
   ========================================================================== */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

const SS = (window.SS = window.SS || {});
const hero = document.querySelector('[data-swatch-hero]');
const slots = [...document.querySelectorAll('[data-slot]')];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let resolveReady;
SS.waitFor = new Promise(r => (resolveReady = r));
setTimeout(() => resolveReady(), 3500); // never hold the curtain hostage

const VERT = /* glsl */`
  uniform float uTime, uWind, uHover, uPush, uSeed, uKick, uFlat;
  uniform vec2 uSize, uMouse;
  varying vec2 vUv;
  varying vec3 vN;
  varying float vHang;

  float disp(vec2 P){
    float hang = clamp(-P.y / uSize.y, 0.0, 1.0);
    float k = pow(hang, 1.25);
    float t = uTime + uSeed * 7.0;
    float amp = uWind * (1.0 + uHover * 1.1 + uKick * 2.5) * (1.0 - uFlat);
    float z = sin(P.x * 0.030 + t * 1.25 + hang * 2.4) * 9.0
            + sin(P.x * 0.074 - t * 1.75 + hang * 5.0) * 3.2
            + sin(P.y * 0.021 + P.x * 0.011 + t * 0.85) * 5.0
            + sin(P.y * 0.06 - t * 2.6 + P.x * 0.02) * uKick * 7.0;
    z *= k * amp;
    z += uHover * 30.0 * sin(hang * 3.14159) * (0.75 + 0.25 * sin(t * 1.7 + P.x * 0.02)) * (1.0 - uFlat);
    vec2 d = P - uMouse;
    z += uPush * exp(-dot(d, d) / (2.0 * 70.0 * 70.0)) * 34.0 * (0.25 + k) * (1.0 - uFlat);
    return z;
  }

  void main(){
    vUv = uv;
    vec2 P = position.xy * uSize;           // px, top edge at y = 0
    float hang = clamp(-P.y / uSize.y, 0.0, 1.0);
    vHang = hang;
    float t = uTime + uSeed * 7.0;
    float z = disp(P);
    float e = 2.0;
    float zx = disp(P + vec2(e, 0.0));
    float zy = disp(P + vec2(0.0, e));
    vN = normalize(vec3(-(zx - z) / e, -(zy - z) / e, 1.0));
    float k = pow(hang, 1.3) * (1.0 - uFlat);
    float sway = (sin(t * 0.55) * 5.0 + sin(t * 1.3 + 1.0) * 2.0) * k * uWind + uKick * sin(t * 9.0) * 10.0 * k;
    // cloth gathers slightly as it billows
    float gather = 1.0 - 0.035 * uHover * hang;
    vec3 p = vec3((P.x * gather + sway) / uSize.x, position.y - hang * uHover * 0.012, z);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAG = /* glsl */`
  uniform sampler2D uTex;
  uniform vec2 uSize;
  uniform float uDim, uFlat, uAlpha;
  uniform vec3 uBg;
  varying vec2 vUv;
  varying vec3 vN;
  varying float vHang;

  void main(){
    // pinking-shear hem
    float teeth = floor(uSize.x / 15.0);
    float tri = abs(fract(vUv.x * teeth) - 0.5) * 2.0;
    float zig = (9.0 / uSize.y) * (1.0 - uFlat);
    if (vUv.y < tri * zig) discard;

    vec3 col = texture2D(uTex, vUv).rgb;

    // weave
    vec2 px = vUv * uSize;
    float weave = 0.965 + 0.035 * sin(px.x * 2.2) * sin(px.y * 2.2) + 0.02 * sin(px.y * 1.1);
    col *= mix(weave, 1.0, uFlat);

    // light the folds
    vec3 N = normalize(vN);
    vec3 L = normalize(vec3(-0.45, 0.6, 1.0));
    float diff = dot(N, L);
    float shade = clamp(0.80 + (diff - 0.80) * 2.2, 0.5, 1.22);
    vec3 V = vec3(0.0, 0.0, 1.0);
    float spec = pow(max(dot(reflect(-L, N), V), 0.0), 20.0) * 0.16;
    col = col * mix(shade, 1.0, uFlat) + spec * (1.0 - uFlat);
    // pinned top edge sits slightly in shadow of the clip
    col *= mix(1.0, 0.9 + 0.1 * smoothstep(0.0, 0.04, 1.0 - vUv.y), 1.0 - uFlat);

    float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, mix(vec3(l), uBg, 0.45), uDim * 0.65);
    gl_FragColor = vec4(col, uAlpha);
  }
`;

const SHADOW_FRAG = /* glsl */`
  uniform vec2 uSize;
  uniform float uHover, uAlpha;
  varying vec2 vUv;
  void main(){
    vec2 p = (vUv - 0.5) * uSize;
    vec2 h = uSize * 0.5 - vec2(26.0 + uHover * 10.0);
    vec2 q = abs(p) - h;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    float a = 1.0 - smoothstep(-6.0, 26.0 + uHover * 18.0, d);
    a *= mix(0.55, 1.0, 1.0 - vUv.y); // darker near the hem
    gl_FragColor = vec4(0.10, 0.06, 0.04, a * (0.16 + uHover * 0.08) * uAlpha);
  }
`;
const SHADOW_VERT = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

/* ---------------- texture composition ---------------- */
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });

const compose = async (slot, w, h) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  if (slot.dataset.toile) {
    ctx.drawImage(SS.toile(slot.dataset.toile, w, h), 0, 0);
  } else {
    const img = await loadImg(slot.dataset.img);
    const r = Math.max(w / img.width, h / img.height);
    const fx = parseFloat(slot.dataset.fx || .5), fy = parseFloat(slot.dataset.fy || .4);
    const dw = img.width * r, dh = img.height * r;
    ctx.drawImage(img, (w - dw) * fx, (h - dh) * fy, dw, dh);
  }
  // top-stitched fold under the clip
  ctx.strokeStyle = slot.dataset.toile ? 'rgba(30,26,22,.35)' : 'rgba(255,245,230,.45)';
  ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
  ctx.beginPath(); ctx.moveTo(14, 26); ctx.lineTo(w - 14, 26); ctx.stroke(); ctx.setLineDash([]);
  // woven label
  const n = slot.dataset.n, word = slot.dataset.word;
  ctx.font = 'italic 34px "Instrument Serif", serif';
  const lw = Math.max(140, ctx.measureText(word).width + 98), lh = 50;
  const lx = w - lw - 26, ly = h - lh - 44;
  ctx.save(); ctx.translate(lx + lw / 2, ly + lh / 2); ctx.rotate(-.02); ctx.translate(-lw / 2, -lh / 2);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(3, 4, lw, lh);
  ctx.fillStyle = '#F4EDE1'; ctx.fillRect(0, 0, lw, lh);
  for (let y = 0; y < lh; y += 3) { ctx.fillStyle = 'rgba(0,0,0,.035)'; ctx.fillRect(0, y, lw, 1); }
  ctx.strokeStyle = 'rgba(26,20,18,.35)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]); ctx.strokeRect(4, 4, lw - 8, lh - 8); ctx.setLineDash([]);
  ctx.fillStyle = '#1A1412';
  ctx.font = '500 13px "Geist Mono", monospace'; ctx.fillText('N°' + n, 14, 31);
  ctx.font = 'italic 30px "Instrument Serif", serif'; ctx.fillText(word, 68, 34);
  ctx.restore();
  return c;
};

/* ---------------- scene ---------------- */
function init() {
  const canvas = document.createElement('canvas');
  canvas.className = 'rack-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { hero.classList.add('no-gl'); resolveReady(); return; }
  hero.prepend(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 10, 4000);
  const DIST = 1400;
  camera.position.set(0, 0, DIST);

  const geo = new THREE.PlaneGeometry(1, 1, 40, 56);
  geo.translate(0, -.5, 0); // pin along the top edge
  const sgeo = new THREE.PlaneGeometry(1, 1);

  let W = 1, H = 1;
  const bg = new THREE.Color('#EFEAE2');

  const swatches = slots.map((slot, i) => {
    const uniforms = {
      uTex: { value: null }, uTime: { value: 0 }, uWind: { value: 1 }, uHover: { value: 0 }, uPush: { value: 0 },
      uSeed: { value: i * 1.37 + .3 }, uKick: { value: 0 }, uFlat: { value: 0 }, uDim: { value: 0 }, uAlpha: { value: 1 },
      uSize: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2(0, -9999) }, uBg: { value: bg },
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, transparent: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 2;
    const su = { uSize: { value: new THREE.Vector2(1, 1) }, uHover: { value: 0 }, uAlpha: { value: 1 } };
    const shadow = new THREE.Mesh(sgeo, new THREE.ShaderMaterial({ uniforms: su, vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthWrite: false }));
    shadow.renderOrder = 1;
    scene.add(shadow, mesh);
    return { slot, mesh, shadow, uniforms, su, hover: 0, push: 0, kick: 0, rect: null, live: !slot.dataset.toile };
  });

  const toWorld = (x, y) => [x - W / 2, H / 2 - y];

  const layout = () => {
    const hr = hero.getBoundingClientRect();
    W = hero.clientWidth; H = hero.clientHeight;
    renderer.setSize(W, H, false);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    camera.aspect = W / H;
    camera.fov = 2 * Math.atan(H / 2 / DIST) * 180 / Math.PI;
    camera.updateProjectionMatrix();
    swatches.forEach(s => {
      // offset* ignores CSS transforms, so the slot's entrance animation can't skew the layout
      const cloth = s.slot.querySelector('.slot__cloth');
      let x = 0, y = 0, el = cloth;
      while (el && el !== hero) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
      s.rect = { x, y, w: cloth.offsetWidth, h: cloth.offsetHeight };
      const [wx, wy] = toWorld(s.rect.x + s.rect.w / 2, s.rect.y);
      s.base = { x: wx, y: wy };
      s.mesh.position.set(wx, wy, 0);
      s.mesh.scale.set(s.rect.w, s.rect.h, 1);
      s.uniforms.uSize.value.set(s.rect.w, s.rect.h);
      s.shadow.position.set(wx + 16, wy - s.rect.h / 2 - 18, -40);
      s.shadow.scale.set(s.rect.w * 1.04, s.rect.h * 1.02, 1);
      s.su.uSize.value.set(s.rect.w * 1.04, s.rect.h * 1.02);
    });
  };

  /* textures */
  const TW = 512;
  const fontsReady = (document.fonts?.ready || Promise.resolve()).then(() => Promise.all([
    document.fonts?.load('italic 30px "Instrument Serif"'), document.fonts?.load('500 13px "Geist Mono"'),
  ]).catch(() => {}));
  const texReady = fontsReady.then(() => Promise.all(swatches.map(async s => {
    const cr = s.slot.querySelector('.slot__cloth').getBoundingClientRect();
    const ratio = cr.width && cr.height ? cr.width / cr.height : 1 / 1.42;
    const c = await compose(s.slot, TW, Math.round(TW / ratio));
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    s.uniforms.uTex.value = tex;
  })));

  /* interaction */
  let hovered = -1, engaged = false, lastNudge = 0, nudgeIdx = 0, liveAt = 0;
  const setHover = i => {
    hovered = i;
    if (i > -1) engaged = true;
    swatches.forEach((s, j) => s.slot.classList.toggle('is-hover', j === i));
    hero.classList.toggle('has-hover', i > -1);
  };
  swatches.forEach((s, i) => {
    const a = s.slot.querySelector('.slot__link');
    a.addEventListener('pointerenter', () => setHover(i));
    a.addEventListener('pointerleave', () => { if (hovered === i) setHover(-1); });
    a.addEventListener('focus', () => setHover(i));
    a.addEventListener('blur', () => { if (hovered === i) setHover(-1); });
  });
  let mx = -9999, my = -9999;
  hero.addEventListener('pointermove', e => {
    const hr = hero.getBoundingClientRect();
    mx = e.clientX - hr.left; my = e.clientY - hr.top;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { mx = my = -9999; });
  hero.addEventListener('pointerdown', e => {
    if (e.target.closest('.slot')) engaged = true;
    const hr = hero.getBoundingClientRect();
    mx = e.clientX - hr.left; my = e.clientY - hr.top;
    swatches.forEach(s => { const r = s.rect; if (r && mx > r.x && mx < r.x + r.w && my > r.y && my < r.y + r.h) s.kick = Math.max(s.kick, .5); });
  }, { passive: true });

  /* soon → flutter; live → fly forward to fill the screen, then curtain */
  let flying = null;
  swatches.forEach(s => {
    const a = s.slot.querySelector('.slot__link');
    a.addEventListener('click', e => {
      e.preventDefault();
      if (flying) return;
      if (!s.live) {
        s.kick = 1;
        const r = a.getBoundingClientRect();
        SS.toast?.(a.dataset.note + ' — coming soon', r.left + r.width / 2, r.top + r.height * .45);
        return;
      }
      fly(s, a);
    });
  });

  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function fly(s, a) {
    flying = { s, t0: performance.now(), dur: reduce ? 10 : 1000 };
    hero.classList.add('is-flying');
    setHover(-1);
    const hr = hero.getBoundingClientRect();
    const r = s.rect;
    const sc = Math.max(innerWidth / r.w, innerHeight / r.h) * 1.18;
    const cx = W / 2, cy = -hr.top + innerHeight / 2;
    const top = cy - (r.h * sc) / 2;
    const [fx, fy] = toWorld(r.x + r.w / 2, r.y);
    const [tx, ty] = toWorld(cx, top);
    Object.assign(flying, { fx, fy, tx, ty, sc });
    s.mesh.renderOrder = 10;
    s.kick = .8;
    setTimeout(() => SS.go(a.href, { color: a.dataset.color, fg: a.dataset.fg, label: a.dataset.title }), reduce ? 0 : 520);
  }

  /* loop */
  const clock = new THREE.Clock();
  let running = false, visible = true, wind = 1, lastY = scrollY;
  const tick = () => {
    if (!running) return;
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), .05);
    const t = clock.elapsedTime;
    const v = SS.lenis ? Math.abs(SS.lenis.velocity) : Math.abs(scrollY - lastY);
    lastY = scrollY;
    const targetWind = (reduce ? .25 : 1) + Math.min(v * .05, 1.6);
    wind += (targetWind - wind) * .06;

    swatches.forEach((s, i) => {
      const r = s.rect; if (!r) return;
      const target = hovered === i ? 1 : 0;
      s.hover += (target - s.hover) * (1 - Math.pow(.0025, dt));
      const lx = mx - (r.x + r.w / 2), ly = -(my - r.y);
      const inside = mx > r.x - 40 && mx < r.x + r.w + 40 && my > r.y - 20 && my < r.y + r.h + 40;
      s.push += ((inside ? 1 : 0) - s.push) * .08;
      if (inside) s.uniforms.uMouse.value.set(lx, ly);
      s.kick *= Math.pow(.18, dt);
      const u = s.uniforms;
      u.uTime.value = t;
      u.uWind.value = wind;
      u.uHover.value = s.hover;
      u.uPush.value = s.push * (reduce ? .3 : 1);
      u.uKick.value = s.kick;
      u.uDim.value += (((hovered > -1 && hovered !== i) || (flying && flying.s !== s) ? 1 : 0) - u.uDim.value) * .08;
      s.su.uHover.value = s.hover;
      if (!flying && s.base) {
        // drop onto the rail together with the DOM clip + tag
        if (s.enterT == null && hero.classList.contains('is-live')) s.enterT = performance.now() + (reduce ? 0 : 350 + i * 100);
        const ep = s.enterT == null ? 0 : Math.min(1, Math.max(0, (performance.now() - s.enterT) / 1500));
        const c1 = 1.25, q = ep - 1, e = ep >= 1 ? 1 : 1 + (c1 + 1) * q * q * q + c1 * q * q;
        s.mesh.position.y = s.base.y + (1 - e) * 40;
        s.mesh.rotation.z = (1 - e) * .035;
        u.uAlpha.value = s.su.uAlpha.value = Math.min(1, ep * 2.2);
        if (ep < 1) s.kick = Math.max(s.kick, (1 - ep) * .5);
        s.shadow.position.y = s.mesh.position.y - r.h / 2 - 18;
      }
      s.shadow.position.x = s.mesh.position.x + 16 + s.hover * 10;
    });

    // idle nudge: until someone touches a swatch, one live swatch tugs every few seconds
    const now = performance.now();
    if (!liveAt && hero.classList.contains('is-live')) liveAt = now;
    if (!engaged && !flying && !reduce && liveAt && now > (lastNudge ? lastNudge + 5200 : liveAt + 2800)) {
      const live = swatches.filter(o => o.live);
      const s = live[nudgeIdx++ % live.length];
      if (s) {
        lastNudge = now;
        s.kick = 1;
        s.slot.classList.remove('is-nudge'); void s.slot.offsetWidth; s.slot.classList.add('is-nudge');
        setTimeout(() => s.slot.classList.remove('is-nudge'), 950);
      }
    }

    if (flying) {
      const p = Math.min(1, (performance.now() - flying.t0) / flying.dur);
      const e = ease(p);
      const s = flying.s;
      const sc = 1 + (flying.sc - 1) * e;
      s.mesh.position.set(flying.fx + (flying.tx - flying.fx) * e, flying.fy + (flying.ty - flying.fy) * e, 60 * e);
      s.mesh.scale.set(s.rect.w * sc, s.rect.h * sc, 1);
      s.uniforms.uFlat.value = Math.min(1, e * 1.4);
      s.su.uAlpha.value = 1 - e;
      swatches.forEach(o => { if (o !== s) { o.uniforms.uAlpha.value = 1 - e; o.su.uAlpha.value = 1 - e; o.mesh.position.y -= e * 2; } });
    }
    renderer.render(scene, camera);
  };
  const start = () => { if (!running && visible) { running = true; clock.getDelta(); tick(); } };
  const stop = () => { running = false; };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(hero);
  new ResizeObserver(() => { if (!flying) layout(); }).observe(hero);
  addEventListener('pageshow', e => { // back button: restore the rack
    if (!e.persisted) return;
    flying = null; hero.classList.remove('is-flying');
    swatches.forEach(s => { s.mesh.renderOrder = 2; s.uniforms.uFlat.value = 0; s.uniforms.uAlpha.value = 1; s.su.uAlpha.value = 1; s.uniforms.uDim.value = 0; });
    layout(); start();
  });

  layout();
  texReady.then(() => {
    layout();
    renderer.render(scene, camera);
    hero.classList.add('gl-on');
    resolveReady();
    start();
  }).catch(err => { console.warn('[swatches]', err); canvas.remove(); hero.classList.add('no-gl'); resolveReady(); });
}

if (hero && slots.length) init(); else resolveReady();
