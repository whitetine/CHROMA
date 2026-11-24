/*
 * CHROMA Learn deck. Renders the 14 reviewed slides from content/slides.json (via the
 * generated data file) one page at a time, with keyboard, hash, chapter menu, fullscreen
 * and touch navigation. Interactions are mounted lazily from lab.js.
 */
(function () {
  'use strict';
  var C = window.Chroma, h = C.h, d = C.data();
  if (!d) { return; }
  var slides = d.slides, chapters = d.chapters, total = slides.length;
  var stage = document.getElementById('deck-stage');
  var deck = document.getElementById('deck');
  var els = [], mounted = {}, current = -1;

  var INTERACTION_NAMES = {
    'hsl': 'HSL 三要素調色器', 'wheel': 'RYB／HSL 色輪比較', 'harmony': '六種配色產生器', 'contrast-check': 'WCAG 對比度檢查器',
    'rgb': 'RGB 混色實驗', 'contrast-illusion': '同時對比實驗', 'ratio': '60-30-10 比例實驗', 'design-compare': '視覺設計前後對照',
    'association': '色彩情緒聯想實驗', 'design-lab': '自由配色設計實驗室', 'quiz': '學習成果測驗'
  };
  var KIND = { knowledge: '知識 Knowledge', project_rule: 'CHROMA 專案規則', original_example: '原創示例' };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function chapterOf(s) { return chapters.filter(function (c) { return c.id === s.chapter; })[0]; }

  function sectionLink(mid, section) {
    var m = C.module(mid);
    return h('a', { class: 'mod-link', href: 'wiki.html#' + mid + '/' + encodeURIComponent(section) }, mid + (m ? ' ' + m.title : '') + '｜' + section);
  }

  function refsBlock(s) {
    var box = h('footer', { class: 'slide-refs' });
    if (s.wiki_refs.length) {
      box.appendChild(h('h3', null, '相關 Wiki'));
      box.appendChild(h('ul', { class: 'chips' }, s.wiki_refs.map(function (mid) {
        var m = C.module(mid);
        return h('li', null, h('a', { class: 'chip', href: 'wiki.html#' + mid }, mid + ' ' + (m ? m.title : '')));
      })));
    }
    box.appendChild(h('h3', null, '來源引用'));
    if (s.source_refs.length) {
      box.appendChild(h('ul', null, s.source_refs.map(function (sid) {
        var src = C.source(sid);
        return h('li', null, C.citeLink(sid), ' ', src ? src.title + '（' + src.organization + '）' : '');
      })));
    } else {
      box.appendChild(h('p', { class: 'muted' }, '本頁無外部來源事實敘述；內容屬 CHROMA 專案規則或課程導覽。'));
    }
    return box;
  }

  function coverArt() {
    var S = C.svg;
    return S('svg', { viewBox: '0 0 400 400', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true', focusable: 'false' },
      S('rect', { width: '400', height: '400', fill: '#FBFAF6' }),
      S('circle', { cx: '250', cy: '140', r: '100', fill: '#E64C37' }),
      S('rect', { x: '60', y: '170', width: '170', height: '170', fill: '#2855AA' }),
      S('path', { d: 'M190 360 L290 200 L390 360 Z', fill: '#F4C846', stroke: '#202020', 'stroke-width': '3' }),
      S('line', { x1: '0', y1: '372', x2: '400', y2: '372', stroke: '#202020', 'stroke-width': '3' }));
  }

  function renderCover(s, i) {
    var sec = h('section', { class: 'slide slide-cover', id: 'slide-' + s.slide_id, 'data-slide': s.slide_id, 'aria-roledescription': '投影片', 'aria-label': pad(i + 1) + ' / ' + total + '：' + s.title, hidden: '' });
    var text = h('div', { class: 'slide-text' },
      h('div', { class: 'slide-num' }, h('span', { class: 'big' }, pad(i + 1)), h('span', { class: 'of' }, '/ ' + total + ' · ' + chapterOf(s).no + ' ' + chapterOf(s).title)),
      h('p', { class: 'eyebrow', lang: 'en' }, 'The Science and Art of Color'),
      h('h2', { class: 'cover-title', tabindex: '-1' }, 'CHROMA', h('span', { class: 'dot' }, '.')),
      h('p', { class: 'lead' }, s.title.replace('CHROMA — ', '') + '：' + s.example),
      h('p', { class: 'objective' }, h('span', { class: 'label' }, '學習目標 Objective'), s.objective),
      h('ol', { class: 'path-list', 'aria-label': '課程路徑' }, chapters.map(function (c) {
        var first = slides.map(function (x) { return x.slide_id; }).indexOf(c.slides[0]);
        return h('li', null, h('span', { class: 'mono' }, c.no), h('a', { href: '#' + c.slides[0], 'data-goto': String(first) }, c.title + '　' + c.title_zh),
          h('span', { class: 'small mono' }, c.slides[0] + '–' + c.slides[c.slides.length - 1]));
      })),
      h('dl', { class: 'keys' },
        h('dt', null, '← →'), h('dd', null, '上一頁／下一頁（或按畫面上的按鈕、手機左右滑動）'),
        h('dt', null, 'Home End'), h('dd', null, '第一頁／最後一頁'),
        h('dt', null, 'F'), h('dd', null, '全螢幕；Esc 退出'),
        h('dt', null, '☰'), h('dd', null, '章節選單，可直接跳至任一頁')),
      refsBlock(s));
    sec.appendChild(text);
    sec.appendChild(h('div', { class: 'cover-art' }, coverArt()));
    return sec;
  }

  function renderSlide(s, i) {
    if (!s.interaction && i === 0) { return renderCover(s, i); }
    var ch = chapterOf(s);
    var sec = h('section', { class: 'slide', id: 'slide-' + s.slide_id, 'data-slide': s.slide_id, 'aria-roledescription': '投影片', 'aria-label': pad(i + 1) + ' / ' + total + '：' + s.title, hidden: '' });
    var claims = h('ul', { class: 'claims' }, s.claims.map(function (c) {
      var ref = h('div', { class: 'claim-ref' }, h('span', { class: 'tag' + (c.kind !== 'knowledge' ? ' tag-rule' : '') }, KIND[c.kind] || c.kind), sectionLink(c.wiki_ref, c.section));
      c.source_refs.forEach(function (sid) { ref.appendChild(C.citeLink(sid)); });
      return h('li', null, h('p', { class: 'claim-text' }, c.text), ref);
    }));
    var text = h('div', { class: 'slide-text' },
      h('div', { class: 'slide-num' }, h('span', { class: 'big' }, pad(i + 1)), h('span', { class: 'of' }, '/ ' + total)),
      h('p', { class: 'slide-chapter' }, ch.no + ' ' + ch.title + '　' + ch.title_zh + ' · ' + s.slide_id),
      h('h2', { tabindex: '-1' }, s.title),
      h('p', { class: 'objective' }, h('span', { class: 'label' }, '學習目標 Objective'), s.objective),
      claims,
      h('div', { class: 'example' }, h('p', { class: 'label' }, '範例 Example'), h('p', null, s.example)),
      refsBlock(s));
    var widget = h('div', { class: 'slide-widget', 'data-interaction': s.interaction || '' });
    var stageCol = h('div', { class: 'slide-stage' },
      h('div', { class: 'stage-label small' }, h('strong', null, 'INTERACTION · ' + (INTERACTION_NAMES[s.interaction] || '—')),
        h('a', { href: 'lab.html#' + s.interaction }, '在實驗室開啟 →')),
      widget);
    sec.appendChild(text);
    sec.appendChild(stageCol);
    return sec;
  }

  slides.forEach(function (s, i) { var el = renderSlide(s, i); els.push(el); stage.appendChild(el); });

  // Chapter menu + jump select
  var panel = document.getElementById('chapter-panel'), chBtn = document.getElementById('chapter-btn');
  var jump = document.getElementById('jump-select');
  panel.appendChild(h('ol', null, chapters.map(function (c) {
    return h('li', null, h('span', { class: 'ch-title' }, h('span', { class: 'mono' }, c.no), c.title, h('span', { class: 'small' }, c.title_zh)),
      h('ol', null, c.slides.map(function (sid) {
        var idx = slides.map(function (x) { return x.slide_id; }).indexOf(sid);
        return h('li', null, h('a', { href: '#' + sid, 'data-goto': String(idx), title: slides[idx].title }, pad(idx + 1) + ' ' + slides[idx].title));
      })));
  })));
  slides.forEach(function (s, i) { jump.appendChild(h('option', { value: String(i) }, pad(i + 1) + ' ' + s.title)); });

  function closeMenu(focusBtn) {
    panel.hidden = true; chBtn.setAttribute('aria-expanded', 'false');
    if (focusBtn) { chBtn.focus(); }
  }
  chBtn.addEventListener('click', function () {
    var open = panel.hidden;
    panel.hidden = !open; chBtn.setAttribute('aria-expanded', String(open));
    if (open) { var a = panel.querySelector('[aria-current="step"]') || panel.querySelector('a'); if (a) { a.focus(); } }
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-goto]');
    if (a) { e.preventDefault(); closeMenu(false); go(Number(a.getAttribute('data-goto')), { focus: true }); return; }
    if (!panel.hidden && !e.target.closest('.chapter-menu')) { closeMenu(false); }
  });
  jump.addEventListener('change', function () { go(Number(jump.value), { focus: false }); });

  var prev = document.getElementById('prev-btn'), next = document.getElementById('next-btn');
  prev.addEventListener('click', function () { go(current - 1); });
  next.addEventListener('click', function () { go(current + 1); });

  function mountWidget(i) {
    var s = slides[i];
    if (!s.interaction || mounted[i]) { return; }
    var box = els[i].querySelector('.slide-widget');
    try { window.ChromaLab.mount(s.interaction, box, { compact: true }); mounted[i] = true; }
    catch (err) { box.appendChild(h('p', { class: 'notice', role: 'alert' }, '互動元件載入失敗：' + err.message)); }
  }

  function go(i, opts) {
    opts = opts || {};
    if (isNaN(i)) { return; }
    i = Math.max(0, Math.min(total - 1, i));
    if (i === current && !opts.force) { return; }
    var dir = i < current ? 'from-left' : '';
    if (current >= 0) { els[current].hidden = true; }
    var el = els[i];
    el.hidden = false;
    el.classList.remove('is-entering', 'from-left');
    if (!C.reducedMotion() && current >= 0) {
      void el.offsetWidth;
      el.classList.add('is-entering');
      if (dir) { el.classList.add(dir); }
    }
    current = i;
    mountWidget(i);
    var s = slides[i], ch = chapterOf(s);
    document.getElementById('deck-count').textContent = pad(i + 1) + ' / ' + total;
    document.getElementById('progress-chapter').textContent = ch.no + ' ' + ch.title + ' · ' + s.slide_id;
    var prog = document.getElementById('progress');
    prog.setAttribute('aria-valuenow', String(i + 1));
    prog.setAttribute('aria-valuetext', '第 ' + (i + 1) + ' 頁，共 ' + total + ' 頁');
    document.getElementById('progress-fill').style.width = ((i + 1) / total * 100).toFixed(2) + '%';
    prev.disabled = i === 0; next.disabled = i === total - 1;
    jump.value = String(i);
    panel.querySelectorAll('[data-goto]').forEach(function (a) {
      if (Number(a.getAttribute('data-goto')) === i) { a.setAttribute('aria-current', 'step'); } else { a.removeAttribute('aria-current'); }
    });
    document.getElementById('deck-status').textContent = '第 ' + (i + 1) + ' 頁，共 ' + total + ' 頁：' + s.title;
    document.title = pad(i + 1) + ' ' + s.title + '｜Learn — CHROMA';
    if (location.hash !== '#' + s.slide_id) { history.replaceState(null, '', '#' + s.slide_id); }
    deck.setAttribute('data-current', s.slide_id);
    if (opts.focus) { var hd = el.querySelector('h2'); if (hd) { hd.focus({ preventScroll: true }); } }
    if (!opts.keepScroll && window.scrollY > deck.offsetTop) { window.scrollTo({ top: Math.max(0, deck.offsetTop - 64), behavior: 'auto' }); }
  }

  function fromHash() {
    var hsh = decodeURIComponent(location.hash.replace('#', '')).toUpperCase();
    var idx = slides.map(function (x) { return x.slide_id; }).indexOf(hsh);
    if (idx < 0 && /^\d{1,2}$/.test(hsh)) { idx = Number(hsh) - 1; }
    return idx >= 0 && idx < total ? idx : 0;
  }
  window.addEventListener('hashchange', function () { go(fromHash(), { keepScroll: true }); });

  // Fullscreen
  var fsBtn = document.getElementById('fs-btn');
  var fsSupported = !!(deck.requestFullscreen && document.exitFullscreen);
  function fsLabel() {
    var on = document.fullscreenElement === deck;
    fsBtn.setAttribute('aria-pressed', String(on));
    fsBtn.lastChild.textContent = on ? '退出全螢幕' : '全螢幕';
    fsBtn.setAttribute('aria-label', on ? '退出全螢幕' : '進入全螢幕');
  }
  function toggleFs() {
    if (!fsSupported) { return; }
    if (document.fullscreenElement) { document.exitFullscreen().catch(function () {}); }
    else { deck.requestFullscreen().catch(function () { document.getElementById('deck-status').textContent = '瀏覽器拒絕全螢幕請求。'; }); }
  }
  if (!fsSupported) { fsBtn.disabled = true; fsBtn.title = '此瀏覽器不支援全螢幕 API'; }
  fsBtn.addEventListener('click', toggleFs);
  document.addEventListener('fullscreenchange', fsLabel);

  // Keyboard: never intercept typing or arrow keys inside form controls.
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) { return; }
    if (C.isEditable(e.target)) { return; }
    if (!panel.hidden && e.key === 'Escape') { closeMenu(true); e.preventDefault(); return; }
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': go(current + 1); break;
      case 'ArrowLeft': case 'PageUp': go(current - 1); break;
      case 'Home': go(0); break;
      case 'End': go(total - 1); break;
      case 'f': case 'F': toggleFs(); break;
      default: return;
    }
    e.preventDefault();
  });

  // Touch swipe (ignored when the gesture starts on a control).
  var t0 = null;
  stage.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1 || C.isEditable(e.target) || (e.target.closest && e.target.closest('.widget'))) { t0 = null; return; }
    t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!t0) { return; }
    var dx = e.changedTouches[0].clientX - t0.x, dy = e.changedTouches[0].clientY - t0.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { go(current + (dx < 0 ? 1 : -1)); }
    t0 = null;
  }, { passive: true });

  window.ChromaDeck = { go: function (i) { go(i); }, current: function () { return current; }, total: total };
  go(fromHash(), { keepScroll: true });
})();
