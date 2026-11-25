/* Fig: Ship of Theseus — replace rotting planks one by one. Old planks end up in the water. */
Viz.define('ship-of-theseus', (ctx) => {
  'use strict';
  const { svg, h, rng, lerp } = Viz;
  const id = (name) => ctx.uid + '-' + name;

  /* ---------- geometry ---------- */
  // The hull is described in (t, v) coordinates: t runs stern→bow (0..1),
  // v runs sheer line→keel (0..1). pt() maps them onto the drawing.
  const W = 900, H = 400;
  const XS = 104, XB = 812, L = XB - XS;
  const WATER_Y = 262;
  const STRAKES = [0, 0.12, 0.33, 0.555, 0.775, 1]; // plank rows (v boundaries)
  const SEGMENTS = [4, 6, 6, 6, 5];                  // planks per row (before staggering)
  const OFFSETS = [0, 0.5, 0.2, 0.7, 0.35];          // butt-joint stagger per row

  function frame(t) {
    const u = 2 * t - 1;
    const yTop = 184 - 44 * u * u - (u > 0 ? 22 * u * u * u : 0); // sheer rises toward the ends
    const D = 110, Dmin = 42;
    const p = u < 0 ? 3.4 : 1.9;                                   // full stern, sharper bow
    return { yTop, depth: Dmin + (D - Dmin) * (1 - Math.pow(Math.abs(u), p)) };
  }
  function pt(t, v) {
    const f = frame(t);
    const x = XS + L * t - 52 * v * Math.pow(t, 9) + 26 * v * Math.pow(1 - t, 12); // raked stem & stern
    return [x, f.yTop + f.depth * v];
  }
  const fmt = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1);

  function bandPath(t0, t1, v0, v1) {
    const n = Math.max(3, Math.ceil((t1 - t0) * 80));
    const top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const t = lerp(t0, t1, i / n);
      top.push(pt(t, v0));
      bot.push(pt(t, v1));
    }
    return 'M' + top.map(fmt).join('L') + 'L' + bot.reverse().map(fmt).join('L') + 'Z';
  }
  function curve(t0, t1, v, amp, freq, phase) {
    const n = Math.max(3, Math.ceil((t1 - t0) * 70));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = lerp(t0, t1, i / n);
      const p = pt(t, v);
      p[1] += amp * Math.sin(t * freq + phase);
      pts.push(p);
    }
    return 'M' + pts.map(fmt).join('L');
  }

  function layout() {
    const planks = [];
    for (let k = 0; k < STRAKES.length - 1; k++) {
      const n = SEGMENTS[k], off = OFFSETS[k] / n;
      const joints = [0];
      for (let j = 1; j <= n; j++) {
        const t = j / n - off;
        if (t > 0.06 && t < 0.94) joints.push(t);
      }
      joints.push(1);
      for (let i = 0; i < joints.length - 1; i++) {
        planks.push({ k, t0: joints[i], t1: joints[i + 1], v0: STRAKES[k], v1: STRAKES[k + 1] });
      }
    }
    planks.forEach((p, i) => {
      p.i = i;
      p.d = bandPath(p.t0, p.t1, p.v0, p.v1);
      p.center = pt((p.t0 + p.t1) / 2, (p.v0 + p.v1) / 2);
    });
    return planks;
  }

  const planks = layout();
  const N = planks.length;
  const nailInset = 7 / L;

  /* ---------- plank artwork ---------- */

  // Shared by old and new: the plank above overlaps this one (shadow at the top),
  // and the lower edge catches light. This is what makes the hull read as round.
  function relief(inner, p) {
    const dv = p.v1 - p.v0;
    inner.append(svg('path', { class: 'sot-lap-shadow', d: bandPath(p.t0, p.t1, p.v0, p.v0 + dv * 0.22) }));
    inner.append(svg('path', { class: 'sot-lap-light', d: bandPath(p.t0, p.t1, p.v1 - dv * 0.1, p.v1) }));
  }

  function nails(g, p, cls, r, rusty) {
    const fs = p.k === 0 ? [0.5] : [0.32, 0.68];
    for (const t of [p.t0 + nailInset, p.t1 - nailInset]) {
      for (const f of fs) {
        const [x, y] = pt(t, lerp(p.v0, p.v1, f));
        if (rusty && r() < 0.7) {
          g.append(svg('path', { class: 'sot-rust', d: `M${x.toFixed(1)},${y.toFixed(1)}l${(r() - .5).toFixed(1)},${(3 + r() * 9).toFixed(1)}` }));
        }
        g.append(svg('circle', { class: cls, cx: x.toFixed(1), cy: y.toFixed(1), r: 1.6 }));
      }
    }
  }

  // Rot starts where water sits: at butt joints and around nails. So rot clusters at plank ends.
  const nearEnd = (p, r) => (r() < 0.5 ? lerp(p.t0, p.t1, r() * 0.25) : lerp(p.t0, p.t1, 1 - r() * 0.25));

  function oldPlank(p) {
    const r = rng(1009 + p.i * 7919);
    const decay = Math.pow(r(), 0.8);                // 0 = sound but old, 1 = falling apart
    const hue = 26 + r() * 10, sat = 10 + r() * 14 - decay * 6, light = 40 - decay * 12 + r() * 5;
    const g = svg('g', {
      class: 'sot-plank is-old', tabindex: 0, role: 'button',
      'aria-label': `Plank ${p.i + 1} of ${N}`,
    });
    g.__plank = p;
    g.append(svg('path', { class: 'sot-plank-body', d: p.d, fill: `hsl(${hue} ${sat}% ${light}%)` }));

    const inner = svg('g', { 'clip-path': `url(#${id('clip-' + p.i)})` });
    for (let j = 0; j < 4; j++) {
      inner.append(svg('path', {
        class: 'sot-grain-old',
        d: curve(p.t0, p.t1, lerp(p.v0, p.v1, 0.12 + 0.76 * r()), 0.9, 40 + r() * 40, r() * 6),
      }));
    }
    // water stains: everyone has some
    for (let j = 0; j < 1 + Math.round(r() * 2); j++) {
      const [x, y] = pt(nearEnd(p, r), lerp(p.v0, p.v1, r()));
      inner.append(svg('ellipse', { class: 'sot-stain', cx: x, cy: y, rx: 10 + r() * 16, ry: 4 + r() * 6, filter: `url(#${id('rot')})` }));
    }
    // rot: only on decayed planks
    const blobs = Math.round(decay * decay * 4);
    for (let j = 0; j < blobs; j++) {
      const [x, y] = pt(nearEnd(p, r), lerp(p.v0, p.v1, r()));
      inner.append(svg('ellipse', { class: 'sot-rot', cx: x, cy: y, rx: 5 + r() * 12 * decay, ry: 3 + r() * 6 * decay, filter: `url(#${id('rot')})` }));
    }
    // a split along the grain
    if (decay > 0.3 && r() < decay) {
      const fromStart = r() < 0.5;
      const len = (p.t1 - p.t0) * (0.3 + r() * 0.5);
      let t = fromStart ? p.t0 : p.t1, v = lerp(p.v0, p.v1, 0.35 + r() * 0.3);
      const pts = [pt(t, v)];
      for (let j = 0; j < 7; j++) {
        t += (fromStart ? 1 : -1) * len / 7;
        v = Math.min(p.v1, Math.max(p.v0, v + (r() - 0.5) * (p.v1 - p.v0) * 0.18));
        pts.push(pt(t, v));
      }
      inner.append(svg('path', { class: 'sot-crack', d: 'M' + pts.map(fmt).join('L') }));
    }
    // rotted through: a hole at the plank's edge
    if (decay > 0.72) {
      const t = nearEnd(p, r), atTop = r() < 0.5;
      const [x, y] = pt(t, atTop ? p.v0 : p.v1);
      inner.append(svg('ellipse', { class: 'sot-hole', cx: x, cy: y, rx: 5 + r() * 7, ry: 4 + r() * 4, filter: `url(#${id('rot')})` }));
    }
    // weed only along the waterline row
    if (p.k === 3 || p.k === 4) {
      for (let j = 0; j < Math.round(r() * 2); j++) {
        const [x, y] = pt(lerp(p.t0, p.t1, r()), lerp(p.v0, p.v1, 0.75 + r() * 0.25));
        inner.append(svg('ellipse', { class: 'sot-moss', cx: x, cy: y, rx: 6 + r() * 10, ry: 2 + r() * 3, filter: `url(#${id('rot')})` }));
      }
    }
    relief(inner, p);
    g.append(inner);
    g.append(svg('path', { class: 'sot-plank-edge', d: p.d }));
    nails(g, p, 'sot-nail-old', r, true);
    return g;
  }

  function newPlank(p) {
    const r = rng(77 + p.i * 104729);
    const hue = 31 + r() * 6, sat = 48 + r() * 12, light = 58 + r() * 7;
    const g = svg('g', { class: 'sot-plank is-new', 'aria-hidden': 'true' });
    g.__plank = p;
    g.append(svg('path', { class: 'sot-plank-body', d: p.d, fill: `hsl(${hue} ${sat}% ${light}%)` }));
    const inner = svg('g', { 'clip-path': `url(#${id('clip-' + p.i)})` });
    for (let j = 0; j < 3; j++) {
      inner.append(svg('path', {
        class: 'sot-grain-new',
        d: curve(p.t0, p.t1, lerp(p.v0, p.v1, 0.2 + 0.6 * r()), 0.7, 30 + r() * 30, r() * 6),
      }));
    }
    relief(inner, p);
    g.append(inner);
    g.append(svg('path', { class: 'sot-plank-edge', d: p.d }));
    nails(g, p, 'sot-nail-new', r, false);
    return g;
  }

  /* ---------- scene ---------- */

  function wavePath(y, amp, period, x0 = -320, x1 = W + 320) {
    let d = `M${x0},${H}L${x0},${y}`;
    for (let x = x0; x < x1; x += period) d += `Q${x + period / 4},${y - amp} ${x + period / 2},${y}T${x + period},${y}`;
    return d + `L${x1},${H}Z`;
  }
  function foamPath(y, amp, period, x0 = -320, x1 = W + 320) {
    let d = `M${x0},${y}`;
    for (let x = x0; x < x1; x += period) d += `Q${x + period / 4},${y - amp} ${x + period / 2},${y}T${x + period},${y}`;
    return d;
  }

  const vb = `0 0 ${W} ${H}`;
  const back = svg('svg', { viewBox: vb, class: 'sot-back', 'aria-hidden': 'true' },
    svg('defs', null,
      svg('linearGradient', { id: id('sky'), x1: 0, y1: 0, x2: 0, y2: 1 },
        svg('stop', { offset: 0, class: 'sot-sky-top' }),
        svg('stop', { offset: 1, class: 'sot-sky-bottom' }))),
    svg('rect', { width: W, height: WATER_Y + 2, fill: `url(#${id('sky')})` }),
    svg('circle', { class: 'sot-sun', cx: 770, cy: 74, r: 24 }),
    svg('path', { class: 'sot-land', d: `M0,${WATER_Y}L0,${WATER_Y - 14}Q40,${WATER_Y - 30} 90,${WATER_Y - 18}Q130,${WATER_Y - 34} 175,${WATER_Y - 12}L200,${WATER_Y}Z`, opacity: .7 }),
    svg('rect', { class: 'sot-sea', y: WATER_Y, width: W, height: H - WATER_Y }),
    svg('ellipse', { class: 'sot-shadow', cx: 460, cy: WATER_Y + 10, rx: 370, ry: 9 }));

  const plankLayer = svg('g', { class: 'sot-planks' });
  const hullOutline = bandPath(0, 1, 0, 1);
  const clips = planks.map((p) => svg('clipPath', { id: id('clip-' + p.i) }, svg('path', { d: p.d })));

  const MAST_X = 448;
  const topBow = pt(1, 0), topStern = pt(0, 0), botBow = pt(1, 1), botStern = pt(0, 1);
  const sternCurl = `M${fmt(topStern)}C${topStern[0] - 26},${topStern[1] - 20} ${topStern[0] - 22},${topStern[1] - 58} ${topStern[0] + 2},${topStern[1] - 62}C${topStern[0] + 18},${topStern[1] - 64} ${topStern[0] + 20},${topStern[1] - 46} ${topStern[0] + 8},${topStern[1] - 42}`;
  const bowPost = `M${fmt(botBow)}L${fmt(topBow)}L${topBow[0] + 10},${topBow[1] - 18}`;
  const yMid = frame(0.5).yTop;

  const ship = svg('svg', { viewBox: vb, class: 'sot-ship', role: 'group', 'aria-label': `A wooden ship with ${N} planks` },
    svg('defs', null,
      svg('filter', { id: id('rot'), x: '-40%', y: '-40%', width: '180%', height: '180%' },
        svg('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.09, numOctaves: 2, seed: 7, result: 'n' }),
        svg('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 10, xChannelSelector: 'R', yChannelSelector: 'G' }),
        svg('feGaussianBlur', { stdDeviation: 0.5 })),
      svg('filter', { id: id('grain'), x: 0, y: 0, width: '100%', height: '100%' },
        svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.012 0.45', numOctaves: 3, seed: 3 }),
        svg('feColorMatrix', { type: 'matrix', values: '0 0 0 0 .25  0 0 0 0 .16  0 0 0 0 .08  0 0 0 1.6 -.55' })),
      svg('linearGradient', { id: id('shade'), gradientUnits: 'userSpaceOnUse', x1: 0, y1: yMid - 50, x2: 0, y2: yMid + 115 },
        svg('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0.12 }),
        svg('stop', { offset: 0.3, 'stop-color': '#fff', 'stop-opacity': 0 }),
        svg('stop', { offset: 0.65, 'stop-color': '#000', 'stop-opacity': 0.1 }),
        svg('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.4 })),
      svg('linearGradient', { id: id('ends') },
        svg('stop', { offset: 0, 'stop-color': '#000', 'stop-opacity': 0.25 }),
        svg('stop', { offset: 0.18, 'stop-color': '#000', 'stop-opacity': 0 }),
        svg('stop', { offset: 0.85, 'stop-color': '#000', 'stop-opacity': 0 }),
        svg('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0.2 })),
      svg('clipPath', { id: id('hull') }, svg('path', { d: hullOutline })),
      clips),
    // rigging, mast, sail (behind the hull)
    svg('path', { class: 'sot-rope', d: `M${MAST_X},34L${fmt(topBow)}M${MAST_X},34L${fmt(topStern)}M352,60L${fmt(pt(0.22, 0))}M544,60L${fmt(pt(0.74, 0))}` }),
    svg('rect', { class: 'sot-mast', x: MAST_X - 4, y: 30, width: 8, height: 160, rx: 2 }),
    svg('path', { class: 'sot-flag', d: `M${MAST_X},30l0,-14l26,5l-26,5z` }),
    svg('path', { class: 'sot-sail', d: 'M352,62Q448,74 544,62L536,152Q448,170 360,152Z' }),
    svg('path', { class: 'sot-sail-stripe', d: 'M355,96Q448,110 541,96L540,112Q448,127 357,112Z' }),
    svg('path', { class: 'sot-sail-shade', d: 'M448,70Q500,72 544,62L536,152Q490,163 448,163Z' }),
    svg('path', { class: 'sot-yard', d: 'M346,60L550,60' }),
    // hull
    svg('g', { class: 'sot-hull' },
      plankLayer,
      svg('g', { class: 'sot-hull-overlay', 'clip-path': `url(#${id('hull')})` },
        svg('rect', { class: 'sot-texture', x: XS - 40, y: 100, width: L + 60, height: 210, filter: `url(#${id('grain')})` }),
        svg('rect', { x: XS - 40, y: 100, width: L + 60, height: 210, fill: `url(#${id('shade')})` }),
        svg('rect', { x: XS - 30, y: 100, width: L + 40, height: 210, fill: `url(#${id('ends')})` })),
      svg('path', { class: 'sot-trim', 'stroke-width': 4, d: curve(0, 1, 0, 0, 1, 0) }),
      svg('path', { class: 'sot-trim', 'stroke-width': 4, d: curve(0, 1, 1, 0, 1, 0) }),
      svg('path', { class: 'sot-trim', 'stroke-width': 6, d: bowPost }),
      svg('path', { class: 'sot-trim', 'stroke-width': 6, d: `M${fmt(botStern)}L${fmt(topStern)}` }),
      svg('path', { class: 'sot-trim', 'stroke-width': 5, d: sternCurl })));

  const ripples = svg('g');
  const debris = svg('g', { class: 'sot-debris' });
  const front = svg('svg', { viewBox: vb, class: 'sot-front', 'aria-hidden': 'true' },
    svg('path', { class: 'sot-wave sot-wave--a', d: wavePath(WATER_Y, 3, 100) }),
    svg('path', { class: 'sot-foam', d: foamPath(WATER_Y, 3, 100) }),
    svg('path', { class: 'sot-wave sot-wave--b', d: wavePath(WATER_Y + 26, 2.5, 140) }),
    debris,
    ripples);

  ctx.stage.append(back, ship, front);

  // On narrow screens crop the empty sky so the planks are bigger to tap.
  const narrow = window.matchMedia('(max-width: 600px)');
  const fitView = () => {
    const v = narrow.matches ? '60 16 790 384' : vb;
    [back, ship, front].forEach((s) => s.setAttribute('viewBox', v));
  };
  narrow.addEventListener('change', fitView);
  fitView();

  /* ---------- controls ---------- */

  const prog = Viz.progress({ label: 'Replaced' });
  const restBtn = Viz.button('Replace the rest', replaceRest);
  const resetBtn = Viz.button('Start over', reset);
  ctx.controls.append(prog.el, h('div', { class: 'viz-controls__buttons' }, restBtn, resetBtn));

  /* ---------- state ---------- */

  let replaced = 0;
  let timers = [];
  let busy = false;

  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }

  function render() {
    prog.set(replaced, N);
    restBtn.disabled = replaced === N || busy;
    resetBtn.disabled = replaced === 0;
    ship.classList.toggle('is-complete', replaced === N);
  }

  function splash(x, y, delay) {
    if (Viz.reducedMotion()) return;
    later(() => {
      const e = svg('ellipse', { class: 'sot-ripple', cx: x, cy: y, rx: 40, ry: 5 });
      ripples.append(e);
      later(() => e.remove(), 1300);
    }, delay);
  }

  // Where each old plank comes to rest: a loose pile of flotsam in the foreground.
  function restingPlace(p) {
    const r = rng(31337 + p.i * 2654435761);
    const vm = (p.v0 + p.v1) / 2, a = pt(p.t0, vm), b = pt(p.t1, vm);
    const slope = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; // planks near bow/stern are tilted
    return { x: 120 + r() * 660, y: 320 + r() * 52, rot: -slope + (r() - 0.5) * 16 };
  }

  function dropIntoSea(g) {
    const p = g.__plank;
    const dest = restingPlace(p);
    const dx = dest.x - p.center[0], dy = dest.y - p.center[1];

    g.classList.remove('is-old');
    g.classList.add('is-flotsam');
    g.removeAttribute('tabindex');
    g.removeAttribute('role');
    g.removeAttribute('aria-label');

    // Bobbing wrapper, sorted by depth so nearer planks are drawn on top.
    const wrap = svg('g', { class: 'sot-float', style: { animationDelay: (-(p.i * 0.37) % 4).toFixed(2) + 's' } });
    wrap.__y = dest.y;
    wrap.append(g);
    const after = Array.from(debris.children).find((c) => c.__y > dest.y);
    debris.insertBefore(wrap, after || null);

    const end = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${dest.rot.toFixed(1)}deg)`;
    if (Viz.reducedMotion() || !g.animate) {
      g.style.transform = end;
      return;
    }
    const tip = (p.i % 2 ? 1 : -1) * 8;
    g.animate([
      { transform: 'translate(0px, 0px) rotate(0deg)', easing: 'ease-out' },
      { transform: `translate(${(dx * 0.08).toFixed(1)}px, -8px) rotate(${tip}deg)`, offset: 0.18, easing: 'cubic-bezier(.5,0,.9,.5)' },
      { transform: `translate(${(dx * 0.9).toFixed(1)}px, ${(dy + 10).toFixed(1)}px) rotate(${(dest.rot * 1.4).toFixed(1)}deg)`, offset: 0.78, easing: 'ease-out' },
      { transform: end },
    ], { duration: 1200, fill: 'forwards' });
    splash(dest.x, dest.y + 4, 900);
  }

  function replace(g, { focusNext = false } = {}) {
    if (!g.classList.contains('is-old')) return;
    const fresh = newPlank(g.__plank);
    if (!Viz.reducedMotion()) fresh.classList.add('is-arriving');
    g.before(fresh);
    dropIntoSea(g);

    replaced++;
    if (focusNext) {
      const next = plankLayer.querySelector('.sot-plank.is-old');
      if (next) next.focus({ preventScroll: true });
    }
    render();
    if (replaced === N) later(finish, 1300);
  }

  function replaceRest() {
    const left = Array.from(plankLayer.querySelectorAll('.sot-plank.is-old'));
    if (!left.length) return;
    Viz.shuffle(left);
    busy = true;
    render();
    const step = Viz.reducedMotion() ? 0 : Math.max(60, Math.min(130, 2000 / left.length));
    left.forEach((g, j) => later(() => {
      replace(g);
      if (j === left.length - 1) { busy = false; render(); }
    }, j * step));
  }

  function finish() {
    ctx.ask({
      question: 'Is it still the same ship?',
      options: [
        {
          label: 'Yes',
          reply: '<p>Then what is it, if not the planks? And if someone pulls the old planks out of the water and puts them back together, which of the two ships is the Ship of Theseus?</p>',
        },
        {
          label: 'No',
          reply: '<p>Then which plank made it a different ship?</p>',
        },
      ],
    });
  }

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    busy = false;
    ripples.textContent = '';
    debris.textContent = '';
    plankLayer.textContent = '';
    planks.forEach((p) => plankLayer.append(oldPlank(p)));
    replaced = 0;
    ctx.clearAsk();
    render();
  }

  /* ---------- input ---------- */

  plankLayer.addEventListener('click', (e) => {
    const g = e.target.closest('.sot-plank');
    if (g) replace(g);
  });
  plankLayer.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const g = e.target.closest('.sot-plank');
    if (!g) return;
    e.preventDefault();
    replace(g, { focusNext: true });
  });

  reset();
  return () => timers.forEach(clearTimeout);
});
