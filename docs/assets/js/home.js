/* CHROMA Home: data-driven counts and a pause control for the decorative animation. */
(function () {
  'use strict';
  var d = window.Chroma && window.Chroma.data();
  if (d) {
    var counts = { slides: d.slides.length, modules: d.modules.length, sources: d.sources.length };
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var k = el.getAttribute('data-count');
      if (counts[k] !== undefined) { el.textContent = String(counts[k]); }
    });
  }
  var btn = document.getElementById('motion-toggle');
  var art = document.getElementById('hero-art');
  if (btn && art) {
    btn.addEventListener('click', function () {
      var paused = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(paused));
      btn.textContent = paused ? '播放動畫 Play' : '暫停動畫 Pause';
      art.classList.toggle('is-paused', paused);
    });
  }
})();
