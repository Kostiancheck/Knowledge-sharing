/* Page chrome: reading progress bar, table of contents, reading time. */
(function () {
  'use strict';

  function init() {
    const article = document.querySelector('.article');
    if (!article) return;

    // Reading time (≈230 wpm, figures excluded).
    const meta = document.querySelector('[data-reading-time]');
    if (meta) {
      const text = Array.from(article.querySelectorAll('p, blockquote, h2'))
        .filter((el) => !el.closest('figure'))
        .map((el) => el.textContent).join(' ');
      const words = text.trim().split(/\s+/).length;
      meta.textContent = Math.max(1, Math.round(words / 230)) + ' min read';
    }

    // Reading progress.
    const bar = document.querySelector('.read-progress');
    if (bar) {
      let ticking = false;
      const update = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
        ticking = false;
      };
      addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      addEventListener('resize', update);
      update();
    }

    // Table of contents from h2s.
    const toc = document.querySelector('.toc ol');
    const heads = Array.from(article.querySelectorAll('h2'));
    if (toc && heads.length) {
      const links = heads.map((hd) => {
        if (!hd.id) hd.id = hd.textContent.trim().toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
        const a = document.createElement('a');
        a.href = '#' + hd.id;
        a.textContent = hd.textContent;
        const li = document.createElement('li');
        li.append(a);
        toc.append(li);
        return a;
      });
      const setActive = () => {
        let idx = -1;
        heads.forEach((hd, i) => { if (hd.getBoundingClientRect().top < innerHeight * 0.35) idx = i; });
        links.forEach((a, i) => a.classList.toggle('is-active', i === idx));
      };
      addEventListener('scroll', setActive, { passive: true });
      setActive();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
