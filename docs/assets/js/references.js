/* CHROMA Sources page: S001–S010 with license, modules, limitations and a module filter. */
(function () {
  'use strict';
  var C = window.Chroma, h = C.h, d = C.data();
  if (!d) { return; }
  var list = document.getElementById('source-list'), bar = document.getElementById('filter-bar'), status = document.getElementById('filter-status');
  var items = [];

  function row(label, value) { return [h('dt', null, label), h('dd', null, value)]; }

  d.sources.forEach(function (s) {
    var mods = s.modules.map(function (m, i) { return [i ? '、' : null, C.moduleLink(m, m + ' ' + ((C.module(m) || {}).title || ''))]; });
    var li = h('li', { class: 'source-item', id: s.source_id, 'data-modules': s.modules.join(' '), tabindex: '-1' },
      h('div', { class: 'source-id' }, s.source_id),
      h('div', null,
        h('h2', { lang: s.language === 'en' ? 'en' : null }, s.title),
        h('p', null, s.author + (s.organization && s.organization !== s.author ? '｜' + s.organization : '')),
        h('dl', { class: 'source-meta' },
          row('原始網址 URL', h('a', { href: s.url, rel: 'noopener noreferrer' }, s.url)),
          s.original_url ? row('原網址 Original', h('a', { href: s.original_url, rel: 'noopener noreferrer' }, s.original_url)) : null,
          row('授權 License', s.license),
          row('類型 Type', s.source_type),
          row('發布日期', s.published_at || '未知（null）'),
          row('擷取日期', s.retrieved_at),
          row('擷取方式', s.access_method),
          row('對應模組', mods),
          row('定位 Locator', s.locator),
          row('狀態', s.status)),
        h('p', null, h('strong', null, '原創摘要：'), s.summary),
        h('p', { class: 'source-limit' }, h('strong', null, '適用限制：'), s.limitations)));
    items.push(li);
    list.appendChild(li);
  });

  var buttons = [];
  function apply(mid) {
    var n = 0;
    items.forEach(function (li) {
      var show = !mid || li.getAttribute('data-modules').split(' ').indexOf(mid) >= 0;
      li.hidden = !show; if (show) { n += 1; }
    });
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-m') || '') === (mid || ''))); });
    status.textContent = (mid ? mid + '：' : '全部：') + n + ' 篇來源';
  }
  [{ id: '', label: '全部 All' }].concat(d.modules.map(function (m) { return { id: m.id, label: m.id + ' ' + m.title }; })).forEach(function (o) {
    var b = h('button', { type: 'button', class: 'btn btn-sm', 'data-m': o.id, 'aria-pressed': 'false' }, o.label);
    b.addEventListener('click', function () { apply(o.id); });
    buttons.push(b); bar.appendChild(b);
  });
  apply('');

  function focusHash() {
    var id = location.hash.slice(1);
    var el = /^S\d{3}$/.test(id) && document.getElementById(id);
    if (el) { if (el.hidden) { apply(''); } el.scrollIntoView({ block: 'start' }); el.focus({ preventScroll: true }); }
  }
  window.addEventListener('hashchange', focusHash);
  focusHash();
})();
