/* ==========================================================================
   Viz — a tiny, dependency-free convention for interactive figures.

   In the HTML:
     <figure class="viz wide" data-viz="ship-of-theseus">
       <div class="viz-body"><noscript>Fallback text</noscript></div>
       <figcaption>Caption…</figcaption>
     </figure>

   In a module (assets/viz/<name>.js, loaded with a plain <script defer>):
     Viz.define('ship-of-theseus', (ctx) => {
       ctx.stage     // <div class="viz-stage">   — draw here
       ctx.controls  // <div class="viz-controls"> — progress, buttons, legend
       ctx.uid       // unique prefix for SVG ids (clipPath, filter, gradient)
       ctx.ask({...})// question panel under the stage
       return () => {}  // optional cleanup
     });

   Figures mount lazily when they get near the viewport.
   ========================================================================== */
(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const registry = new Map();
  let uidCounter = 0;
  let started = false;
  let observer = null;

  /* ---------- DOM helpers ---------- */

  function setAttrs(el, attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    return el;
  }

  function append(el, children) {
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(c instanceof Node ? c : String(c));
    }
    return el;
  }

  /** HTML element: h('div', {class: 'x', onclick: fn}, child, 'text') */
  function h(tag, attrs, ...children) {
    return append(setAttrs(document.createElement(tag), attrs || {}), children);
  }

  /** SVG element: svg('path', {d: '…'}) */
  function svg(tag, attrs, ...children) {
    return append(setAttrs(document.createElementNS(SVG_NS, tag), attrs || {}), children);
  }

  /* ---------- math helpers ---------- */

  /** Seeded PRNG (mulberry32) — figures look the same on every load. */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const shuffle = (arr, r = Math.random) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => motionQuery.matches;

  /* ---------- UI components ---------- */

  function button(label, onClick, opts = {}) {
    return h('button', {
      type: 'button',
      class: 'viz-btn' + (opts.variant ? ' viz-btn--' + opts.variant : ''),
      onclick: onClick,
      'aria-label': opts.ariaLabel,
    }, label);
  }

  /** Labelled progress bar. progress({label}).set(value, max, rightText?) */
  function progress(opts = {}) {
    const fill = h('div', { class: 'viz-progress__fill' });
    const value = h('span', { class: 'viz-progress__value' });
    const track = h('div', {
      class: 'viz-progress__track', role: 'progressbar',
      'aria-label': opts.label || 'Progress', 'aria-valuemin': 0,
    }, fill);
    const el = h('div', { class: 'viz-progress' },
      h('div', { class: 'viz-progress__label' }, h('span', null, opts.label || ''), value),
      track);
    return {
      el,
      set(v, max, text) {
        const f = max > 0 ? clamp(v / max, 0, 1) : 0;
        fill.style.transform = 'scaleX(' + f + ')';
        el.classList.toggle('is-complete', f >= 1);
        track.setAttribute('aria-valuemax', max);
        track.setAttribute('aria-valuenow', v);
        value.textContent = text != null ? text : v + ' / ' + max;
      },
    };
  }

  /**
   * Segmented stepper: steps({label, options: ['A', 'B'], value, onChange(i)}).
   * Arrow keys move between steps. Returns {el, set(i), value}.
   */
  function steps(opts) {
    let value = opts.value || 0;
    const el = h('div', { class: 'viz-steps', role: 'radiogroup', 'aria-label': opts.label || 'Steps' });
    const btns = opts.options.map((o, i) => h('button', {
      type: 'button', class: 'viz-steps__btn', role: 'radio', onclick: () => set(i, true),
    }, h('span', { class: 'viz-steps__num' }, String(i + 1)), o));
    el.append(...btns);
    function set(i, fire) {
      value = clamp(i, 0, btns.length - 1);
      btns.forEach((b, j) => {
        b.classList.toggle('is-active', j === value);
        b.classList.toggle('is-past', j < value);
        b.setAttribute('aria-checked', String(j === value));
        b.tabIndex = j === value ? 0 : -1;
      });
      if (fire && opts.onChange) opts.onChange(value);
    }
    el.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      set(value + d, true);
      btns[value].focus();
    });
    set(value, false);
    return { el, set: (i) => set(i, false), get value() { return value; } };
  }

  /**
   * Labelled range slider: slider({label, min, max, step, value, format(v), onInput(v)}).
   * Returns {el, value, set(v)}.
   */
  function slider(opts) {
    const { min = 0, max = 1, step = 1 } = opts;
    const input = h('input', {
      type: 'range', class: 'viz-slider__input', min, max, step, value: opts.value ?? min,
      'aria-label': opts.label,
    });
    const out = h('output', { class: 'viz-slider__value' });
    const show = () => {
      const v = +input.value;
      out.textContent = opts.format ? opts.format(v) : String(v);
      input.style.setProperty('--fill', ((v - min) / (max - min || 1)) * 100 + '%');
    };
    input.addEventListener('input', () => { show(); if (opts.onInput) opts.onInput(+input.value); });
    show();
    const el = h('label', { class: 'viz-slider' }, h('span', { class: 'viz-slider__label' }, opts.label), input, out);
    return { el, get value() { return +input.value; }, set(v) { input.value = v; show(); } };
  }

  /** Small legend: legend([{label, swatch: 'css-class'}]) */
  function legend(items) {
    return h('ul', { class: 'viz-legend' },
      items.map((it) => h('li', null, h('span', { class: 'viz-legend__swatch ' + (it.swatch || '') }), it.label)));
  }

  /* ---------- figure context ---------- */

  function createContext(fig) {
    let body = fig.querySelector('.viz-body');
    if (!body) { body = h('div', { class: 'viz-body' }); fig.prepend(body); }
    body.textContent = '';

    const stage = h('div', { class: 'viz-stage' });
    const controls = h('div', { class: 'viz-controls' });
    const panel = h('div', { class: 'viz-panel', hidden: true, 'aria-live': 'polite' });
    body.append(stage, controls, panel);

    const ctx = {
      root: fig,
      body, stage, controls, panel,
      uid: 'viz' + (++uidCounter),

      /**
       * Show a question under the stage.
       * ask({ question, options: [{label, reply}], footer: [nodes] })
       * reply may be a string (HTML) or a Node. The reader can change their answer.
       */
      ask({ question, options, footer }) {
        panel.textContent = '';
        const reply = h('div', { class: 'viz-ask__reply', hidden: true });
        const foot = h('div', { class: 'viz-ask__footer', hidden: true }, footer || []);
        const opts = h('div', { class: 'viz-ask__options' });
        options.forEach((o) => {
          const b = button(o.label, () => {
            opts.querySelectorAll('.viz-btn').forEach((x) => x.classList.toggle('is-chosen', x === b));
            reply.textContent = '';
            if (o.reply instanceof Node) reply.append(o.reply); else reply.innerHTML = o.reply;
            reply.hidden = false;
            foot.hidden = false;
            reply.classList.remove('is-in'); void reply.offsetWidth; reply.classList.add('is-in');
            if (o.onChoose) o.onChoose();
          }, { variant: 'choice' });
          opts.append(b);
        });
        panel.append(h('p', { class: 'viz-ask__q' }, question), opts, reply, foot);
        panel.hidden = false;
        requestAnimationFrame(() => {
          panel.classList.add('is-open');
          const r = panel.getBoundingClientRect();
          if (r.bottom > innerHeight) {
            panel.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
          }
        });
      },
      clearAsk() {
        panel.classList.remove('is-open');
        panel.hidden = true;
        panel.textContent = '';
      },
    };
    return ctx;
  }

  function mount(fig) {
    if (fig.__vizMounted) return;
    const setup = registry.get(fig.dataset.viz);
    if (!setup) return; // module not loaded (yet)
    fig.__vizMounted = true;
    const ctx = createContext(fig);
    try {
      fig.__vizCleanup = setup(ctx) || null;
      fig.classList.add('is-ready');
    } catch (err) {
      console.error('[viz] ' + fig.dataset.viz + ' failed', err);
      ctx.stage.append(h('p', { class: 'viz-error' }, 'This figure failed to load.'));
    }
  }

  function start() {
    if (started) return;
    started = true;
    const figs = document.querySelectorAll('[data-viz]');
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { mount(e.target); if (e.target.__vizMounted) observer.unobserve(e.target); }
        });
      }, { rootMargin: '600px 0px' });
      figs.forEach((f) => observer.observe(f));
    } else {
      figs.forEach(mount);
    }
  }

  function define(name, setup) {
    registry.set(name, setup);
    if (started) {
      document.querySelectorAll('[data-viz="' + name + '"]').forEach((f) => {
        if (observer) { observer.unobserve(f); observer.observe(f); } else mount(f);
      });
    }
  }

  if (document.readyState === 'complete') start();
  else document.addEventListener('DOMContentLoaded', start);

  window.Viz = { define, h, svg, rng, lerp, clamp, shuffle, reducedMotion, button, progress, legend, steps, slider };
})();
