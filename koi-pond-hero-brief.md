# Koi Pond Hero — Build Brief

A full-viewport portfolio **hero section animation**: white koi swim in a slow elliptical orbit around a centered headline, over a living pastel gradient ("pond"), with white light motes that react to the cursor. Plain HTML + CSS + vanilla JS Canvas — no frameworks.

Paste this whole file into a new Claude conversation to recreate or continue the design.

---

## 1. Concept & references

- **Vibe:** calm, ethereal, "digital koi pond." Soft, personal, pastel — inspired by a watercolor garden site, a retro cute portfolio, and `mandyslai.com` (Framer portfolio).
- **Subject:** Gayathri Muthuraman — **UX designer**. Tagline: *"thinking in systems, solving in decisions."*
- **Motion:** entrance fade/rise for text + continuous ambient loop (orbiting koi, drifting water, twinkling motes).
- **Interaction:** koi shy away from the cursor; motes part to reveal a clear pocket of "water."

## 2. Design tokens

**Background gradient** (rebuilt in CSS from a pink→lavender→peach reference). Sampled hexes: top-left `#e3e3ee`, top-right `#e4cbaa`, bottom-left `#cbd4f5`, center `#eedfe2`, bottom-right `#f3d7cf`.

**Type:** Fira Mono (Google Fonts), weights 400/500/700. All-lowercase. Name in 700 at `clamp(40px,7.2vw,104px)`.

**Color variables:**
```
--ink:#524d5d;  --ink-soft:#7c7789;  --ink-faint:#a8a3b2;  --accent:#b07b86;
```
Koi & motes are pure white (`#fff`). Status dot is sage `#7faa86`.

## 3. Layout (z-order, back → front)

1. `.hero` — gradient background + `::after` diagonal striations.
2. `.blob` ×3 — large blurred color "currents," `mix-blend:soft-light`, slow drift (living water).
3. `svg.caustics` — animated `feTurbulence` shimmer, `soft-light`, opacity ~.32.
4. `.layer` (text overlay): top bar (`.sig` name left, `nav` right), centered `.block` (kicker / `h1` name / `.tag`), `.status` bottom-left, `.hint` bottom-right.
5. `canvas#pond` — koi + motes, `pointer-events:none` so it sits on top without blocking nav. Koi are kept OUT of the text zone, so they never overlap the headline.

## 4. Behavior spec

**Koi (`koi-fish.js`)** — procedural, top-down:
- Body = a chain of joints that follow the head at fixed segment length (constraint relaxation). Outline swept from a width PROFILE (rounder = shorter `segLen`, wider `bodyW`). Drawn as a smooth closed quadratic curve with two white **glow** passes (`shadowColor` white). Soft swept-back pectoral fins + a flowing oscillating caudal tail.
- **Orbit:** steer along the tangent of an **ellipse** centered on the headline (`env.cx/cy/rx/ry`), with a radial correction toward a preferred band (`rInN..rOutN`). All fish orbit the same direction (`dir:1`).
- **Keep-out:** a hard outward push when inside `keepOutN` (the text ellipse) → fish never cross the title.
- **Cursor:** within ~170px they steer away (scatter).

**Motes (`koi-particles.js`):** brownian drift, twinkle (sine alpha), wrap at edges, repel within 150px of cursor.

**Living water:** 3 drifting blurred color blobs (CSS keyframes) + animated SVG `feTurbulence` caustics.

**Env (measured each resize):** `cx,cy` = center of the `.block` text; `rx = block.w/2 + 78`, `ry = block.h/2 + 66`; `rInN:1.08, rOutN:1.5, keepOutN:1.0`. Recomputed on resize so the keep-out always hugs the actual text.

## 5. Gotchas

- **Canvas only animates when the tab is visible** — browsers suspend `requestAnimationFrame` (and CSS animations) in backgrounded tabs. Movement is frame-based (not `dt`-scaled), so re-focusing never teleports fish.
- Respects `prefers-reduced-motion` (renders one static frame, pauses SVG via `pauseAnimations()`).
- `cursor:crosshair` on `.hero`; mouse coords are rect-relative.
- DPR-aware canvas sizing; `.block` is measured live to drive the orbit/keep-out ellipse.

## 6. File structure

```
Koi Pond Hero.html   ← markup, styles, gradient, water bg, app loop
koi-fish.js          ← Koi class (window.Koi)
koi-particles.js     ← ParticleField class (window.ParticleField)
```

---

## 7. Full source

### `Koi Pond Hero.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Gayathri Muthuraman · Koi Pond Hero</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fira+Mono:wght@400;500;700&display=swap');

  :root{ --ink:#524d5d; --ink-soft:#7c7789; --ink-faint:#a8a3b2; --accent:#b07b86; }
  *{ box-sizing:border-box; }
  html,body{ margin:0; height:100%; }
  body{ font-family:'Fira Mono', ui-monospace, monospace; color:var(--ink); background:#e9e1ea; }

  .hero{
    position:relative; width:100vw; height:100vh; overflow:hidden; cursor:crosshair;
    background:
      radial-gradient(115% 95% at 100% 2%,  rgba(228,200,166,0.92) 0%, rgba(228,200,166,0) 52%),
      radial-gradient(120% 105% at 0% 100%, rgba(199,209,246,0.95) 0%, rgba(199,209,246,0) 55%),
      radial-gradient(85% 75% at 52% 46%,   rgba(244,219,217,0.70) 0%, rgba(244,219,217,0) 62%),
      linear-gradient(108deg, #d7dbf1 0%, #e9dde3 42%, #f1dadb 60%, #ead2bb 100%);
  }

  /* ---- living water: slow drifting colour currents ---- */
  .blob{ position:absolute; border-radius:50%; pointer-events:none; filter:blur(60px);
    mix-blend-mode:soft-light; z-index:1; will-change:transform; }
  .blob.a{ width:60vw; height:60vw; left:-10vw; top:-15vw; background:rgba(176,189,246,0.85);
    animation:cur1 34s ease-in-out infinite alternate; }
  .blob.b{ width:55vw; height:55vw; right:-12vw; top:-8vw; background:rgba(233,196,166,0.8);
    animation:cur2 41s ease-in-out infinite alternate; }
  .blob.c{ width:52vw; height:52vw; left:25vw; bottom:-18vw; background:rgba(238,200,210,0.85);
    animation:cur3 47s ease-in-out infinite alternate; }
  @keyframes cur1{ from{transform:translate(0,0) scale(1);} to{transform:translate(14vw,10vh) scale(1.18);} }
  @keyframes cur2{ from{transform:translate(0,0) scale(1.05);} to{transform:translate(-12vw,12vh) scale(0.9);} }
  @keyframes cur3{ from{transform:translate(0,0) scale(1);} to{transform:translate(-8vw,-12vh) scale(1.15);} }

  /* ---- shimmering caustics (animated turbulence) ---- */
  .caustics{ position:absolute; inset:0; width:100%; height:100%; z-index:1;
    mix-blend-mode:soft-light; opacity:.32; pointer-events:none; }

  /* faint diagonal water striations */
  .hero::after{ content:""; position:absolute; inset:0; pointer-events:none; z-index:1;
    background:repeating-linear-gradient(116deg, rgba(255,255,255,0.03) 0 2px, rgba(255,255,255,0) 2px 26px); }

  /* koi + particles sit on top, but are kept out of the text zone */
  #pond{ position:absolute; inset:0; z-index:3; pointer-events:none; }

  /* ---- text overlay ---- */
  .layer{ position:absolute; inset:0; z-index:2; }
  .topbar{ position:absolute; top:42px; left:54px; right:54px;
    display:flex; align-items:center; justify-content:space-between; }
  .sig{ font-size:14px; color:var(--ink-soft); }
  nav{ display:flex; gap:26px; }
  nav a{ position:relative; text-decoration:none; color:var(--ink-soft); font-size:14px;
    padding:2px 0; transition:color .25s; pointer-events:auto; }
  nav a::after{ content:""; position:absolute; left:0; bottom:-2px; width:100%; height:1.5px;
    background:var(--accent); transform:scaleX(0); transform-origin:left; transition:transform .28s cubic-bezier(.22,.61,.36,1); }
  nav a:hover{ color:var(--ink); } nav a:hover::after{ transform:scaleX(1); }

  .center{ position:absolute; left:50%; top:48%; transform:translate(-50%,-50%);
    width:100%; display:flex; justify-content:center; }
  .block{ max-width:760px; text-align:center; padding:0 24px; }
  .kicker{ font-size:14px; letter-spacing:.16em; color:var(--accent); margin:0 0 16px; }
  h1{ font-weight:700; line-height:0.96; margin:0;
    font-size:clamp(40px,7.2vw,104px); color:var(--ink); letter-spacing:-0.01em; }
  h1 .two{ color:var(--accent); }
  .tag{ margin:24px auto 0; max-width:520px; font-size:clamp(13px,1.4vw,16px);
    line-height:1.7; color:var(--ink-soft); }

  .status{ position:absolute; left:54px; bottom:40px; display:inline-flex; align-items:center;
    gap:9px; font-size:13px; color:var(--ink-soft); }
  .status .dot{ width:8px; height:8px; border-radius:50%; background:#7faa86;
    box-shadow:0 0 0 4px rgba(127,170,134,0.18); animation:pulse 3s ease-in-out infinite; }
  .hint{ position:absolute; right:54px; bottom:40px; font-size:12px; color:var(--ink-faint); }
  @keyframes pulse{ 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(.7);opacity:.6;} }

  .rise{ opacity:0; transform:translateY(20px); animation:rise .9s cubic-bezier(.22,.61,.36,1) forwards; }
  .fade{ opacity:0; animation:fade 1.1s ease forwards; }
  @keyframes rise{ to{opacity:1; transform:none;} }
  @keyframes fade{ to{opacity:1;} }

  @media (prefers-reduced-motion: reduce){
    .blob,.status .dot{ animation:none; }
    .rise,.fade{ animation:none; opacity:1; transform:none; }
  }
</style>
</head>
<body>
<template id="__bundler_thumbnail">
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="tg" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#cbd4f5"/><stop offset="0.55" stop-color="#f1dadb"/><stop offset="1" stop-color="#ead2bb"/>
    </linearGradient></defs>
    <rect width="100" height="100" fill="url(#tg)"/>
    <g fill="#fff"><ellipse cx="38" cy="40" rx="9" ry="4.5" transform="rotate(-20 38 40)"/>
    <ellipse cx="62" cy="60" rx="9" ry="4.5" transform="rotate(160 62 60)"/></g>
    <circle cx="30" cy="64" r="1.4" fill="#fff"/><circle cx="70" cy="34" r="1.4" fill="#fff"/>
  </svg>
</template>
<div class="hero" id="hero" data-screen-label="koi pond hero">
  <div class="blob a"></div>
  <div class="blob b"></div>
  <div class="blob c"></div>

  <svg class="caustics" id="caustics" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="water" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.010 0.016" numOctaves="2" seed="7" result="n">
          <animate attributeName="baseFrequency" dur="38s" values="0.010 0.016;0.014 0.011;0.010 0.016" repeatCount="indefinite"></animate>
        </feTurbulence>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.85 0 0 0 -0.32"></feColorMatrix>
      </filter>
    </defs>
    <rect width="100%" height="100%" filter="url(#water)"></rect>
  </svg>

  <div class="layer">
    <div class="topbar">
      <div class="sig fade" style="animation-delay:.1s">gayathri muthuraman</div>
      <nav class="fade" style="animation-delay:.2s">
        <a href="#about">about</a>
        <a href="#projects">projects</a>
        <a href="#contact">contact</a>
      </nav>
    </div>

    <div class="center">
      <div class="block">
        <p class="kicker rise" style="animation-delay:.25s">ux designer</p>
        <h1 class="rise" style="animation-delay:.4s">gayathri<br><span class="two">muthuraman</span></h1>
        <p class="tag fade" style="animation-delay:.75s">thinking in systems, solving in decisions — a portfolio of products shaped by structure, research and quiet, deliberate craft.</p>
      </div>
    </div>

    <div class="status fade" style="animation-delay:1s"><span class="dot"></span>available for work</div>
    <div class="hint fade" style="animation-delay:1.2s">move your cursor through the water</div>
  </div>

  <canvas id="pond"></canvas>
</div>

<script src="koi-fish.js"></script>
<script src="koi-particles.js"></script>
<script>
(function () {
  const hero = document.getElementById('hero');
  const block = document.querySelector('.block');
  const canvas = document.getElementById('pond');
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, dpr = 1;
  const mouse = { x: -9999, y: -9999, active: false };
  let koi = [], field = null, env = null;

  function computeEnv() {
    const hb = hero.getBoundingClientRect(), b = block.getBoundingClientRect();
    const cx = (b.left - hb.left) + b.width / 2;
    const cy = (b.top - hb.top) + b.height / 2;
    const rx = Math.max(210, b.width / 2 + 78);
    const ry = Math.max(150, b.height / 2 + 66);
    return { cx, cy, rx, ry, dir: 1, rInN: 1.08, rOutN: 1.5, keepOutN: 1.0 };
  }

  function fishScale() { return Math.max(0.6, Math.min(1.0, Math.min(W, H) / 1080)); }
  function fishCount() { return Math.max(5, Math.min(9, Math.round(4 + (W * H) / 420000))); }

  function build() {
    const s = fishScale();
    koi = [];
    for (let i = 0; i < fishCount(); i++) koi.push(new Koi(W, H, s * (0.78 + Math.random() * 0.42), env));
    field = new ParticleField(W, H);
  }

  function resize() {
    W = hero.clientWidth; H = hero.clientHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    env = computeEnv();
    if (!koi.length) build(); else field.resize(W, H);
  }

  let mt = 0;
  function setMouse(x, y) { mouse.x = x; mouse.y = y; mouse.active = true; clearTimeout(mt);
    mt = setTimeout(() => { mouse.active = false; }, 220); }
  function fromEvent(e) { const r = hero.getBoundingClientRect(); setMouse(e.clientX - r.left, e.clientY - r.top); }
  hero.addEventListener('pointermove', fromEvent);
  hero.addEventListener('pointerdown', fromEvent);
  hero.addEventListener('pointerleave', () => { mouse.active = false; });

  let start = performance.now();
  function frame(now) {
    const t = (now - start) / 1000;
    ctx.clearRect(0, 0, W, H);
    field.update(t, mouse); field.draw(ctx, t);
    for (const k of koi) { k.update(t, mouse, W, H, env); k.draw(ctx, t); }
    requestAnimationFrame(frame);
  }
  function frameStatic() {
    ctx.clearRect(0, 0, W, H);
    field.draw(ctx, 0.5);
    for (const k of koi) k.draw(ctx, 0.5);
  }

  window.addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(resize, 120); });
  resize();
  if (reduce) {
    const c = document.getElementById('caustics'); if (c && c.pauseAnimations) c.pauseAnimations();
    frameStatic();
  } else requestAnimationFrame(frame);
})();
</script>
</body>
</html>
```

### `koi-fish.js`
```js
/* koi-fish.js — procedural white koi (top-down), orbiting the headline.
   A short chain of joints follows the head at fixed spacing; the body is a
   smooth closed curve swept around that spine. Fish steer along an elliptical
   orbit around the centre and are firmly excluded from the text ellipse. */

(function () {
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  function angleDiff(a, b) {
    let d = (a - b) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  }

  // rounder, fuller body — half-width along the spine, nose -> tail
  const PROFILE = [0.42, 0.74, 0.93, 1.0, 0.99, 0.91, 0.79, 0.63, 0.45, 0.26];

  class Koi {
    constructor(W, H, scale, env) {
      this.scale = scale;
      this.n = PROFILE.length;
      this.segLen = 8.2 * scale;     // shorter -> rounder
      this.bodyW = 12.5 * scale;     // wider -> rounder
      this.profile = PROFILE;
      this.speed = rand(0.85, 1.2) * Math.max(0.85, scale);
      this.maxTurn = 0.04;
      this.phase = rand(0, TAU);
      this.finPhase = rand(0, TAU);
      this.alpha = rand(0.8, 0.95);
      this.rFrac = Math.random();    // where in the orbit band this fish lives
      this.wob = rand(0.18, 0.32);   // slow radial breathing

      // seed on the orbit ellipse so there's no snap on load
      const a = rand(0, TAU);
      const rn = env.rInN + this.rFrac * (env.rOutN - env.rInN);
      const hx = env.cx + Math.cos(a) * env.rx * rn;
      const hy = env.cy + Math.sin(a) * env.ry * rn;
      this.heading = a + Math.PI / 2 * env.dir;
      this.joints = [];
      for (let i = 0; i < this.n; i++) {
        this.joints.push({ x: hx - Math.cos(this.heading) * this.segLen * i,
                           y: hy - Math.sin(this.heading) * this.segLen * i });
      }
    }

    update(t, mouse, W, H, env) {
      const head = this.joints[0];
      const dx = head.x - env.cx, dy = head.y - env.cy;
      const nX = dx / env.rx, nY = dy / env.ry;           // normalised (ellipse) space
      const rn = Math.hypot(nX, nY) || 1;
      const unx = nX / rn, uny = nY / rn;                  // radial (out) dir
      const tnx = -uny * env.dir, tny = unx * env.dir;     // tangential (orbit) dir

      // tangential glide + correction back toward the preferred orbit radius
      let vx = tnx * env.rx, vy = tny * env.ry;
      const prefRn = env.rInN + this.rFrac * (env.rOutN - env.rInN)
                   + Math.sin(t * this.wob + this.phase) * 0.06;
      const rErr = prefRn - rn;
      vx += unx * env.rx * rErr * 2.4;
      vy += uny * env.ry * rErr * 2.4;

      // hard keep-out: never enter the text ellipse
      if (rn < env.keepOutN) {
        const f = (env.keepOutN - rn) * 5;
        vx += unx * env.rx * f;
        vy += uny * env.ry * f;
      }

      // shy away from the cursor
      if (mouse.active) {
        const mdx = head.x - mouse.x, mdy = head.y - mouse.y;
        const md = Math.hypot(mdx, mdy), R = 170 * this.scale;
        if (md < R) {
          const f = (1 - md / R) * 2.6;
          vx += (mdx / (md || 1)) * f * env.rx;
          vy += (mdy / (md || 1)) * f * env.ry;
        }
      }

      const desired = Math.atan2(vy, vx);
      const diff = angleDiff(desired, this.heading);
      this.heading += Math.max(-this.maxTurn, Math.min(this.maxTurn, diff));

      const sp = this.speed * (1 - Math.min(0.45, Math.abs(diff) * 1.2));
      head.x += Math.cos(this.heading) * sp;
      head.y += Math.sin(this.heading) * sp;

      // body undulation
      const nx = -Math.sin(this.heading), ny = Math.cos(this.heading);
      const wig = Math.sin(t * 4 + this.phase) * 0.8 * this.scale;
      head.x += nx * wig; head.y += ny * wig;

      // constrain the chain to fixed segment lengths
      for (let i = 1; i < this.n; i++) {
        const p = this.joints[i - 1], c = this.joints[i];
        let ddx = c.x - p.x, ddy = c.y - p.y;
        const d = Math.hypot(ddx, ddy) || 1;
        c.x = p.x + (ddx / d) * this.segLen;
        c.y = p.y + (ddy / d) * this.segLen;
      }
    }

    _outline() {
      const p = this.joints, n = this.n, L = [], R = [];
      for (let i = 0; i < n; i++) {
        const a = p[Math.max(0, i - 1)], b = p[Math.min(n - 1, i + 1)];
        let tx = b.x - a.x, ty = b.y - a.y;
        const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const nx = -ty, ny = tx, r = this.bodyW * this.profile[i];
        L.push({ x: p[i].x + nx * r, y: p[i].y + ny * r });
        R.push({ x: p[i].x - nx * r, y: p[i].y - ny * r });
      }
      let tx = p[0].x - p[1].x, ty = p[0].y - p[1].y;
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const nose = { x: p[0].x + tx * this.bodyW * 0.45, y: p[0].y + ty * this.bodyW * 0.45 };
      return { L, R, nose };
    }

    draw(ctx, t) {
      const p = this.joints, n = this.n;
      const { L, R, nose } = this._outline();
      const loop = [nose, ...R, ...L.slice().reverse()];
      const bw = this.bodyW;

      // ---- pectoral fins: soft leaves sweeping back from the flanks ----
      const fi = 3, fp = p[fi];
      let ftx = p[fi - 1].x - p[fi + 1].x, fty = p[fi - 1].y - p[fi + 1].y;
      const ftl = Math.hypot(ftx, fty) || 1; ftx /= ftl; fty /= ftl;
      const fnx = -fty, fny = ftx;
      const beat = 0.65 + 0.3 * (Math.sin(t * 2.6 + this.finPhase) * 0.5 + 0.5);
      ctx.fillStyle = `rgba(255,255,255,${this.alpha * 0.22})`;
      for (const s of [1, -1]) {
        const ox = fp.x + fnx * s * bw * 0.5, oy = fp.y + fny * s * bw * 0.5;
        const tx2 = ox - ftx * bw * 1.9 + fnx * s * bw * 1.0 * beat;
        const ty2 = oy - fty * bw * 1.9 + fny * s * bw * 1.0 * beat;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.quadraticCurveTo(ox - ftx * bw * 0.5 + fnx * s * bw * 1.3 * beat,
                             oy - fty * bw * 0.5 + fny * s * bw * 1.3 * beat, tx2, ty2);
        ctx.quadraticCurveTo(ox - ftx * bw * 1.6, oy - fty * bw * 1.6, ox, oy);
        ctx.fill();
      }

      // ---- flowing caudal tail ----
      const tail = p[n - 1], pre = p[n - 2];
      let btx = tail.x - pre.x, bty = tail.y - pre.y;
      const btl = Math.hypot(btx, bty) || 1; btx /= btl; bty /= btl;
      const tnx = -bty, tny = btx;
      const swish = Math.sin(t * 4 + this.phase + 1.2) * bw * 1.5;
      const fanLen = bw * 3.4, fanW = bw * 2.2;
      ctx.fillStyle = `rgba(255,255,255,${this.alpha * 0.28})`;
      for (const s of [1, -1]) {
        const tipx = tail.x + btx * fanLen + tnx * (fanW * s + swish);
        const tipy = tail.y + bty * fanLen + tny * (fanW * s + swish);
        ctx.beginPath();
        ctx.moveTo(tail.x + tnx * bw * 0.4 * s, tail.y + tny * bw * 0.4 * s);
        ctx.quadraticCurveTo(
          tail.x + btx * fanLen * 0.5 + tnx * (fanW * 0.3 * s + swish * 0.6),
          tail.y + bty * fanLen * 0.5 + tny * (fanW * 0.3 * s + swish * 0.6),
          tipx, tipy);
        ctx.quadraticCurveTo(tail.x + btx * fanLen * 0.7, tail.y + bty * fanLen * 0.7, tail.x, tail.y);
        ctx.fill();
      }

      // ---- body: white with a soft glow halo ----
      ctx.save();
      ctx.shadowColor = `rgba(255,255,255,0.9)`;
      ctx.shadowBlur = 24 * this.scale;
      ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
      this._smoothClosed(ctx, loop); ctx.fill();
      ctx.shadowBlur = 13 * this.scale;
      this._smoothClosed(ctx, loop); ctx.fill();   // second pass deepens the glow
      ctx.restore();
    }

    _smoothClosed(ctx, p) {
      const len = p.length;
      ctx.beginPath();
      ctx.moveTo((p[len - 1].x + p[0].x) / 2, (p[len - 1].y + p[0].y) / 2);
      for (let i = 0; i < len; i++) {
        const cur = p[i], nxt = p[(i + 1) % len];
        ctx.quadraticCurveTo(cur.x, cur.y, (cur.x + nxt.x) / 2, (cur.y + nxt.y) / 2);
      }
      ctx.closePath();
    }
  }

  window.Koi = Koi;
})();
```

### `koi-particles.js`
```js
/* koi-particles.js — drifting white light motes that part around the cursor */
(function () {
  const rand = (a, b) => a + Math.random() * (b - a);

  class Particle {
    constructor(W, H) { this.reset(W, H, true); }
    reset(W, H, anywhere) {
      this.x = rand(0, W);
      this.y = anywhere ? rand(0, H) : rand(0, H);
      this.vx = rand(-0.12, 0.12);
      this.vy = rand(-0.12, 0.12);
      this.r = rand(0.6, 2.4);
      this.base = rand(0.18, 0.6);
      this.tw = rand(0.4, 1.4);
      this.ph = rand(0, Math.PI * 2);
      this.drift = rand(0.002, 0.014);
    }
    update(t, mouse, W, H) {
      // gentle brownian drift
      this.vx += rand(-1, 1) * this.drift;
      this.vy += rand(-1, 1) * this.drift;

      // cursor repulsion — motes part to reveal a clear pocket of water
      if (mouse.active) {
        const dx = this.x - mouse.x, dy = this.y - mouse.y;
        const d = Math.hypot(dx, dy), R = 150;
        if (d < R) {
          const f = (1 - d / R);
          this.vx += (dx / (d || 1)) * f * f * 1.1;
          this.vy += (dy / (d || 1)) * f * f * 1.1;
        }
      }

      this.vx *= 0.94; this.vy *= 0.94;
      this.x += this.vx; this.y += this.vy;

      // wrap softly around the edges
      if (this.x < -10) this.x = W + 10; else if (this.x > W + 10) this.x = -10;
      if (this.y < -10) this.y = H + 10; else if (this.y > H + 10) this.y = -10;
    }
    draw(ctx, t) {
      const a = this.base * (0.45 + 0.55 * Math.sin(t * this.tw + this.ph));
      if (a <= 0.02) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
      // faint halo on the larger motes
      if (this.r > 1.5) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a * 0.18})`;
        ctx.fill();
      }
    }
  }

  class ParticleField {
    constructor(W, H) { this.resize(W, H); }
    resize(W, H) {
      this.W = W; this.H = H;
      const target = Math.min(190, Math.round((W * H) / 11000));
      this.items = this.items || [];
      while (this.items.length < target) this.items.push(new Particle(W, H));
      this.items.length = target;
    }
    update(t, mouse) { for (const p of this.items) p.update(t, mouse, this.W, this.H); }
    draw(ctx, t) { for (const p of this.items) p.draw(ctx, t); }
  }

  window.ParticleField = ParticleField;
})();
```
