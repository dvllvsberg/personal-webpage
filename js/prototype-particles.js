/* Prototype background — glitch particles + lag bursts */

(function () {
  const canvas = document.getElementById('proto-particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const GLYPHS = '01█░▒▓X7F#@/\\|<>[]{}DEADBEEF';
  const COLORS = ['#45100a', '#561208', '#380a06', '#6c1810', '#240604', '#551810', '#7a2214'];
  let w = 0;
  let h = 0;
  let particles = [];
  let lagUntil = 0;
  let flashUntil = 0;
  let slideshowPhase = 0;
  let slideshowNext = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnParticle() {
    const type = Math.random();
    return {
      x: rand(0, w),
      y: rand(0, h),
      vx: rand(-0.4, 0.4),
      vy: rand(-0.6, 0.6),
      w: rand(2, type > 0.7 ? 80 : 24),
      h: rand(1, type > 0.85 ? 3 : 8),
      life: rand(40, 200),
      maxLife: 200,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      kind: type > 0.55 ? 'bar' : type > 0.25 ? 'glyph' : 'block',
      lag: Math.random() < 0.15,
      glitch: 0
    };
  }

  function initParticles() {
    const count = Math.min(65, Math.floor((w * h) / 24000));
    particles = Array.from({ length: count }, spawnParticle);
  }

  function burstLag() {
    lagUntil = performance.now() + rand(80, 280);
    particles.forEach((p) => {
      if (Math.random() < 0.4) {
        p.glitch = 8 + Math.floor(Math.random() * 12);
        p.x = rand(0, w);
        p.y = rand(0, h);
      }
    });
    if (Math.random() < 0.2) {
      flashUntil = performance.now() + rand(40, 100);
    }
  }

  function drawSlideshow(now) {
    if (now < slideshowNext) return;
    slideshowNext = now + rand(7000, 14000);
    slideshowPhase = (slideshowPhase + 1) % 4;

    ctx.save();
    ctx.globalAlpha = rand(0.025, 0.055);
    const sliceH = h / 6;
    for (let i = 0; i < 6; i++) {
      if (Math.random() < 0.65) continue;
      const y = i * sliceH + rand(-20, 20);
      ctx.fillStyle = COLORS[slideshowPhase % COLORS.length];
      ctx.fillRect(rand(-40, 40), y, w + 80, sliceH * rand(0.2, 0.6));
    }
    ctx.globalAlpha = rand(0.02, 0.04);
    ctx.font = `${rand(8, 14)}px monospace`;
    for (let i = 0; i < 5; i++) {
      let s = '';
      const len = 4 + Math.floor(Math.random() * 10);
      for (let j = 0; j < len; j++) {
        s += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fillText(s, rand(0, w), rand(0, h));
    }
    ctx.restore();
  }

  function tick(now) {
    const lagging = now < lagUntil;
    ctx.clearRect(0, 0, w, h);

    if (now >= slideshowNext - 200) drawSlideshow(now);

    if (now > flashUntil - 200 && now < flashUntil) {
      ctx.fillStyle = `rgba(55, 10, 0, ${rand(0.025, 0.05)})`;
      ctx.fillRect(rand(-30, 30), rand(-20, 20), w, h);
    }

    particles.forEach((p) => {
      if (p.lag && lagging && Math.random() < 0.7) return;

      if (p.glitch > 0) {
        p.glitch--;
        p.x += rand(-12, 12);
        p.y += rand(-6, 6);
      } else if (!lagging) {
        p.x += p.vx;
        p.y += p.vy;
      }

      p.life--;
      if (p.life <= 0 || p.x < -100 || p.x > w + 100 || p.y < -100 || p.y > h + 100) {
        Object.assign(p, spawnParticle());
        p.y = Math.random() < 0.5 ? -10 : rand(0, h);
      }

      const alpha = Math.min(1, p.life / 80) * rand(0.18, 0.32);
      ctx.globalAlpha = alpha;

      if (p.kind === 'glyph') {
        ctx.font = `${rand(7, 11)}px monospace`;
        ctx.fillStyle = p.color;
        ctx.fillText(p.glyph, p.x, p.y);
      } else if (p.kind === 'bar') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.globalAlpha = alpha * 0.45;
        ctx.fillRect(p.x + rand(-1, 1), p.y + rand(-1, 1), p.w, p.h);
      }
    });

    ctx.globalAlpha = 1;

    if (Math.random() < 0.002) burstLag();

    requestAnimationFrame(tick);
  }

  resize();
  initParticles();
  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });
  slideshowNext = performance.now() + 3000;
  requestAnimationFrame(tick);
})();
