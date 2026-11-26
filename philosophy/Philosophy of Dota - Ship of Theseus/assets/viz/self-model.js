/* Fig: Self-model — a creature and its model of the world. Raise its perception
   step by step; at "Map" the creature has to put itself into its own model.
   Bushes are hiding places: predators can't see into them and won't go in. Only a creature
   with a map knows where they are when it needs one. */
Viz.define('self-model', (ctx) => {
  'use strict';
  const { h, rng, clamp } = Viz;

  const W = 460, H = 340;
  const LEVELS = [
    { label: 'Things', note: 'It notices things in front of it, but not what they are.' },
    { label: 'Kinds',  note: 'It tells food from danger, and runs from danger.' },
    { label: 'Map',    note: 'It remembers what it has seen, as a map of the whole place: where food grows, and where to hide.' },
  ];
  const L_THINGS = 0, L_KINDS = 1, L_MAP = 2;

  const RANGE = 190, FOV = Math.PI * 0.62, RAYS = 40;
  const CHASE = 105;           // predators only notice you this close, and only out in the open
  const SPEED = 44, FLEE = 64; // fleeing, it only just outruns a pouncing predator:
  const POUNCE = 60;           // open ground is a gamble, cover is what keeps you safe
  const FLEE_FOR = 3;          // seconds it stays alarmed after it last saw a predator close by
  const BODY = 9;              // creature radius
  // Energy: moving costs it, sprinting costs a lot, keeping still (hiding) almost nothing;
  // food restores it. At zero it's exhausted: it can only crawl, and keeps starving.
  const E = { start: 20, max: 100, food: 20, hit: 30, walk: 1.2, sprint: 3.2, still: 0.25, crawl: 24, starveEvery: 4, hungry: 35 };
  // Food grows in fixed patches: eaten, a patch regrows after a while. Places matter.
  const PATCHES = [[140, 62], [420, 150], [172, 200], [90, 292], [292, 182], [404, 232]];
  const REGROW = [6, 10]; // seconds
  const C = { food: '#2f9e44', threat: '#e03131', self: '#1c7ed6', bush: '#5a4330', bushLight: '#735840' };

  // Hiding places.
  // far apart, and away from the corners where predators start
  const BUSHES = [[60, 190], [235, 55], [330, 270]]
    .map(([x, y], i) => ({ x, y, r: 17, i }));
  const bushAt = (p, pad = 0) => BUSHES.findIndex((b) => Math.hypot(p.x - b.x, p.y - b.y) < b.r - pad);

  /* ---------- DOM ---------- */

  function panel(title) {
    const canvas = h('canvas', { class: 'sm-canvas' });
    const el = h('div', { class: 'sm-panel' }, h('div', { class: 'sm-label' }, title), canvas);
    return { el, canvas, g: canvas.getContext('2d') };
  }
  const world = panel('World');
  const model = panel('What it knows');
  model.canvas.setAttribute('aria-label', 'The creature’s model of the world');
  world.canvas.setAttribute('aria-label', 'A creature moving among food, predators and bushes');
  ctx.stage.append(h('div', { class: 'sm-grid' }, world.el, model.el));

  const note = h('p', { class: 'sm-note' });
  const stats = h('span', { class: 'sm-stats' });
  const stepper = Viz.steps({ label: 'Perception', options: LEVELS.map((l) => l.label), value: 0, onChange: setLevel });
  ctx.controls.classList.add('sm-controls');
  // Simulation speed. Kept when switching levels.
  let speedK = 1;
  const speed = Viz.slider({ label: 'Speed', min: 1, max: 10, step: 1, value: 1, format: (v) => v + '×', onInput: (v) => { speedK = v; } });
  ctx.controls.append(h('div', { class: 'sm-row' }, stepper.el, speed.el), h('div', { class: 'sm-row' }, note, stats));

  const ink = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#e9e3d8';
  const inkRGB = (/^#([0-9a-f]{6})$/i.exec(ink) || [0, 'e9e3d8'])[1].match(/../g).map((x) => parseInt(x, 16));

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const p of [world, model]) {
      const b = p.canvas.getBoundingClientRect();
      p.canvas.width = Math.max(1, Math.round(b.width * dpr));
      p.canvas.height = Math.max(1, Math.round(b.height * dpr));
    }
  }
  const ro = new ResizeObserver(resize);
  ro.observe(world.canvas);

  /* ---------- geometry ---------- */

  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const u = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(px - (ax + dx * u), py - (ay + dy * u));
  }
  const inField = (x, y, rad) => x > rad && y > rad && x < W - rad && y < H - rad;

  // Keep a body inside the field; predators are also kept out of the bushes.
  function collide(o, rad, solidBushes) {
    if (solidBushes) {
      for (const b of BUSHES) {
        const d = Math.hypot(o.x - b.x, o.y - b.y), min = b.r + rad;
        if (d < min && d > 0.001) { o.x = b.x + (o.x - b.x) / d * min; o.y = b.y + (o.y - b.y) / d * min; }
      }
    }
    o.x = clamp(o.x, rad, W - rad);
    o.y = clamp(o.y, rad, H - rad);
  }
  // Reflex: if the way ahead is blocked, turn to the nearest open direction and keep going round
  // the obstacle on that side. For predators bushes are obstacles; for the creature only edges are.
  function avoid(o, want, rad, solidBushes) {
    const L = solidBushes ? 24 : 40; // the creature looks further ahead than predators do
    const open = (a) => {
      const x = o.x + Math.cos(a) * L, y = o.y + Math.sin(a) * L;
      if (!inField(x, y, rad)) return false;
      return !solidBushes || BUSHES.every((b) => segDist(b.x, b.y, o.x, o.y, x, y) > b.r + rad - 2);
    };
    if (open(want)) { o.side = 0; return want; }
    if (!o.side) {
      // which way round? the side that turns it toward the open middle of the field
      const toMiddle = Math.atan2(H / 2 - o.y, W / 2 - o.x);
      let left = null, right = null;
      for (let k = 1; k <= 12; k++) {
        if (left === null && open(want + k * 0.26)) left = want + k * 0.26;
        if (right === null && open(want - k * 0.26)) right = want - k * 0.26;
      }
      if (left !== null && right !== null) o.side = Math.abs(angDiff(left, toMiddle)) <= Math.abs(angDiff(right, toMiddle)) ? 1 : -1;
      else o.side = left !== null ? 1 : right !== null ? -1 : (angDiff(toMiddle, want) > 0 ? 1 : -1);
    }
    for (let k = 1; k <= 12; k++) { const a = want + o.side * k * 0.26; if (open(a)) return a; }
    return want + o.side * Math.PI * 0.75;
  }

  /* ---------- grid: fog of war and route planning ---------- */

  const CELL = 10, GW = Math.ceil(W / CELL), GH = Math.ceil(H / CELL), N = GW * GH;
  const cx = (c) => (c % GW) * CELL + CELL / 2, cy = (c) => Math.floor(c / GW) * CELL + CELL / 2;
  const cellAt = (x, y) => clamp(Math.floor(y / CELL), 0, GH - 1) * GW + clamp(Math.floor(x / CELL), 0, GW - 1);
  const lastSeen = new Float32Array(N);
  const blocked = new Uint8Array(N);
  for (let c = 0; c < N; c++) blocked[c] = inField(cx(c), cy(c), BODY) ? 0 : 1;
  // 64-bit on purpose: rounding in 32-bit made the planner loop forever
  const gdist = new Float64Array(N), prev = new Int32Array(N), risk = new Float64Array(N);
  const FOG_FADE = 7; // seconds for an area it hasn't looked at to grey over again

  // Dijkstra over the grid from the creature's cell. Routes are priced by length plus risk:
  // cells near predators it knows about cost a lot more.
  function plan(dangers) {
    risk.fill(0);
    dangers.forEach((o) => {
      const age = Math.min(o.age || 0, 15);
      const rad = 140 + age * 5, weight = 20 * Math.max(0.3, 1 - age / 15);
      for (let c = 0; c < N; c++) {
        const d = Math.hypot(cx(c) - o.x, cy(c) - o.y);
        if (d < rad) risk[c] += ((rad - d) / rad) * weight;
      }
    });
    gdist.fill(Infinity); prev.fill(-1);
    const start = cellAt(me.x, me.y);
    const heap = [[0, start]];
    gdist[start] = 0;
    const push = (item) => { heap.push(item); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], end = heap.pop(); if (heap.length) { heap[0] = end; let i = 0; for (;;) { const l = 2 * i + 1, r2 = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r2 < heap.length && heap[r2][0] < heap[m][0]) m = r2; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    while (heap.length) {
      const [d, c] = pop();
      if (d > gdist[c]) continue;
      const x = c % GW, y = (c / GW) | 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        if (!ox && !oy) continue;
        const nx = x + ox, ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const n = ny * GW + nx;
        if (blocked[n]) continue;
        const nd = d + (ox && oy ? 1.414 : 1) * (1 + risk[n]);
        if (nd < gdist[n]) { gdist[n] = nd; prev[n] = c; push([nd, n]); }
      }
    }
  }
  function pathTo(c) {
    const cells = [];
    for (let k = c; k !== -1 && cells.length < N; k = prev[k]) cells.push(k);
    return cells.reverse().map((k) => ({ x: cx(k), y: cy(k) }));
  }

  /* ---------- world ---------- */

  let r, nextId;
  const rand = (a, b) => a + r() * (b - a);
  const grow = (pt) => { pt.food = { id: nextId++, kind: 'food', x: pt.x, y: pt.y }; };

  let me, patches, foods, threats, vis;
  let level = 0;
  let t = 0, levelT = 0, eaten = 0, hurt = 0, starved = 0;
  const memory = new Map(); // id -> {x, y, vx, vy, kind, seenT}
  const knownBushes = new Set();
  const knownPatches = new Map(); // patch index -> when it last looked at it
  let route = null, routeT = -9;

  // Every level starts from the same world, so the only difference between runs is perception.
  function resetWorld() {
    r = rng(17);
    nextId = 1;
    t = 0;
    me = {
      x: 120, y: 230, a: -Math.PI / 2, hurtT: -9, wanderSeed: 3, side: 0,
      heading: -Math.PI / 2, headingT: 0, checkT: 1.5, checkX: 120, checkY: 230,
      calmT: -9, fleeA: null, fleeT: 0, lastDangers: [], hidden: false, bushBoredT: -9,
      energy: E.start, starveT: 0,
    };
    patches = PATCHES.map(([x, y], i) => ({ x, y, i, food: null, regrowT: 0 }));
    patches.forEach(grow);
    foods = patches.map((pt) => pt.food);
    // none starts within reach of the creature (it starts bottom-left, facing up)
    threats = [[W - 50, 40], [40, 30], [W - 50, H - 30]].map(([x, y], i) => ({
      id: nextId++, kind: 'threat', x, y, a: rand(0, 6.28), cool: 0, sp: 28, seed: i * 5 + 1, side: 0, huntT: -9, lx: 0, ly: 0,
    }));
  }

  function setLevel(i) {
    level = i;
    resetWorld();
    levelT = t;
    lastStats = 0;
    acc = 0;
    eaten = 0; hurt = 0; starved = 0;
    memory.clear();
    knownBushes.clear();
    knownPatches.clear();
    route = null; routeT = -9;
    lastSeen.fill(-1e6);
    note.textContent = LEVELS[i].note;
    vis = look();
    renderStats();
  }

  const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const distTo = (o) => Math.hypot(o.x - me.x, o.y - me.y);
  const inSight = (o) => distTo(o) < RANGE && Math.abs(angDiff(Math.atan2(o.y - me.y, o.x - me.x), me.a)) < FOV / 2;
  const bushInSight = (b) => distTo(b) < RANGE + b.r && Math.abs(angDiff(Math.atan2(b.y - me.y, b.x - me.x), me.a)) < FOV / 2 + Math.atan2(b.r, Math.max(1, distTo(b)));
  const wob = (s) => Math.sin(t * 0.9 + s) + 0.6 * Math.sin(t * 2.3 + s * 1.7);

  // Outline of what it can see right now (a cone).
  function look() {
    const pts = [];
    for (let i = 0; i <= RAYS; i++) {
      const a = me.a - FOV / 2 + (FOV * i) / RAYS;
      pts.push([me.x + Math.cos(a) * RANGE, me.y + Math.sin(a) * RANGE]);
    }
    return { pts };
  }

  // Below "Map" it has no memory at all: only what's in view right now. A mental map is
  // long-term memory: food stays on it until it's seen to be gone; predators stay too, but as
  // increasingly uncertain guesses (they move); bushes, which don't move, stay for good.
  function memoryLife(kind) {
    if (level < L_MAP) return 0;
    return kind === 'food' ? 120 : 15;
  }
  // Where a remembered thing probably is now: predators keep moving, so extrapolate a little.
  function where(m) {
    const age = Math.min(1.5, t - m.seenT);
    return { x: clamp(m.x + m.vx * age, 10, W - 10), y: clamp(m.y + m.vy * age, 10, H - 10) };
  }

  // Where to run when there's nowhere to hide: try directions all round, and pick the one whose
  // end point is furthest from every predator it knows about, with room to keep running.
  // Two predators on opposite sides don't cancel out: it slips away between them.
  function escapeDir(list) {
    let bestA = me.a, best = -Infinity;
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      let free = 0;
      for (let s = 8; s <= 96; s += 8) {
        if (!inField(me.x + Math.cos(a) * s, me.y + Math.sin(a) * s, BODY)) break;
        free = s;
      }
      const px = me.x + Math.cos(a) * free, py = me.y + Math.sin(a) * free;
      let near = Infinity;
      list.forEach((o) => {
        const ox = o.x + (o.sp ? Math.cos(o.a) * o.sp * 0.5 : 0), oy = o.y + (o.sp ? Math.sin(o.a) * o.sp * 0.5 : 0);
        near = Math.min(near, Math.hypot(px - ox, py - oy));
      });
      const edge = Math.min(px, W - px, py, H - py); // room left around the end point
      let score = near + free * 0.8 + Math.min(edge, 60) * 0.9 - (free < 40 ? 60 : 0);
      if (me.fleeA !== null) score -= Math.abs(angDiff(a, me.fleeA)) * 14; // stick with a decision
      if (score > best) { best = score; bestA = a; }
    }
    return bestA;
  }

  /* What the creature currently "has" to act on, per level. */
  function percepts() {
    const visible = [...foods, ...threats].filter(inSight);
    if (level < L_MAP) return visible;
    visible.forEach((o) => memory.set(o.id, {
      x: o.x, y: o.y, kind: o.kind, seenT: t,
      vx: o.kind === 'threat' ? Math.cos(o.a) * o.sp : 0,
      vy: o.kind === 'threat' ? Math.sin(o.a) * o.sp : 0,
    }));
    const out = [];
    for (const [id, m] of memory) {
      const p = where(m);
      if (t - m.seenT > memoryLife(m.kind)) { memory.delete(id); continue; }
      // looked where it should be and it isn't there: forget it
      if (m.seenT < t && inSight(p) && !visible.some((o) => o.id === id)) { memory.delete(id); continue; }
      out.push({ ...p, kind: m.kind, seenT: m.seenT, age: t - m.seenT, a: Math.atan2(m.vy, m.vx), sp: Math.hypot(m.vx, m.vy) });
    }
    return out;
  }

  // Map: update what it knows about the place from what it sees right now.
  function updateMap() {
    BUSHES.forEach((b) => { if (bushInSight(b)) knownBushes.add(b.i); });
    patches.forEach((pt) => { if (inSight(pt)) knownPatches.set(pt.i, t); });
    const c0x = Math.floor((me.x - RANGE) / CELL), c1x = Math.ceil((me.x + RANGE) / CELL);
    const c0y = Math.floor((me.y - RANGE) / CELL), c1y = Math.ceil((me.y + RANGE) / CELL);
    for (let y = Math.max(0, c0y); y < Math.min(GH, c1y); y++) {
      for (let x = Math.max(0, c0x); x < Math.min(GW, c1x); x++) {
        const c = y * GW + x;
        if (inSight({ x: cx(c), y: cy(c) })) lastSeen[c] = t;
      }
    }
  }

  // Map, calm: where to go (food it remembers, or into the fog) and how to get there.
  function planForage(goals, dangers) {
    plan(dangers);
    let target = null, best = Infinity;
    goals.forEach((f) => { const c = cellAt(f.x, f.y); if (gdist[c] < best) { best = gdist[c]; target = c; } });
    let exploring = false;
    if (target === null && knownPatches.size) {
      // No food in mind: go and check a patch it knows, preferring the one it hasn't looked at
      // for longest (most likely to have regrown). Patches it saw a moment ago aren't worth it.
      let score = -Infinity;
      knownPatches.forEach((seenT, i) => {
        const c = cellAt(PATCHES[i][0], PATCHES[i][1]), age = t - seenT;
        if (age < REGROW[0] * 0.6 || !isFinite(gdist[c])) return;
        const sc = Math.min(age, REGROW[1]) - gdist[c] * 0.12;
        if (sc > score) { score = sc; target = c; }
      });
    }
    if (target === null) {
      exploring = true;
      let score = -Infinity;
      for (let c = 0; c < N; c++) {
        if (blocked[c] || !isFinite(gdist[c])) continue;
        const s = Math.min(t - lastSeen[c], FOG_FADE * 3) - gdist[c] * 0.12;
        if (s > score) { score = s; target = c; }
      }
    }
    route = target === null ? null : { pts: pathTo(target), kind: exploring ? 'explore' : 'food' };
    routeT = t;
  }
  // Map, in danger: the nearest bush it knows of, by a route that keeps away from predators.
  function planRefuge(dangers) {
    plan(dangers);
    let target = null, best = 40; // further (or riskier) than this, and it just runs instead
    knownBushes.forEach((i) => { const c = cellAt(BUSHES[i].x, BUSHES[i].y); if (gdist[c] < best) { best = gdist[c]; target = c; } });
    route = target === null ? null : { pts: pathTo(target), kind: 'refuge' };
    routeT = t;
  }
  // Follow a planned route: aim a few cells ahead.
  function routeDir() {
    const pts = route.pts;
    while (pts.length > 1 && Math.hypot(pts[0].x - me.x, pts[0].y - me.y) < 14) pts.shift();
    const wp = pts[Math.min(3, pts.length - 1)];
    return Math.atan2(wp.y - me.y, wp.x - me.x);
  }

  function step(dt) {
    t += dt;
    const wasHidden = me.hidden;
    me.hidden = bushAt(me, 0) >= 0; // anywhere inside the bush is cover
    if (me.hidden && !wasHidden) me.hideStart = t;

    // Predators wander slowly and pounce from close range, but only at a creature out in the
    // open. One that loses sight of it checks where it last saw it, then gives up.
    threats.forEach((th) => {
      th.cool = Math.max(0, th.cool - dt);
      const d = Math.hypot(me.x - th.x, me.y - th.y);
      const sees = d < CHASE && !me.hidden && th.cool === 0;
      if (sees) { th.lx = me.x; th.ly = me.y; th.huntT = t + 2.5; }
      let want = th.a + wob(th.seed) * 0.8 * dt * 3, sp = 28;
      if (th.cool > 0) want = Math.atan2(th.y - me.y, th.x - me.x);
      else if (sees) { want = Math.atan2(me.y - th.y, me.x - th.x); sp = POUNCE; }
      else if (th.huntT > 0) {
        // go and check where it was last seen; got there (or took too long) and nothing: give up
        if (t < th.huntT && Math.hypot(th.lx - th.x, th.ly - th.y) > 32) { want = Math.atan2(th.ly - th.y, th.lx - th.x); sp = 40; }
        else th.huntT = 0;
      }
      if (!sees && th.huntT === 0) {
        // lost it: turn around and wander off somewhere else, instead of circling the spot
        th.a = Math.atan2(th.y - th.ly, th.x - th.lx) + rand(-0.8, 0.8);
        want = th.a; th.huntT = -9;
      }
      want = avoid(th, want, 9, true);
      th.a += clamp(angDiff(want, th.a), -2.6 * dt, 2.6 * dt);
      th.sp = sp;
      th.x += Math.cos(th.a) * sp * dt;
      th.y += Math.sin(th.a) * sp * dt;
      collide(th, 9, true);
      if (d < 17 && th.cool === 0 && !me.hidden) {
        hurt++; me.hurtT = t; th.cool = 2.2;
        me.energy = Math.max(0, me.energy - E.hit); // getting caught costs dearly
        me.x += (me.x - th.x) * 0.8; me.y += (me.y - th.y) * 0.8;
        collide(me, BODY, false);
        renderStats();
      }
    });

    vis = look();
    if (level >= L_MAP) updateMap();

    // Behaviour uses exactly what this level of perception provides, nothing more.
    let vx = 0, vy = 0, speed = SPEED;
    const ps = percepts();
    // Things: can't tell what anything is, so everything looks like food.
    const dangers = level >= L_KINDS ? ps.filter((o) => o.kind === 'threat') : [];
    let goals = level === L_THINGS ? ps : ps.filter((o) => o.kind === 'food');
    if (level === L_THINGS) {
      // A bush is just another thing to it, so it tries those too. Having nosed into one and
      // found nothing, it loses interest in bushes for a few seconds (habituation, not memory).
      if (me.hidden) me.bushBoredT = t + 5;
      if (t > me.bushBoredT) goals = goals.concat(BUSHES.filter(bushInSight));
    }
    // Survival comes first: food near a known predator, or past one, isn't worth it.
    // Unless it's getting hungry: then it accepts food closer to danger.
    const hungry = me.energy < E.hungry;
    const keepAway = hungry ? 60 : 120, passBy = hungry ? 40 : 75;
    // Only fresh sightings count here: a predator seen a while ago has probably moved on (old
    // memories still make planned routes keep their distance).
    const freshDangers = dangers.filter((o) => (o.age || 0) < 4);
    if (level >= L_KINDS) goals = goals.filter((f) => freshDangers.every((o) =>
      Math.hypot(f.x - o.x, f.y - o.y) > keepAway && segDist(o.x, o.y, me.x, me.y, f.x, f.y) > passBy));

    // A predator it can see (or, with a map, saw a moment ago) close enough to matter: alarm.
    // Tucked into a bush it feels safe: only a predator that's close AND coming its way keeps it
    // there. One idling nearby or walking off doesn't, so it slips out instead of waiting forever.
    const comingAtMe = (o) => o.sp > 5 && Math.abs(angDiff(o.a, Math.atan2(me.y - o.y, me.x - o.x))) < 0.9;
    const urgent = dangers.some((o) => {
      const age = o.age || 0, d = Math.hypot(o.x - me.x, o.y - me.y);
      if (me.hidden) {
        // Stay while a predator is within striking range (whichever way it faces), or coming
        // this way from further off. Hiding has a cost too: a hungry creature accepts a closer
        // predator, and nobody waits in a bush forever unless the danger is very close.
        if (age >= 0.05) return false;
        const range = hungry ? 80 : 110;
        const stay = d < range || (d < 160 && comingAtMe(o));
        return stay && (t - me.hideStart < 8 || d < 60);
      }
      // With a map it tracks where predators are heading: it only runs from one that's coming
      // its way (or very close). Without one, any predator nearby sets it off.
      if (level >= L_MAP) return (age < 0.05 ? d < 130 : age < 2 && d < 100) && (comingAtMe(o) || d < 70);
      return age < 0.05 ? d < 130 : age < 2 && d < 100;
    });
    if (urgent) { me.calmT = t + (me.hidden ? 1.5 : FLEE_FOR); me.lastDangers = dangers; }
    const alarmed = level >= L_KINDS && t < me.calmT;
    const threatsNow = dangers.length ? dangers : me.lastDangers;

    if (alarmed && me.hidden) {
      // Tucked into a bush: get to the middle of it, then keep still and watch the danger.
      const b = BUSHES[bushAt(me, 0)];
      const toMid = Math.hypot(b.x - me.x, b.y - me.y);
      if (toMid > 3) { speed = SPEED * 0.8; vx = b.x - me.x; vy = b.y - me.y; }
      else {
        speed = 0;
        const nearest = threatsNow.reduce((a, o) => (!a || distTo(o) < distTo(a) ? o : a), null);
        if (nearest) { vx = nearest.x - me.x; vy = nearest.y - me.y; }
      }
      route = null;
    } else if (alarmed) {
      speed = FLEE;
      if (level >= L_MAP) {
        // It knows where the bushes are: run for the nearest one, around the danger.
        if (!route || route.kind !== 'refuge' || t - routeT > 0.25) planRefuge(threatsNow);
      }
      if (route && route.kind === 'refuge') {
        const a = routeDir(); vx = Math.cos(a); vy = Math.sin(a);
      } else {
        // No map (or no bush within reach): just run away, and hope to stumble into cover.
        if (me.fleeA === null || t > me.fleeT) { me.fleeA = escapeDir(threatsNow); me.fleeT = t + 0.25; }
        vx = Math.cos(me.fleeA); vy = Math.sin(me.fleeA);
      }
    } else {
      me.fleeA = null;
      if (route && route.kind === 'refuge') route = null;
      // no predator close: still keep a respectful distance from the ones it knows about
      // (coming out of a bush, much more so: it leaves on the far side)
      const wary = me.hidden ? 4 : 1;
      dangers.forEach((o) => {
        const d = Math.max(1, Math.hypot(o.x - me.x, o.y - me.y));
        if (d < 220) { vx -= (o.x - me.x) / d * (220 - d) / 220 * wary; vy -= (o.y - me.y) / d * (220 - d) / 220 * wary; }
      });
      if (level >= L_MAP) {
        // With a map it plans: to food it remembers, or into the fog when there's nothing to go to.
        if (!route || t - routeT > 0.4) planForage(goals, dangers);
        if (route && route.pts.length) { const a = routeDir(); vx += Math.cos(a) * 1.4; vy += Math.sin(a) * 1.4; }
      } else {
        // Without one it just heads straight for the nearest thing it wants…
        let best = null, bestD = 1e9;
        goals.forEach((o) => { const d = Math.max(1, distTo(o)); if (d < bestD) { best = o; bestD = d; } });
        if (best) { vx += (best.x - me.x) / bestD * 1.2; vy += (best.y - me.y) / bestD * 1.2; }
        else {
          // …or, with nothing in view, searches: long straight runs in a random direction.
          if (t > me.headingT) { me.heading = rand(0, Math.PI * 2); me.headingT = t + rand(3, 6); }
          if (!inField(me.x + Math.cos(me.heading) * 50, me.y + Math.sin(me.heading) * 50, BODY + 10)) {
            // this run would end at the edge: pick a new one, back toward the middle
            me.heading = Math.atan2(H / 2 - me.y, W / 2 - me.x) + rand(-0.9, 0.9);
            me.headingT = t + rand(3, 6);
          }
          vx += Math.cos(me.heading + wob(me.wanderSeed) * 0.25);
          vy += Math.sin(me.heading + wob(me.wanderSeed) * 0.25);
        }
      }
    }
    me.fleeing = alarmed && speed > 0;

    // edges of the field: an early, firm push back toward the middle
    const m = 45;
    if (speed > 0) {
      if (me.x < m) vx += (m - me.x) / m * 2.5;
      if (me.x > W - m) vx -= (me.x - (W - m)) / m * 2.5;
      if (me.y < m) vy += (m - me.y) / m * 2.5;
      if (me.y > H - m) vy -= (me.y - (H - m)) / m * 2.5;
    }

    // Stuck (hardly moved for a while, and not hiding on purpose)? Try something else.
    if (t > me.checkT) {
      if (speed > 0 && Math.hypot(me.x - me.checkX, me.y - me.checkY) < 14) {
        me.side = -me.side || 1;
        me.heading = rand(0, Math.PI * 2); me.headingT = t + rand(3, 6);
        route = null;
      }
      me.checkT = t + 1.5; me.checkX = me.x; me.checkY = me.y;
    }

    // Energy: an exhausted creature can only crawl (and so can't outrun anything).
    if (me.energy <= 0 && speed > E.crawl) speed = E.crawl;
    me.energy = Math.max(0, me.energy - (speed === 0 ? E.still : speed >= FLEE ? E.sprint : E.walk) * dt);
    if (me.energy <= 0) {
      me.starveT += dt;
      if (me.starveT >= E.starveEvery) { me.starveT = 0; starved++; me.starveFlashT = t; renderStats(); }
    } else me.starveT = 0;

    let want = (vx || vy) ? Math.atan2(vy, vx) : me.a;
    if (speed > 0) want = avoid(me, want, BODY, false);
    const turn = me.fleeing ? 6 : 3.6; // fear makes it quick
    me.a += clamp(angDiff(want, me.a), -turn * dt, turn * dt);
    me.x += Math.cos(me.a) * speed * dt;
    me.y += Math.sin(me.a) * speed * dt;
    collide(me, BODY, false);

    // Patches regrow a while after being eaten.
    patches.forEach((pt) => { if (!pt.food && t > pt.regrowT) grow(pt); });

    // eating
    for (const pt of patches) {
      if (pt.food && distTo(pt) < 13) {
        memory.delete(pt.food.id);
        pt.food = null;
        pt.regrowT = t + rand(REGROW[0], REGROW[1]);
        eaten++;
        me.energy = Math.min(E.max, me.energy + E.food);
        if (route && route.kind !== 'refuge') route = null;
        renderStats();
      }
    }
    foods = patches.filter((pt) => pt.food).map((pt) => pt.food);
  }

  function renderStats() {
    const s = Math.floor(t - levelT);
    stats.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}  ·  ate ${eaten}  ·  hurt ${hurt}  ·  starved ${starved}`;
  }

  /* ---------- drawing ---------- */

  function visPath(g) {
    g.beginPath();
    g.moveTo(me.x, me.y);
    vis.pts.forEach(([x, y]) => g.lineTo(x, y));
    g.closePath();
  }
  function dot(g, x, y, rad, color, alpha = 1) {
    g.globalAlpha = alpha;
    g.fillStyle = color;
    g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
  }
  function tri(g, x, y, a, rad, color, alpha = 1) {
    g.globalAlpha = alpha;
    g.fillStyle = color;
    g.beginPath();
    for (let i = 0; i < 3; i++) {
      const aa = a + i * Math.PI * 2 / 3;
      const rr = i === 0 ? rad * 1.3 : rad;
      g.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr);
    }
    g.closePath(); g.fill();
    g.globalAlpha = 1;
  }
  function creature(g, x, y, a, rad, alpha = 1) {
    dot(g, x, y, rad, C.self, alpha);
    dot(g, x + Math.cos(a) * rad * 0.5, y + Math.sin(a) * rad * 0.5, rad * 0.32, '#fff', alpha);
  }
  // A bush: a cluster of leafy lobes. `plain` draws it as a grey blob (when it can't tell what it is).
  const LOBES = [[0, 0, 1], [-0.45, -0.3, 0.62], [0.45, -0.32, 0.6], [-0.42, 0.38, 0.58], [0.48, 0.34, 0.6], [0, -0.55, 0.5]];
  function bush(g, b, alpha = 1, plain = false) {
    g.save();
    g.globalAlpha = alpha;
    LOBES.forEach(([ox, oy, s], k) => {
      g.fillStyle = plain ? ink : (k % 2 ? C.bushLight : C.bush);
      if (plain) g.globalAlpha = alpha * 0.25;
      g.beginPath(); g.arc(b.x + ox * b.r * 0.8, b.y + oy * b.r * 0.8, b.r * 0.62 * s + 4, 0, Math.PI * 2); g.fill();
    });
    g.restore();
  }
  function begin(p) {
    const g = p.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, p.canvas.width, p.canvas.height);
    g.setTransform(p.canvas.width / W, 0, 0, p.canvas.height / H, 0, 0);
    return g;
  }

  // A small energy bar over the creature: full and green, draining to red.
  function energyBar(g) {
    const w = 24, k = me.energy / E.max, x = me.x - w / 2, y = me.y - BODY - 9;
    g.save();
    g.globalAlpha = 0.35; g.fillStyle = ink; g.fillRect(x, y, w, 3.5);
    g.globalAlpha = 0.95; g.fillStyle = k > 0.5 ? '#4caf50' : k > E.hungry / E.max ? '#e0b030' : C.threat;
    g.fillRect(x, y, w * k, 3.5);
    g.restore();
  }

  // Where food grows: a faint ring on the ground, whether or not anything is growing right now.
  function patchSpot(g, pt, alpha) {
    g.save();
    g.globalAlpha = 0.28 * alpha; g.strokeStyle = C.food; g.lineWidth = 1.5; g.setLineDash([2, 3]);
    g.beginPath(); g.arc(pt.x, pt.y, 10, 0, Math.PI * 2); g.stroke();
    g.restore();
  }

  function drawWorld() {
    const g = begin(world);
    g.save(); g.globalAlpha = 0.08; g.fillStyle = ink; visPath(g); g.fill(); g.restore();
    patches.forEach((pt) => patchSpot(g, pt, 1));
    foods.forEach((f) => dot(g, f.x, f.y, 5, C.food));
    const flash = t - me.hurtT < 0.5;
    if (flash) dot(g, me.x, me.y, 18, C.threat, 0.35 * (1 - (t - me.hurtT) / 0.5));
    if (t - (me.starveFlashT ?? -9) < 0.6) dot(g, me.x, me.y, 18, ink, 0.3 * (1 - (t - me.starveFlashT) / 0.6));
    creature(g, me.x, me.y, me.a, BODY);
    energyBar(g);
    // bushes go over the creature: when it's inside one, you only glimpse it
    BUSHES.forEach((b) => bush(g, b, me.hidden && bushAt(me) === b.i ? 0.82 : 1));
    threats.forEach((th) => tri(g, th.x, th.y, th.a, 9, C.threat));
  }

  // Fog of war: a tiny image, one pixel per grid cell, scaled up smoothly.
  const fog = document.createElement('canvas');
  fog.width = GW; fog.height = GH;
  const fg = fog.getContext('2d');
  const fogImg = fg.createImageData(GW, GH);
  function drawFog(g) {
    for (let c = 0; c < N; c++) {
      const a = clamp((t - lastSeen[c]) / FOG_FADE, 0, 1);
      fogImg.data[c * 4] = inkRGB[0]; fogImg.data[c * 4 + 1] = inkRGB[1]; fogImg.data[c * 4 + 2] = inkRGB[2];
      fogImg.data[c * 4 + 3] = a * 255;
    }
    fg.putImageData(fogImg, 0, 0);
    g.save();
    g.globalAlpha = 0.2;
    g.imageSmoothingEnabled = true;
    g.filter = 'blur(5px)'; // soften the grid cells (ignored where unsupported)
    g.drawImage(fog, 0, 0, W, H);
    g.restore();
  }

  function drawModel() {
    const g = begin(model);
    const drawThing = (o, alpha) => {
      if (level < L_KINDS) dot(g, o.x, o.y, 6, ink, alpha * 0.55);
      else if (o.kind === 'food') dot(g, o.x, o.y, 5, C.food, alpha);
      else dot(g, o.x, o.y, 8, C.threat, alpha); // it knows where a predator is, not which way it faces
    };

    if (level < L_MAP) {
      // Egocentric: the world as seen from where it stands, facing up. It isn't in this picture.
      g.save();
      g.translate(W / 2, H * 0.68);
      g.rotate(-Math.PI / 2 - me.a);
      g.translate(-me.x, -me.y);
      g.save(); g.globalAlpha = 0.06; g.fillStyle = ink; visPath(g); g.fill(); g.restore();
      g.save(); visPath(g); g.clip();
      BUSHES.filter(bushInSight).forEach((b) => bush(g, b, 0.9, level < L_KINDS));
      g.restore();
      [...foods, ...threats].filter(inSight).forEach((o) => drawThing(o, 1));
      g.restore();
    } else {
      // Allocentric: a map of the place. To use a map, it has to mark itself on it.
      drawFog(g);
      g.strokeStyle = ink; g.globalAlpha = 0.35; g.lineWidth = 3;
      g.strokeRect(4, 4, W - 8, H - 8);
      g.globalAlpha = 1;
      knownBushes.forEach((i) => bush(g, BUSHES[i], 0.75));
      knownPatches.forEach((_, i) => patchSpot(g, patches[i], 1.4));
      for (const m of memory.values()) {
        const p = where(m), age = t - m.seenT;
        if (m.kind === 'threat' && age > 0.3) {
          // "it was around here somewhere": the circle grows as the memory gets older
          const k = clamp(1 - age / memoryLife('threat'), 0, 1);
          g.save();
          g.globalAlpha = 0.12 * k; g.fillStyle = C.threat;
          g.beginPath(); g.arc(p.x, p.y, 8 + age * 4, 0, Math.PI * 2); g.fill();
          g.globalAlpha = 0.5 * k; g.strokeStyle = C.threat; g.lineWidth = 1.5;
          g.stroke();
          g.restore();
        } else {
          drawThing({ ...p, kind: m.kind }, clamp(1 - age / memoryLife(m.kind), 0.4, 1));
        }
      }

      // the route it has planned: faint while exploring, solid to food, bold when running for cover
      if (route && route.pts.length > 1) {
        g.save();
        g.strokeStyle = C.self;
        g.globalAlpha = route.kind === 'explore' ? 0.35 : route.kind === 'food' ? 0.7 : 1;
        g.lineWidth = route.kind === 'refuge' ? 3 : 2;
        g.setLineDash(route.kind === 'refuge' ? [] : [3, 5]); g.lineCap = 'round';
        g.beginPath(); g.moveTo(me.x, me.y);
        route.pts.forEach((p) => g.lineTo(p.x, p.y));
        g.stroke();
        g.restore();
      }

      // a new thing appears in the model: itself
      const appear = clamp((t - levelT) / 0.8, 0, 1);
      const pulse = t - levelT < 3 ? 1 - ((t - levelT) % 1) : 0;
      if (pulse > 0) {
        g.strokeStyle = C.self; g.globalAlpha = pulse * 0.6; g.lineWidth = 2;
        g.beginPath(); g.arc(me.x, me.y, 10 + (1 - pulse) * 22, 0, Math.PI * 2); g.stroke();
        g.globalAlpha = 1;
      }
      creature(g, me.x, me.y, me.a, BODY, appear);
    }
  }

  /* ---------- loop: runs only while on screen ---------- */

  let raf = 0, last = 0, visible = false, lastStats = 0, acc = 0;
  const STEP = 1 / 60;
  function frame(now) {
    // Fixed time steps: the simulation always advances in exact 1/60 s steps, whatever the frame
    // rate, so the same world plays out the same way on every machine. (Catches up at most 0.3 s.)
    acc += Math.min(0.3, (now - last) / 1000 || 0) * speedK;
    last = now;
    while (acc >= STEP) { step(STEP); acc -= STEP; }
    drawWorld();
    drawModel();
    if (t - lastStats > 1) { renderStats(); lastStats = t; }
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });
  io.observe(ctx.root);

  setLevel(0);
  return () => { io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf); };
});
