/* scratch-hero.js — "how gaya works" run toy
   Clicking the green flag runs the assembled blocks top-to-bottom; each block
   highlights in turn and grows its matching element in the stage garden.
   Base (no-JS / reduced-motion) state = everything already grown & visible. */
(function () {
  const hero = document.getElementById('scratch-hero');
  if (!hero) return;

  const flag    = hero.querySelector('.sb-flag');
  const stop    = hero.querySelector('.sb-stop');
  const blocks  = [...hero.querySelectorAll('.sb-block[data-step]')];
  const grows   = [...hero.querySelectorAll('.grow[data-step], .sb-flow [data-step]')];
  const stepEl  = hero.querySelector('#sb-step');
  const stateEl = hero.querySelector('#sb-state');
  const countEl = hero.querySelector('#sb-count');
  const reduce  = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const growFor = (step) => grows.filter(g => g.dataset.step === step);
  let shipped = 0, running = false, timers = [];

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function setSeeded() {                 // reset garden to bare soil
    blocks.forEach(b => b.classList.remove('is-active', 'is-done'));
    grows.forEach(g => g.classList.remove('grown'));
    stepEl.textContent = '0 / ' + blocks.length;
    stateEl.textContent = 'ready — press \u2691';
    stateEl.className = 'ready';
  }

  function finishAll() {                  // full garden, no animation
    blocks.forEach(b => { b.classList.remove('is-active'); b.classList.add('is-done'); });
    grows.forEach(g => g.classList.add('grown'));
    stepEl.textContent = blocks.length + ' / ' + blocks.length;
    stateEl.textContent = 'shipped \u2713';
    stateEl.className = 'done';
  }

  function run() {
    if (running) return;
    running = true;
    clearTimers();
    setSeeded();
    hero.classList.add('is-running');
    flag.classList.add('lit');
    stateEl.textContent = 'running\u2026';
    stateEl.className = 'run';

    const stepMs = 900;
    blocks.forEach((block, i) => {
      timers.push(setTimeout(() => {
        blocks.forEach(b => b.classList.remove('is-active'));
        block.classList.add('is-active');
        if (i > 0) blocks[i - 1].classList.add('is-done');
        stepEl.textContent = (i + 1) + ' / ' + blocks.length;
        growFor(block.dataset.step).forEach(g => g.classList.add('grown'));
      }, stepMs * (i + 1)));
    });

    timers.push(setTimeout(() => {
      blocks.forEach(b => { b.classList.remove('is-active'); b.classList.add('is-done'); });
      shipped += 1;
      countEl.textContent = shipped;
      stateEl.textContent = 'shipped \u2713';
      stateEl.className = 'done';
      flag.classList.remove('lit');
      hero.classList.remove('is-running');
      running = false;
    }, stepMs * (blocks.length + 1)));
  }

  function halt() {
    if (!running) return;
    clearTimers();
    running = false;
    flag.classList.remove('lit');
    hero.classList.remove('is-running');
    finishAll();                          // stopping snaps to the finished garden
  }

  flag.addEventListener('click', run);
  stop.addEventListener('click', halt);

  // Intro: start from bare soil, then auto-run once so the hero is alive.
  if (reduce) { finishAll(); shipped = 1; countEl.textContent = shipped; }
  else {
    setSeeded();
    const kick = () => { if (!running) run(); };
    // fire even if rAF is throttled in a background tab
    setTimeout(kick, 650);
    if (document.hidden) document.addEventListener('visibilitychange', () => {
      if (!document.hidden && shipped === 0 && !running) run();
    }, { once: true });
  }
})();
