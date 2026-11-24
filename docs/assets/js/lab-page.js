/* CHROMA Lab page: mount every [data-mount] component. Export mounts first so it receives the harmony palette. */
(function () {
  'use strict';
  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-mount]'));
  nodes.sort(function (a, b) { return (a.getAttribute('data-mount') === 'export' ? -1 : 0) - (b.getAttribute('data-mount') === 'export' ? -1 : 0); });
  nodes.forEach(function (el) {
    var id = el.getAttribute('data-mount');
    try { window.ChromaLab.mount(id, el); }
    catch (err) {
      el.appendChild(window.Chroma.h('p', { class: 'notice', role: 'alert' }, '元件載入失敗（' + id + '）：' + err.message));
    }
  });
})();
