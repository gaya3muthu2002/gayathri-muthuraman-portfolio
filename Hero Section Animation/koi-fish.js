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
