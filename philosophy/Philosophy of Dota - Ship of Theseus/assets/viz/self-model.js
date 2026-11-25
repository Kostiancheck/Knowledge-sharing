/* Fig: Self-model — a creature and its model of the world. Raise its perception
   step by step; at "Map" the creature has to put itself into its own model,
   at "Map of the map" the model contains itself. */
Viz.define('self-model', (ctx) => {
  'use strict';
  const { h, rng, clamp } = Viz;

  const W = 460, H = 340;
  const LEVELS = [
    { label: 'Things',         note: 'It notices things in front of it, but not what they are.' },
    { label: 'Kinds',          note: 'It tells food from danger.' },
    { label: 'Memory',         note: 'It remembers what it saw a moment ago.' },
    { label: 'Map',            note: 'It keeps a map of the whole place, and plans routes on it.' },
    { label: 'Map of the map', note: 'Its map includes its map: it knows which parts of it to trust.' },
  ];
  const L_THINGS = 0, L_KINDS = 1, L_MEMORY = 2, L_MAP = 3, L_LOOP = 4;

  const RANGE = 190, FOV = Math.PI * 0.62, RAYS = 56;
  const CHASE = 105;           // predators only notice you this close (and only if they can see you)
  const SPEED = 44, FLEE = 64; // a fleeing creature outruns a chasing predator (54)
  const BODY = 9;              // creature radius
  const C = { food: '#2f9e44', threat: '#e03131', self: '#1c7ed6', wall: '#6b6055' };

  // Static walls (capsules). They block movement and sight for everyone.
  const WALLS = [
    [72, 105, 190, 105],
    [262, 266, 362, 266],   // an L-shaped corner
    [362, 266, 362, 192],
    [312, 74, 400, 74],
  ].map(([ax, ay, bx, by], i) => ({ ax, ay, bx, by, r: 6, i }));

  /* ---------- DOM ---------- */

  function panel(title) {
    const canvas = h('canvas', { class: 'sm-canvas' });
    const el = h('div', { class: 'sm-panel' }, h('div', { class: 'sm-label' }, title), canvas);
    return { el, canvas, g: canvas.getContext('2d') };
  }
  const world = panel('World');
  const model = panel('What it knows');
  model.canvas.setAttribute('aria-label', 'The creature’s model of the world');
  world.canvas.setAttribute('aria-label', 'A creature moving among food, predators and walls');
  ctx.stage.append(h('div', { class: 'sm-grid' }, world.el, model.el));

  const note = h('p', { class: 'sm-note' });
  const stats = h('span', { class: 'sm-stats' });
  const stepper = Viz.steps({ label: 'Perception', options: LEVELS.map((l) => l.label), value: 0, onChange: setLevel });
  ctx.controls.classList.add('sm-controls');
  ctx.controls.append(stepper.el, h('div', { class: 'sm-row' }, note, stats));

  // Feedback buffer for the strange loop: last frame of the model, drawn into itself.
  const loopBuf = document.createElement('canvas');

  let ink = '#e9e3d8', paper = '#14120f';
  const cs = getComputedStyle(document.documentElement);
  ink = cs.getPropertyValue('--fg').trim() || ink;
  paper = cs.getPropertyValue('--bg').trim() || paper;
  const inkRGB = (/^#([0-9a-f]{6})$/i.exec(ink) || [0, 'e9e3d8'])[1].match(/../g).map((x) => parseInt(x, 16));

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const p of [world, model]) {
      const b = p.canvas.getBoundingClientRect();
      p.canvas.width = Math.max(1, Math.round(b.width * dpr));
      p.canvas.height = Math.max(1, Math.round(b.height * dpr));
    }
    loopBuf.width = model.canvas.width;
    loopBuf.height = model.canvas.height;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(world.canvas);

  /* ---------- geometry ---------- */

  // Distance from point to segment.
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const u = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    return Math.hypot(px - (ax + dx * u), py - (ay + dy * u));
  }
  // Distance between two segments (0 if they cross).
  function segSegDist(ax, ay, bx, by, cx, cy, dx, dy) {
    const cross = (x1, y1, x2, y2) => x1 * y2 - y1 * x2;
    const d1 = cross(bx - ax, by - ay, cx - ax, cy - ay), d2 = cross(bx - ax, by - ay, dx - ax, dy - ay);
    const d3 = cross(dx - cx, dy - cy, ax - cx, ay - cy), d4 = cross(dx - cx, dy - cy, bx - cx, by - cy);
    if (((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))) return 0;
    return Math.min(segDist(ax, ay, cx, cy, dx, dy), segDist(bx, by, cx, cy, dx, dy),
      segDist(cx, cy, ax, ay, bx, by), segDist(dx, dy, ax, ay, bx, by));
  }
  // Is the straight line a→b free of walls (with `pad` of clearance)?
  function clear(ax, ay, bx, by, pad = 0, walls = WALLS) {
    for (const w of walls) if (segSegDist(ax, ay, bx, by, w.ax, w.ay, w.bx, w.by) < w.r + pad) return false;
    return true;
  }
  // Push a round body out of any wall it overlaps.
  function collide(o, rad) {
    for (const w of WALLS) {
      const dx = w.bx - w.ax, dy = w.by - w.ay;
      const u = clamp(((o.x - w.ax) * dx + (o.y - w.ay) * dy) / (dx * dx + dy * dy), 0, 1);
      const qx = w.ax + dx * u, qy = w.ay + dy * u;
      const d = Math.hypot(o.x - qx, o.y - qy), min = w.r + rad;
      if (d < min && d > 0.001) { o.x = qx + (o.x - qx) / d * min; o.y = qy + (o.y - qy) / d * min; }
    }
    o.x = clamp(o.x, rad, W - rad);
    o.y = clamp(o.y, rad, H - rad);
  }
  // Reflex every animal has, at every level: if the way ahead is blocked, turn to the nearest
  // open direction, and keep following the obstacle on that side until the way is clear.
  function avoid(o, want, rad) {
    const L = 24;
    const open = (a) => {
      const x = o.x + Math.cos(a) * L, y = o.y + Math.sin(a) * L;
      return x > rad && y > rad && x < W - rad && y < H - rad && clear(o.x, o.y, x, y, rad - 2);
    };
    if (open(want)) { o.side = 0; return want; }
    if (!o.side) {
      // pick the side that needs the smaller turn
      for (let k = 1; k <= 12 && !o.side; k++) {
        if (open(want + k * 0.26)) o.side = 1;
        else if (open(want - k * 0.26)) o.side = -1;
      }
      if (!o.side) o.side = 1;
    }
    for (let k = 1; k <= 12; k++) { const a = want + o.side * k * 0.26; if (open(a)) return a; }
    return want + o.side * Math.PI * 0.75;
  }
  const awayFromWalls = (x, y, pad) => WALLS.every((w) => segDist(x, y, w.ax, w.ay, w.bx, w.by) > w.r + pad);

  /* ---------- grid: fog of war and route planning ---------- */

  const CELL = 10, GW = Math.ceil(W / CELL), GH = Math.ceil(H / CELL), N = GW * GH;
  const cx = (c) => (c % GW) * CELL + CELL / 2, cy = (c) => Math.floor(c / GW) * CELL + CELL / 2;
  const cellAt = (x, y) => clamp(Math.floor(y / CELL), 0, GH - 1) * GW + clamp(Math.floor(x / CELL), 0, GW - 1);
  const lastSeen = new Float32Array(N);
  const blocked = new Uint8Array(N);
  const gdist = new Float64Array(N), prev = new Int32Array(N), risk = new Float64Array(N); // 64-bit: rounding in 32-bit made the planner loop forever
  const FOG_FADE = 7; // seconds for an area it hasn't looked at to grey over again
  // Knowing what it knows: how likely a food memory is to still be true. Food lasts 30–60s,
  // so after that long a memory is probably just "seeming to remember".
  const trust = (age) => clamp(1 - (age - 12) / 36, 0, 1);

  function rebuildBlocked() {
    const walls = WALLS.filter((w) => knownWalls.has(w.i));
    for (let c = 0; c < N; c++) {
      const x = cx(c), y = cy(c);
      blocked[c] = (x < BODY || y < BODY || x > W - BODY || y > H - BODY ||
        walls.some((w) => segDist(x, y, w.ax, w.ay, w.bx, w.by) < w.r + BODY + 2)) ? 1 : 0;
    }
  }

  // Dijkstra over the free cells, from the creature's cell. Small grid, simple binary heap.
  // Routes are priced by length plus risk: cells near predators it knows about cost extra.
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
    let start = cellAt(me.x, me.y);
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
        if (ox && oy && (blocked[y * GW + nx] || blocked[ny * GW + x])) continue; // no corner cutting
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
  // Nearest free cell, for targets that sit right next to a wall.
  function freeCellNear(x, y) {
    const c = cellAt(x, y);
    if (!blocked[c]) return c;
    let best = c, bd = Infinity;
    for (let k = 0; k < N; k++) if (!blocked[k]) { const d = Math.hypot(cx(k) - x, cy(k) - y); if (d < bd) { bd = d; best = k; } }
    return best;
  }

  /* ---------- world ---------- */

  let r, nextId;
  const rand = (a, b) => a + r() * (b - a);
  function spawnFood() {
    let x, y, tries = 0;
    do { x = rand(25, W - 25); y = rand(25, H - 25); } while (!awayFromWalls(x, y, 10) && ++tries < 50);
    return { id: nextId++, kind: 'food', x, y, gone: t + rand(30, 60) };
  }

  let me, foods, threats, vis;
  let level = 0;
  let t = 0, levelT = 0, eaten = 0, hurt = 0;
  const memory = new Map(); // id -> {x, y, vx, vy, kind, seenT}
  const knownWalls = new Set();
  let route = null, routeT = -9, knownCount = -1;

  // Every level starts from the same world, so the only difference between runs is perception.
  function resetWorld() {
    r = rng(61);
    nextId = 1;
    t = 0;
    me = { x: 110, y: 235, a: -Math.PI / 2, hurtT: -9, wanderSeed: 3, side: 0, heading: -Math.PI / 2, headingT: 0, checkT: 1.5, checkX: 110, checkY: 235 };
    foods = Array.from({ length: 8 }, spawnFood);
    // none starts within reach of the creature (it starts bottom-left, facing up)
    threats = [[W - 50, 40], [40, 30], [W - 50, H - 30]].map(([x, y], i) => ({ id: nextId++, kind: 'threat', x, y, a: rand(0, 6.28), cool: 0, sp: 28, seed: i * 5 + 1, side: 0 }));
  }

  function setLevel(i) {
    level = i;
    resetWorld();
    levelT = t;
    lastStats = 0;
    eaten = 0; hurt = 0;
    memory.clear();
    knownWalls.clear();
    knownCount = -1;
    route = null; routeT = -9;
    lastSeen.fill(-1e6);
    note.textContent = LEVELS[i].note;
    vis = look();
    renderStats();
  }

  const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const distTo = (o) => Math.hypot(o.x - me.x, o.y - me.y);
  const inCone = (o) => distTo(o) < RANGE && Math.abs(angDiff(Math.atan2(o.y - me.y, o.x - me.x), me.a)) < FOV / 2;
  const inSight = (o) => inCone(o) && clear(me.x, me.y, o.x, o.y);
  const wob = (s) => Math.sin(t * 0.9 + s) + 0.6 * Math.sin(t * 2.3 + s * 1.7);

  // What it can see: rays across the cone, stopped by walls. Returns the visible area's outline.
  function look() {
    const pts = [], hit = [];
    for (let i = 0; i <= RAYS; i++) {
      const a = me.a - FOV / 2 + (FOV * i) / RAYS, ca = Math.cos(a), sa = Math.sin(a);
      let d = RANGE, wall = -1;
      for (let s = 4; s <= RANGE; s += 3) {
        const x = me.x + ca * s, y = me.y + sa * s;
        const w = WALLS.find((w) => segDist(x, y, w.ax, w.ay, w.bx, w.by) < w.r);
        if (w) { d = s; wall = w.i; break; }
      }
      pts.push([me.x + ca * d, me.y + sa * d]);
      hit.push(wall);
    }
    return { pts, hit };
  }

  // Short-term memory holds things for a few seconds. A mental map needs long-term memory:
  // food stays on it until it's seen to be gone; predators stay longer too, but as
  // increasingly uncertain guesses (they move).
  function memoryLife(kind) {
    if (level < L_MEMORY) return 0;
    if (level >= L_MAP) return kind === 'food' ? 120 : 15;
    return 6;
  }
  // Where a remembered thing probably is now: predators keep moving, so extrapolate a little.
  function where(m) {
    const age = Math.min(1.5, t - m.seenT);
    return { x: clamp(m.x + m.vx * age, 10, W - 10), y: clamp(m.y + m.vy * age, 10, H - 10) };
  }

  /* What the creature currently "has" to act on, per level. */
  function percepts() {
    const visible = [...foods, ...threats].filter(inSight);
    if (level < L_MEMORY) return visible;
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
      out.push({ ...p, kind: m.kind, seenT: m.seenT, age: t - m.seenT });
    }
    return out;
  }

  // Map levels: update what it knows about the place from what it sees right now.
  function updateMap() {
    vis.hit.forEach((wi) => { if (wi >= 0) knownWalls.add(wi); });
    if (knownWalls.size !== knownCount) { knownCount = knownWalls.size; rebuildBlocked(); }
    const c0x = Math.floor((me.x - RANGE) / CELL), c1x = Math.ceil((me.x + RANGE) / CELL);
    const c0y = Math.floor((me.y - RANGE) / CELL), c1y = Math.ceil((me.y + RANGE) / CELL);
    for (let y = Math.max(0, c0y); y < Math.min(GH, c1y); y++) {
      for (let x = Math.max(0, c0x); x < Math.min(GW, c1x); x++) {
        const c = y * GW + x;
        if (inSight({ x: cx(c), y: cy(c) })) lastSeen[c] = t;
      }
    }
  }

  // Map levels: choose where to go and how to get there.
  function planRoute(goals, dangers) {
    plan(dangers);
    let target = null, best = Infinity;
    goals.forEach((f) => {
      const c = freeCellNear(f.x, f.y);
      // Map trusts every memory equally. Map of the map weighs each one by how likely it is
      // to still be true, and drops the ones that almost certainly aren't.
      let cost = gdist[c];
      if (level >= L_LOOP) {
        const k = trust(f.age || 0);
        if (k < 0.1) return;
        cost /= k;
      }
      if (cost < best) { best = cost; target = c; }
    });
    let exploring = false;
    if (target === null) {
      // nothing worth going to: head for the part of the map it has seen least recently
      exploring = true;
      let score = -Infinity;
      for (let c = 0; c < N; c++) {
        if (blocked[c] || !isFinite(gdist[c])) continue;
        const s = Math.min(t - lastSeen[c], FOG_FADE * 3) - gdist[c] * 0.12;
        if (s > score) { score = s; target = c; }
      }
    }
    route = target === null ? null : { pts: pathTo(target), exploring };
    routeT = t;
  }

  function step(dt) {
    t += dt;

    // Predators wander slowly and pounce from close range, if they can see you.
    threats.forEach((th) => {
      th.cool = Math.max(0, th.cool - dt);
      const d = Math.hypot(me.x - th.x, me.y - th.y);
      const chasing = d < CHASE && th.cool === 0 && clear(th.x, th.y, me.x, me.y);
      let want = th.a + wob(th.seed) * 0.8 * dt * 3;
      if (chasing) want = Math.atan2(me.y - th.y, me.x - th.x);
      if (th.cool > 0) want = Math.atan2(th.y - me.y, th.x - me.x);
      want = avoid(th, want, 9);
      th.a += clamp(angDiff(want, th.a), -2.6 * dt, 2.6 * dt);
      th.sp = chasing ? 54 : 28;
      th.x += Math.cos(th.a) * th.sp * dt;
      th.y += Math.sin(th.a) * th.sp * dt;
      collide(th, 9);
      if (d < 17 && th.cool === 0) {
        hurt++; me.hurtT = t; th.cool = 2.2;
        me.x += (me.x - th.x) * 0.8; me.y += (me.y - th.y) * 0.8;
        collide(me, BODY);
        renderStats();
      }
    });

    vis = look();
    if (level >= L_MAP) updateMap();

    // Behaviour uses exactly what this level of perception provides, nothing more.
    let vx = 0, vy = 0;
    const ps = percepts();
    // Things: can't tell what anything is, so everything looks like food.
    const dangers = level >= L_KINDS ? ps.filter((o) => o.kind === 'threat') : [];
    let goals = level === L_THINGS ? ps : ps.filter((o) => o.kind === 'food');
    // Survival comes first. Once it can tell food from danger, food near a predator it knows
    // about isn't worth it, and neither is food it would have to run past a predator to reach.
    // (It never starves here, so there's no reason to take the risk.)
    if (level >= L_KINDS) goals = goals.filter((f) => dangers.every((o) =>
      Math.hypot(f.x - o.x, f.y - o.y) > 120 && segDist(o.x, o.y, me.x, me.y, f.x, f.y) > 75));

    // Run from predators it sees; keep clear of ones it only remembers (less certain, so closer range).
    let fleeing = false;
    dangers.forEach((o) => {
      const age = o.age || 0, remembered = age > 0;
      // the older the memory, the less sure it is where the predator is now
      const reach = remembered ? Math.max(90, 170 - age * 6) : 200;
      const panic = !remembered ? 150 : age < 4 ? 120 : 0;
      const d = Math.max(1, Math.hypot(o.x - me.x, o.y - me.y));
      if (d > reach) return;
      const w = (reach - d) / reach;
      vx -= (o.x - me.x) / d * w * 4;
      vy -= (o.y - me.y) / d * w * 4;
      if (d < panic) fleeing = true;
    });

    if (!fleeing) {
      if (level >= L_MAP) {
        // With a map it plans: a route around the walls it knows, to food it remembers,
        // or into the fog when there's nothing to go to.
        if (!route || t - routeT > 0.4) planRoute(goals, dangers);
        if (route && route.pts.length) {
          const known = WALLS.filter((w) => knownWalls.has(w.i));
          let wp = route.pts[route.pts.length - 1];
          for (let i = route.pts.length - 1; i >= 0; i--) {
            const p = route.pts[i];
            wp = p;
            if (clear(me.x, me.y, p.x, p.y, BODY - 2, known)) break;
          }
          const d = Math.max(1, Math.hypot(wp.x - me.x, wp.y - me.y));
          vx += (wp.x - me.x) / d * 1.4; vy += (wp.y - me.y) / d * 1.4;
        }
      } else {
        // Without one it just heads straight for the nearest thing it wants.
        let best = null, bestD = 1e9;
        goals.forEach((o) => {
          const d = Math.max(1, Math.hypot(o.x - me.x, o.y - me.y));
          if (d < bestD) { best = o; bestD = d; }
        });
        if (best) { vx += (best.x - me.x) / bestD * 1.2; vy += (best.y - me.y) / bestD * 1.2; }
        else {
          // ...or, with nothing in view, it searches: long straight runs in a random direction,
          // so the search keeps widening instead of circling one spot.
          if (t > me.headingT) { me.heading = rand(0, Math.PI * 2); me.headingT = t + rand(3, 6); }
          vx += Math.cos(me.heading + wob(me.wanderSeed) * 0.25);
          vy += Math.sin(me.heading + wob(me.wanderSeed) * 0.25);
        }
      }
    } else {
      route = null;
    }
    me.fleeing = fleeing;

    // edges of the field
    const m = 30;
    if (me.x < m) vx += (m - me.x) / m * 1.5;
    if (me.x > W - m) vx -= (me.x - (W - m)) / m * 1.5;
    if (me.y < m) vy += (m - me.y) / m * 1.5;
    if (me.y > H - m) vy -= (me.y - (H - m)) / m * 1.5;

    // Stuck (hardly moved for a while)? Try the other way round, and a new search direction.
    if (t > me.checkT) {
      if (Math.hypot(me.x - me.checkX, me.y - me.checkY) < 14) {
        me.side = -me.side || 1;
        me.heading = rand(0, Math.PI * 2); me.headingT = t + rand(3, 6);
        route = null;
      }
      me.checkT = t + 1.5; me.checkX = me.x; me.checkY = me.y;
    }

    const want = avoid(me, (vx || vy) ? Math.atan2(vy, vx) : me.a, BODY);
    me.a += clamp(angDiff(want, me.a), -3.6 * dt, 3.6 * dt);
    const speed = me.fleeing ? FLEE : SPEED;
    me.x += Math.cos(me.a) * speed * dt;
    me.y += Math.sin(me.a) * speed * dt;
    collide(me, BODY);

    // Food doesn't last: it withers and new food grows somewhere else. A memory of it
    // can quietly stop being true.
    for (let i = 0; i < foods.length; i++) if (t > foods[i].gone) foods[i] = spawnFood();

    // eating
    for (let i = 0; i < foods.length; i++) {
      if (distTo(foods[i]) < 13) {
        memory.delete(foods[i].id);
        foods[i] = spawnFood();
        eaten++;
        route = null;
        renderStats();
      }
    }
  }

  function renderStats() {
    const s = Math.floor(t - levelT);
    stats.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}  ·  ate ${eaten}  ·  hurt ${hurt}`;
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
  function creature(g, x, y, a, rad) {
    dot(g, x, y, rad, C.self);
    dot(g, x + Math.cos(a) * rad * 0.5, y + Math.sin(a) * rad * 0.5, rad * 0.32, '#fff');
  }
  function walls(g, list, alpha = 1) {
    g.save();
    g.globalAlpha = alpha;
    g.strokeStyle = C.wall;
    g.lineCap = 'round';
    list.forEach((w) => { g.lineWidth = w.r * 2; g.beginPath(); g.moveTo(w.ax, w.ay); g.lineTo(w.bx, w.by); g.stroke(); });
    g.restore();
  }
  function begin(p) {
    const g = p.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, p.canvas.width, p.canvas.height);
    g.setTransform(p.canvas.width / W, 0, 0, p.canvas.height / H, 0, 0);
    return g;
  }

  function drawWorld() {
    const g = begin(world);
    g.save(); g.globalAlpha = 0.08; g.fillStyle = ink; visPath(g); g.fill(); g.restore();
    walls(g, WALLS);
    foods.forEach((f) => dot(g, f.x, f.y, 5, C.food));
    threats.forEach((th) => tri(g, th.x, th.y, th.a, 9, C.threat));
    const flash = t - me.hurtT < 0.5;
    if (flash) dot(g, me.x, me.y, 18, C.threat, 0.35 * (1 - (t - me.hurtT) / 0.5));
    creature(g, me.x, me.y, me.a, BODY);
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
      else dot(g, o.x, o.y, 8, C.threat, alpha); // a remembered predator: it knows where, not which way
    };

    if (level < L_MAP) {
      // Egocentric: the world as seen from where it stands, facing up. It isn't in this picture.
      g.save();
      g.translate(W / 2, H * 0.68);
      g.rotate(-Math.PI / 2 - me.a);
      g.translate(-me.x, -me.y);
      g.save(); g.globalAlpha = 0.06; g.fillStyle = ink; visPath(g); g.fill(); g.restore();
      // only the bits of wall it's looking at right now
      g.save();
      g.strokeStyle = C.wall; g.lineWidth = 6; g.lineCap = 'round';
      for (let i = 1; i < vis.pts.length; i++) {
        if (vis.hit[i] >= 0 && vis.hit[i] === vis.hit[i - 1]) {
          g.beginPath(); g.moveTo(...vis.pts[i - 1]); g.lineTo(...vis.pts[i]); g.stroke();
        }
      }
      g.restore();
      if (level === L_MEMORY) {
        for (const m of memory.values()) drawThing({ ...where(m), kind: m.kind }, clamp(1 - (t - m.seenT) / memoryLife(m.kind), 0.1, 1));
      } else {
        [...foods, ...threats].filter(inSight).forEach((o) => drawThing(o, 1));
      }
      g.restore();
    } else {
      // Allocentric: a map of the place. To use a map, it has to mark itself on it.
      drawFog(g);
      g.strokeStyle = ink; g.globalAlpha = 0.35; g.lineWidth = 3;
      g.strokeRect(4, 4, W - 8, H - 8);
      g.globalAlpha = 1;
      walls(g, WALLS.filter((w) => knownWalls.has(w.i)), 0.9);
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
        } else if (level >= L_LOOP && m.kind === 'food' && trust(age) < 0.95) {
          // it remembers food here, and knows the memory may be out of date
          g.save();
          g.globalAlpha = 0.3 + 0.6 * trust(age);
          g.strokeStyle = C.food; g.lineWidth = 1.5;
          g.beginPath(); g.arc(p.x, p.y, 5, 0, Math.PI * 2); g.stroke();
          g.restore();
        } else {
          drawThing({ ...p, kind: m.kind }, clamp(1 - age / memoryLife(m.kind), 0.4, 1));
        }
      }

      // the route it has planned
      if (route && route.pts.length > 1) {
        g.save();
        g.strokeStyle = C.self; g.globalAlpha = route.exploring ? 0.35 : 0.7;
        g.lineWidth = 2; g.setLineDash([3, 5]); g.lineCap = 'round';
        g.beginPath(); g.moveTo(me.x, me.y);
        route.pts.forEach((p) => g.lineTo(p.x, p.y));
        g.stroke();
        g.restore();
      }

      const appear = clamp((t - levelT) / 0.8, 0, 1);
      if (level === L_LOOP) {
        // its marker holds its map, which holds its marker, which holds…
        const rad = 44 * appear + 9 * (1 - appear);
        // kept fully inside the panel, so the nesting stays readable near the edges
        const mx = clamp(me.x, rad + 6, W - rad - 6), my = clamp(me.y, rad + 6, H - rad - 6);
        g.save();
        g.beginPath(); g.arc(mx, my, rad, 0, Math.PI * 2); g.clip();
        g.fillStyle = paper;
        g.fill();
        // Shrunken copy of the map, placed so that its own marker lands at this marker's
        // centre: map → marker → map → marker…, a tunnel.
        const s = (rad * 2.4) / W;
        g.drawImage(loopBuf, mx - mx * s, my - my * s, W * s, H * s);
        g.restore();
        g.strokeStyle = C.self; g.lineWidth = 2.5;
        g.beginPath(); g.arc(mx, my, rad, 0, Math.PI * 2); g.stroke();
      } else {
        // a new thing appears in the model: itself
        const pulse = t - levelT < 3 ? 1 - ((t - levelT) % 1) : 0;
        if (pulse > 0) {
          g.strokeStyle = C.self; g.globalAlpha = pulse * 0.6; g.lineWidth = 2;
          g.beginPath(); g.arc(me.x, me.y, 10 + (1 - pulse) * 22, 0, Math.PI * 2); g.stroke();
          g.globalAlpha = 1;
        }
        g.globalAlpha = appear;
        creature(g, me.x, me.y, me.a, BODY);
        g.globalAlpha = 1;
      }
    }

    if (level === L_LOOP) {
      const bg = loopBuf.getContext('2d');
      bg.clearRect(0, 0, loopBuf.width, loopBuf.height);
      bg.drawImage(model.canvas, 0, 0);
    }
  }

  /* ---------- loop: runs only while on screen ---------- */

  let raf = 0, last = 0, visible = false, lastStats = 0;
  function frame(now) {
    // Keep real time on slow devices: catch up in small fixed steps (at most 0.3s per frame).
    let elapsed = Math.min(0.3, (now - last) / 1000 || 0);
    last = now;
    while (elapsed > 0) { const dt = Math.min(1 / 60, elapsed); step(dt); elapsed -= dt; }
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
