/* koi-particles.js — drifting white motes that twinkle like stars
   and part around the cursor. */
(function () {
  const rand = (a, b) => a + Math.random() * (b - a);

  class Particle {
    constructor(W, H) { this.reset(W, H, true); }
    reset(W, H, anywhere) {
      this.x = rand(0, W);
      this.y = rand(0, H);
      this.vx = rand(-0.1, 0.1);
      this.vy = rand(-0.1, 0.1);
      this.r = rand(1.1, 3.6);                 // bigger overall
      this.star = Math.random() < 0.4;         // ~40% get a 4-point glint
      if (this.star) this.r = rand(1.8, 4.2);  // glinting ones run larger
      this.base = rand(0.4, 0.95);             // brighter
      this.tw = rand(0.5, 1.7);                // twinkle speed
      this.ph = rand(0, Math.PI * 2);
      this.drift = rand(0.002, 0.014);
    }
    update(t, mouse, W, H) {
      this.vx += rand(-1, 1) * this.drift;
      this.vy += rand(-1, 1) * this.drift;

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

      if (this.x < -12) this.x = W + 12; else if (this.x > W + 12) this.x = -12;
      if (this.y < -12) this.y = H + 12; else if (this.y > H + 12) this.y = -12;
    }
    draw(ctx, t) {
      // sharper twinkle: peaks bright, dips dim (pow steepens the curve)
      const tw = 0.5 + 0.5 * Math.sin(t * this.tw + this.ph);
      const a = this.base * (0.25 + 0.75 * Math.pow(tw, 2.2));
      if (a <= 0.03) return;

      // soft glow halo
      const halo = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4);
      halo.addColorStop(0, `rgba(255,255,255,${a * 0.5})`);
      halo.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 4, 0, Math.PI * 2);
      ctx.fill();

      // bright core
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a + 0.1)})`;
      ctx.fill();

      // 4-point star glint on the brightest frames
      if (this.star && tw > 0.62) {
        const len = this.r * (3.0 + tw * 2.2);
        const ga = a * (tw - 0.5) * 1.6;
        const grad = ctx.createLinearGradient(this.x - len, this.y, this.x + len, this.y);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, `rgba(255,255,255,${ga})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = grad;
        ctx.beginPath(); ctx.moveTo(this.x - len, this.y); ctx.lineTo(this.x + len, this.y); ctx.stroke();
        const grad2 = ctx.createLinearGradient(this.x, this.y - len, this.x, this.y + len);
        grad2.addColorStop(0, 'rgba(255,255,255,0)');
        grad2.addColorStop(0.5, `rgba(255,255,255,${ga})`);
        grad2.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad2;
        ctx.beginPath(); ctx.moveTo(this.x, this.y - len); ctx.lineTo(this.x, this.y + len); ctx.stroke();
        ctx.restore();
      }
    }
  }

  class ParticleField {
    constructor(W, H) { this.resize(W, H); }
    resize(W, H) {
      this.W = W; this.H = H;
      // a little sparser than before since each mote is bigger/brighter
      const target = Math.min(150, Math.round((W * H) / 14000));
      this.items = this.items || [];
      while (this.items.length < target) this.items.push(new Particle(W, H));
      this.items.length = target;
    }
    update(t, mouse) { for (const p of this.items) p.update(t, mouse, this.W, this.H); }
    draw(ctx, t) { for (const p of this.items) p.draw(ctx, t); }
  }

  window.ParticleField = ParticleField;
})();
