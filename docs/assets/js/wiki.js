/* CHROMA Wiki page: module reader, keyword search, glossary, prerequisite graph, gaps. */
(function () {
  'use strict';
  var C = window.Chroma, h = C.h, S = C.svg, d = C.data();
  if (!d) { return; }
  var mods = d.modules;
  var article = document.getElementById('wiki-article');
  var nav = document.getElementById('module-nav');

  function plain(tokens) {
    return (tokens || []).map(function (t) { return t.t === 'cite' ? '[' + t.id + ']' : (t.v || ''); }).join('');
  }
  function blockText(blocks) {
    return blocks.map(function (b) { return b.type === 'p' ? plain(b.inline) : b.items.map(plain).join(' '); }).join(' ');
  }
  function secId(mid, heading) { return mid + '/' + heading; }

  mods.forEach(function (m) {
    nav.appendChild(h('li', null, h('a', { href: '#' + m.id, 'data-mid': m.id }, h('span', { class: 'mono' }, m.id), m.title + ' ' + m.title_en)));
  });

  var dependents = {};
  mods.forEach(function (m) { m.prerequisites.forEach(function (p) { (dependents[p] = dependents[p] || []).push(m.id); }); });

  function linkList(ids) {
    if (!ids.length) { return h('span', null, '無'); }
    var f = document.createDocumentFragment();
    ids.forEach(function (id, i) { if (i) { f.appendChild(document.createTextNode('、')); } f.appendChild(C.moduleLink(id, id + ' ' + (C.module(id) || {}).title)); });
    return f;
  }

  function sourceDetails(ids) {
    return h('ul', null, ids.map(function (sid) {
      var s = C.source(sid);
      if (!s) { return h('li', null, sid); }
      return h('li', null, C.citeLink(sid), ' ', s.title, '（', s.organization, '）', ' — ',
        h('a', { href: s.url, rel: 'noopener noreferrer', class: 'ext' }, '原始網址'), h('br'),
        h('span', { class: 'small muted' }, '授權：' + s.license));
    }));
  }

  function render(mid, section) {
    var m = C.module(mid) || mods[0];
    C.clear(article);
    var head = h('header', null,
      h('p', { class: 'w-no', 'aria-hidden': 'true' }, m.id),
      h('h2', { tabindex: '-1', id: 'module-title' }, m.title, ' ', h('span', { class: 'en' }, m.title_en)),
      h('dl', { class: 'meta-grid' },
        h('div', null, h('dt', null, '狀態 Status'), h('dd', null, m.status + ' · v' + m.version)),
        h('div', null, h('dt', null, '更新 Updated'), h('dd', null, m.updated_at)),
        h('div', null, h('dt', null, '來源 Sources'), h('dd', null, m.sources.map(function (s) { return C.citeLink(s); }))),
        h('div', null, h('dt', null, '前置知識 Prerequisites'), h('dd', null, linkList(m.prerequisites))),
        h('div', null, h('dt', null, '後續模組 Leads to'), h('dd', null, linkList(dependents[m.id] || []))),
        h('div', null, h('dt', null, '相關 Related'), h('dd', null, linkList(m.related)))));
    article.appendChild(head);
    m.sections.forEach(function (s, i) {
      var sec = h('section', { id: secId(m.id, s.heading), class: s.heading === '適用限制' ? 'is-limit' : null },
        h('h3', null, h('span', { class: 'sec-no' }, String(i + 1).padStart(2, '0')), s.heading));
      if (s.heading === '參考來源') { sec.appendChild(sourceDetails(m.sources)); }
      else { sec.appendChild(C.blocks(s.blocks)); }
      article.appendChild(sec);
    });
    article.appendChild(h('p', { class: 'small muted' }, '原始檔：' + m.file + '。網站版本由建置腳本轉換，未改寫內容。'));
    nav.querySelectorAll('a[data-mid]').forEach(function (a) {
      if (a.getAttribute('data-mid') === m.id) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
    });
    document.title = m.id + ' ' + m.title + '｜Wiki — CHROMA';
    var target = section ? document.getElementById(secId(m.id, section)) : null;
    return target;
  }

  function route(initial) {
    var raw = decodeURIComponent(location.hash.slice(1));
    var m = /^(M0[1-8])(?:\/(.+))?$/.exec(raw);
    if (m) {
      var target = render(m[1], m[2]);
      var focusEl = target || document.getElementById('module-title');
      if (!initial || raw) {
        (target || article).scrollIntoView({ block: 'start' });
        if (!target && focusEl) { focusEl.focus({ preventScroll: true }); }
      }
      return;
    }
    if (initial || !article.firstChild) { render('M01'); }
  }
  window.addEventListener('hashchange', function () { route(false); });

  // Glossary
  var gBody = document.getElementById('glossary-body');
  d.glossary.forEach(function (g) {
    gBody.appendChild(h('tr', { id: 'term-' + (g.en || g.zh).replace(/[^A-Za-z0-9]+/g, '-') },
      h('td', null, g.zh, g.en ? h('span', { class: 'small', lang: 'en' }, ' ' + g.en) : null),
      h('td', null, g.definition),
      h('td', null, g.module ? C.moduleLink(g.module, g.module) : '—'),
      h('td', null, g.sources.map(function (s) { return C.citeLink(s); }))));
  });

  // Gaps
  var gaps = document.getElementById('gap-list');
  d.knowledge_gaps.forEach(function (g) { gaps.appendChild(h('li', null, g)); });
  mods.forEach(function (m) {
    var lim = m.sections.filter(function (s) { return s.heading === '適用限制'; })[0];
    if (lim) { gaps.appendChild(h('li', null, C.moduleLink(m.id, m.id), '｜', blockText(lim.blocks).replace(/\[S\d{3}\]/g, '').trim())); }
  });

  // Prerequisite graph (longest-path levels, left → right)
  (function () {
    var level = {};
    function lv(id) {
      if (level[id] !== undefined) { return level[id]; }
      var m = C.module(id);
      level[id] = m.prerequisites.length ? 1 + Math.max.apply(null, m.prerequisites.map(lv)) : 0;
      return level[id];
    }
    mods.forEach(function (m) { lv(m.id); });
    var cols = {};
    mods.forEach(function (m) { (cols[level[m.id]] = cols[level[m.id]] || []).push(m.id); });
    var nCols = Object.keys(cols).length, maxRows = Math.max.apply(null, Object.keys(cols).map(function (k) { return cols[k].length; }));
    var W = 128, H = 58, gx = 52, gy = 28, pad = 16;
    var width = pad * 2 + nCols * W + (nCols - 1) * gx, height = pad * 2 + maxRows * H + (maxRows - 1) * gy;
    var pos = {};
    Object.keys(cols).forEach(function (k) {
      var list = cols[k], colH = list.length * H + (list.length - 1) * gy, top = (height - colH) / 2;
      list.forEach(function (id, i) { pos[id] = { x: pad + Number(k) * (W + gx), y: top + i * (H + gy) }; });
    });
    var root = S('svg', { viewBox: '0 0 ' + width + ' ' + height, role: 'group', 'aria-label': '模組前置知識關係圖' },
      S('defs', null, S('marker', { id: 'pq-arrow', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' },
        S('path', { d: 'M0 0 L10 5 L0 10 Z', fill: '#202020' }))));
    var list = document.getElementById('prereq-list');
    mods.forEach(function (m) {
      m.prerequisites.forEach(function (p) {
        var a = pos[p], b = pos[m.id];
        var x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x - 2, y2 = b.y + H / 2, mx = (x1 + x2) / 2;
        root.appendChild(S('path', { d: 'M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2,
          fill: 'none', stroke: '#202020', 'stroke-width': '1.4', 'marker-end': 'url(#pq-arrow)', opacity: '0.75' }));
      });
      list.appendChild(h('li', null, m.id + ' ' + m.title + '：前置 ' + (m.prerequisites.join('、') || '無')));
    });
    // Label fills use verified pairs: white on #B5321F / #2855AA / #202020, ink on #F4C846.
    var fills = ['#B5321F', '#2855AA', '#F4C846', '#202020'];
    mods.forEach(function (m) {
      var p = pos[m.id], fill = fills[level[m.id] % fills.length];
      var textFill = (fill === '#F4C846') ? '#202020' : '#FFFFFF';
      var a = S('a', { href: '#' + m.id, 'aria-label': m.id + ' ' + m.title },
        S('rect', { x: p.x, y: p.y, width: W, height: H, fill: '#FBFAF6', stroke: '#202020', 'stroke-width': '2' }),
        S('rect', { x: p.x, y: p.y, width: '40', height: H, fill: fill }),
        S('text', { x: p.x + 20, y: p.y + H / 2 + 5, 'text-anchor': 'middle', 'font-size': '13', 'font-weight': '800', fill: textFill, 'font-family': 'Helvetica, Arial, sans-serif' }, m.id),
        S('text', { x: p.x + 48, y: p.y + H / 2 + 5, 'font-size': '12.5', 'font-weight': '700', fill: '#202020' }, m.title.length > 6 ? m.title.slice(0, 6) + '…' : m.title));
      root.appendChild(a);
    });
    document.getElementById('prereq-graph').appendChild(root);
  })();

  // Search
  var index = [];
  mods.forEach(function (m) {
    index.push({ mid: m.id, section: null, label: m.id + ' ' + m.title + ' ' + m.title_en, text: m.title + ' ' + m.title_en });
    m.sections.forEach(function (s) {
      if (s.heading === '參考來源' || s.heading === '相關知識') { return; }
      index.push({ mid: m.id, section: s.heading, label: m.id + ' · ' + s.heading, text: blockText(s.blocks) });
    });
  });
  d.glossary.forEach(function (g) {
    index.push({ mid: g.module, section: null, glossary: true, label: '詞彙 · ' + g.term, text: g.term + ' ' + g.definition });
  });
  var input = document.getElementById('wiki-search'), results = document.getElementById('search-results'),
    wrap = document.getElementById('search-results-wrap'), count = document.getElementById('search-count');

  function snippet(text, q) {
    var i = text.toLowerCase().indexOf(q), start = Math.max(0, i - 24), end = Math.min(text.length, i + q.length + 40);
    var frag = h('span', { class: 'small' });
    frag.appendChild(document.createTextNode((start > 0 ? '…' : '') + text.slice(start, i)));
    frag.appendChild(h('mark', null, text.slice(i, i + q.length)));
    frag.appendChild(document.createTextNode(text.slice(i + q.length, end) + (end < text.length ? '…' : '')));
    return frag;
  }
  function search() {
    var q = input.value.trim().toLowerCase();
    C.clear(results);
    if (q.length < 1) { wrap.hidden = true; return; }
    var hits = index.filter(function (e) { return e.text.toLowerCase().indexOf(q) >= 0 || e.label.toLowerCase().indexOf(q) >= 0; }).slice(0, 40);
    wrap.hidden = false;
    count.textContent = hits.length ? '找到 ' + hits.length + ' 筆' : '沒有符合「' + input.value.trim() + '」的結果';
    hits.forEach(function (e) {
      var href = e.glossary ? '#glossary' : '#' + e.mid + (e.section ? '/' + encodeURIComponent(e.section) : '');
      var src = e.text.toLowerCase().indexOf(q) >= 0 ? e.text : e.label;
      results.appendChild(h('li', null, h('a', { href: href }, e.label), h('br'), snippet(src, q)));
    });
  }
  input.addEventListener('input', search);

  route(true);
})();
