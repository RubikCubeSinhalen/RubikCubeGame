(() => {
  const S = 84;
  const COL = { U: 'white', D: 'yellow', F: '#22c55e', B: '#3b82f6', R: 'red', L: '#fb923c' };
  const FACES = { U: [0, -1, 0], D: [0, 1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0] };
  const FT = { F: '', B: 'rotateY(180deg)', R: 'rotateY(90deg)', L: 'rotateY(-90deg)', U: 'rotateX(90deg)', D: 'rotateX(-90deg)' };
  // A move is {a: axis, l: layer (-1,0,1), s: +1/-1 quarter turn about +axis}
  const MV = { R: { a: 'x', l: 1, s: 1 }, L: { a: 'x', l: -1, s: -1 }, U: { a: 'y', l: -1, s: -1 }, D: { a: 'y', l: 1, s: 1 }, F: { a: 'z', l: 1, s: 1 }, B: { a: 'z', l: -1, s: -1 } };
  const NAME = { R: 'Right', L: 'Left', U: 'Up', D: 'Down', F: 'Front', B: 'Back' };
  const AX = { x: 0, y: 1, z: 2 };
  const $ = id => document.getElementById(id);
  const inv = m => ({ ...m, s: -m.s });
  const rot = (v, a, s) => {
    const [x, y, z] = v;
    return a === 'x' ? [x, -z * s, y * s] : a === 'y' ? [z * s, y, -x * s] : [-y * s, x * s, z];
  };
  const base = c => {
    const [a, b, d] = c.R, p = c.p;
    return `matrix3d(${a[0]},${a[1]},${a[2]},0,${b[0]},${b[1]},${b[2]},0,${d[0]},${d[1]},${d[2]},0,${p[0] * S},${p[1] * S},${p[2] * S},1)`;
  };

  // ---------- build the cube ----------
  const cubeEl = $('cube'), cubies = [];
  for (let x = -1; x < 2; x++) for (let y = -1; y < 2; y++) for (let z = -1; z < 2; z++) {
    const el = document.createElement('div'); el.className = 'cb';
    const cb = { p0: [x, y, z], el, st: [] }; cubies.push(cb);
    for (const f in FACES) {
      const n = FACES[f], d = document.createElement('div');
      d.className = 'f'; d.style.transform = `${FT[f]} translateZ(${S / 2}px)`;
      if (n[0] * x + n[1] * y + n[2] * z === 1) {
        d.style.setProperty('--c', COL[f]); d.classList.add('s');
        d._s = true; d._c = cb; d._n = n; cb.st.push({ f, n });
      }
      el.appendChild(d);
    }
    cubeEl.appendChild(el);
  }
  const resetCube = () => cubies.forEach(c => { c.p = c.p0.slice(); c.R = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; c.el.style.transform = base(c); });

  // ---------- engine ----------
  let queue = [], busy = false, lock = false, gen = 0;
  let hist = [], undo = [], redo = [], scrambled = false, assisted = false;
  let timer = null, t0 = 0, elapsed = 0, best = null, hl = [];
  try { best = +localStorage.getItem('cubesolve-best') || null; } catch (e) { }

  const layerOf = m => cubies.filter(c => c.p[AX[m.a]] === m.l);
  const setT = (L, a, deg) => L.forEach(c => c.el.style.transform = deg ? `rotate${a.toUpperCase()}(${deg}deg) ${base(c)}` : base(c));
  function spin(L, a, from, to, dur, done) {
    const g = gen, start = performance.now();
    (function f(t) {
      if (g !== gen) return;
      let k = Math.min(1, (t - start) / dur);
      k = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setT(L, a, from + (to - from) * k);
      k < 1 ? requestAnimationFrame(f) : done();
    })(start);
  }
  const commit = (m, L) => { L.forEach(c => { c.p = rot(c.p, m.a, m.s); c.R = c.R.map(v => rot(v, m.a, m.s)); }); setT(L, m.a, 0); };
  const rec = m => {
    const l = hist[hist.length - 1];
    if (l && l.a === m.a && l.l === m.l && l.s === -m.s) hist.pop(); else hist.push(m);
  };
  function halt() { gen++; queue = []; busy = false; lock = false; clearHint(); }

  function next() {
    const m = queue.shift();
    if (!m) { busy = false; lock = false; ui(); if (scrambled && isSolved()) win(); return; }
    busy = true;
    const L = layerOf(m), g = gen;
    spin(L, m.a, 0, m.s * 90, lock ? 110 : queue.length ? 150 : 260, () => { commit(m, L); next(); });
  }
  function log(m, kind) {
    clearHint();
    if (kind === 'user') { undo.push(m); redo = []; }
    if ((kind === 'user' || kind === 'redo') && scrambled && !timer) startTimer();
    rec(m);
  }
  function play(m, kind) { log(m, kind); queue.push(m); if (!busy) next(); ui(); }

  const userTurn = m => { if (!lock) play(m, 'user'); };
  function undoMove() { if (lock || !undo.length) return; const m = undo.pop(); redo.push(m); play(inv(m), 'undo'); }
  function redoMove() { if (lock || !redo.length) return; const m = redo.pop(); undo.push(m); play(m, 'redo'); }

  function scramble() {
    if (lock) return;
    halt(); stopTimer(); resetCube(); $('win').classList.remove('on');
    hist = []; undo = []; redo = []; elapsed = 0; assisted = false; $('time').textContent = '0:00.0';
    scrambled = true; lock = true;
    const ks = Object.keys(MV); let last = '';
    for (let i = 0; i < +$('len').value; i++) {
      let k; do k = ks[Math.random() * 6 | 0]; while (k === last);
      last = k; play(Math.random() < .5 ? inv(MV[k]) : MV[k], 'scramble');
    }
  }
  function autoSolve() {
    if (lock || busy || !hist.length) return;
    lock = true; assisted = true; stopTimer(); undo = []; redo = [];
    hist.slice().reverse().map(inv).forEach(m => play(m, 'solve'));
  }
  function reset() {
    halt(); stopTimer(); resetCube(); hist = []; undo = []; redo = [];
    scrambled = false; assisted = false; elapsed = 0; $('time').textContent = '0:00.0';
    $('win').classList.remove('on'); ui();
  }

  // ---------- hints ----------
  function describe(m) {
    const f = Object.keys(MV).find(k => MV[k].a === m.a && MV[k].l === m.l);
    if (f) return `Turn the ${NAME[f]} face ${MV[f].s === m.s ? 'clockwise ↻' : 'counter-clockwise ↺'}`;
    const g = { x: 'L', y: 'D', z: 'F' }[m.a];
    return `Turn the middle layer ${MV[g].s === m.s ? 'clockwise ↻' : 'counter-clockwise ↺'} as seen from the ${NAME[g]}`;
  }
  function hint() {
    if (lock || busy || !hist.length) return;
    const m = inv(hist[hist.length - 1]); clearHint();
    layerOf(m).forEach(c => { c.el.classList.add('hl'); hl.push(c); });
    $('tip').textContent = describe(m); $('tip').classList.add('on');
  }
  function clearHint() { hl.forEach(c => c.el.classList.remove('hl')); hl = []; $('tip').classList.remove('on'); }

  // ---------- state, timer, win ----------
  function isSolved() {
    const m = {};
    for (const c of cubies) for (const s of c.st) {
      const n = s.n, w = [0, 1, 2].map(i => c.R[0][i] * n[0] + c.R[1][i] * n[1] + c.R[2][i] * n[2]).join();
      if (m[w] && m[w] !== s.f) return false; m[w] = s.f;
    }
    return true;
  }
  const fmt = ms => { const t = Math.floor(ms / 100) / 10; return `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`; };
  function startTimer() { t0 = performance.now(); timer = setInterval(() => { elapsed = performance.now() - t0; $('time').textContent = fmt(elapsed); }, 100); }
  function stopTimer() { clearInterval(timer); timer = null; }
  function ui() {
    $('moves').textContent = undo.length;
    $('best').textContent = best ? fmt(best) : '–';
    $('scramble').disabled = lock; $('solve').disabled = lock || !hist.length;
    $('undo').disabled = lock || !undo.length; $('redo').disabled = lock || !redo.length;
    $('hint').disabled = lock || !hist.length;
    $('status').textContent = lock ? 'Working…' : scrambled
      ? (timer ? 'Keep going. Get each face to a single colour.' : 'Scrambled. Your first move starts the clock.')
      : 'Free play. Press Scramble to start a timed game.';
  }
  function win() {
    const ran = timer; stopTimer(); scrambled = false;
    if (assisted) { $('wt').textContent = 'Solved by auto-solve'; $('wp').textContent = 'Scramble again and try it yourself.'; }
    else {
      let note = '';
      if (ran && (!best || elapsed < best)) { best = elapsed; note = ' New best time!'; try { localStorage.setItem('cubesolve-best', best); } catch (e) { } }
      $('wt').textContent = 'Solved!'; $('wp').textContent = `${undo.length} moves in ${fmt(elapsed)}.${note}`;
    }
    $('win').classList.add('on'); ui();
  }

  // ---------- view rotation + drag-to-turn ----------
  const stage = $('stage');
  let rx = -26, ry = -38, drag = null;
  const view = () => cubeEl.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  const K = () => parseFloat(getComputedStyle(stage).getPropertyValue('--k')) || 1;
  function scr(v) { // project a cube-space direction onto the screen
    const r = Math.PI / 180, cy = Math.cos(ry * r), sy = Math.sin(ry * r), cx = Math.cos(rx * r), sx = Math.sin(rx * r);
    const x1 = v[0] * cy + v[2] * sy, z1 = -v[0] * sy + v[2] * cy;
    return [x1, v[1] * cx - z1 * sx];
  }
  stage.addEventListener('pointerdown', e => {
    if (e.button) return;
    const t = e.target, can = !lock && !busy && t._s;
    drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, c: can ? t._c : null, n: can ? t._n : null, turn: null };
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.c) {
      ry += (e.clientX - drag.lx) * .5; rx = Math.max(-85, Math.min(85, rx - (e.clientY - drag.ly) * .5));
      drag.lx = e.clientX; drag.ly = e.clientY; view(); return;
    }
    if (!drag.turn) { if (Math.hypot(dx, dy) < 10) return; startTurn(dx, dy); }
    const t = drag.turn, T = t.T, n2 = Math.max(.1, T[0] * T[0] + T[1] * T[1]);
    t.deg = Math.max(-90, Math.min(90, t.sr * 90 * (dx * T[0] + dy * T[1]) / (n2 * S * 1.4 * K())));
    setT(t.L, t.a, t.deg);
  });
  function startTurn(dx, dy) {
    const c = drag.c, n = drag.n;
    const w = [0, 1, 2].map(i => c.R[0][i] * n[0] + c.R[1][i] * n[1] + c.R[2][i] * n[2]); // sticker normal in cube space
    let best = null;
    for (let j = 0; j < 3; j++) {            // pick the in-face axis the finger moves along most
      if (w[j]) continue;
      const e = [0, 0, 0]; e[j] = 1; const T = scr(e), d = dx * T[0] + dy * T[1];
      if (!best || Math.abs(d) > Math.abs(best.d)) best = { j, T, d };
    }
    const sg = Math.sign(best.d) || 1, t = [0, 0, 0]; t[best.j] = sg;
    const r = [w[1] * t[2] - w[2] * t[1], w[2] * t[0] - w[0] * t[2], w[0] * t[1] - w[1] * t[0]]; // turn axis = normal × drag direction
    const i = r.findIndex(v => v), a = 'xyz'[i], l = c.p[i];
    busy = true; clearHint();
    drag.turn = { a, l, sr: Math.sign(r[i]), T: best.T.map(v => v * sg), L: layerOf({ a, l }), deg: 0 };
  }
  function release() {
    const d = drag; drag = null;
    if (!d || !d.turn) return;
    const t = d.turn, target = Math.abs(t.deg) > 30 ? Math.sign(t.deg) * 90 : 0;
    spin(t.L, t.a, t.deg, target, 160, () => {
      if (target) { const m = { a: t.a, l: t.l, s: Math.sign(target) }; commit(m, t.L); log(m, 'user'); }
      else setT(t.L, t.a, 0);
      next();
    });
  }
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  $('rv').addEventListener('pointerdown', e => e.stopPropagation());
  $('rv').onclick = () => { rx = -26; ry = -38; view(); };

  // ---------- controls ----------
  $('scramble').onclick = scramble; $('again').onclick = scramble; $('solve').onclick = autoSolve;
  $('reset').onclick = reset; $('undo').onclick = undoMove; $('redo').onclick = redoMove; $('hint').onclick = hint;
  ['U', 'D', 'L', 'R', 'F', 'B'].forEach(f => [false, true].forEach(pr => {
    const b = document.createElement('button');
    b.textContent = f + (pr ? '′' : ''); b.style.background = COL[f];
    b.setAttribute('aria-label', `${NAME[f]} face ${pr ? 'counter-clockwise' : 'clockwise'}`);
    b.onclick = () => userTurn(pr ? inv(MV[f]) : MV[f]); $('pad').appendChild(b);
  }));
  addEventListener('keydown', e => {
    if (e.target.tagName === 'SELECT') return;
    const k = e.key.toUpperCase();
    if (e.ctrlKey || e.metaKey) {
      if (k === 'Z') { e.preventDefault(); e.shiftKey ? redoMove() : undoMove(); }
      else if (k === 'Y') { e.preventDefault(); redoMove(); }
      return;
    }
    if (e.altKey) return;
    if (MV[k]) userTurn(e.shiftKey ? inv(MV[k]) : MV[k]); else if (k === 'H') hint();
  });

  resetCube(); view(); ui();
})();
