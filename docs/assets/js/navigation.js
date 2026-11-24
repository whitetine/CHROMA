/*
 * CHROMA shared DOM helpers and site navigation.
 * All dynamic content is created with createElement / textContent. No innerHTML.
 */
(function () {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';

  function append(el, kids) {
    kids.forEach(function (k) {
      if (k === null || k === undefined || k === false) { return; }
      if (Array.isArray(k)) { append(el, k); return; }
      el.appendChild(typeof k === 'object' && k.nodeType ? k : document.createTextNode(String(k)));
    });
    return el;
  }

  function setAttrs(el, attrs) {
    if (!attrs) { return el; }
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) { return; }
      if (k === 'text') { el.textContent = String(v); }
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') { el.addEventListener(k.slice(2), v); }
      else { el.setAttribute(k, v === true ? '' : String(v)); }
    });
    return el;
  }

  function h(tag, attrs) {
    var el = setAttrs(document.createElement(tag), attrs);
    return append(el, Array.prototype.slice.call(arguments, 2));
  }

  function svg(tag, attrs) {
    var el = setAttrs(document.createElementNS(SVGNS, tag), attrs);
    return append(el, Array.prototype.slice.call(arguments, 2));
  }

  function clear(el) { while (el.firstChild) { el.removeChild(el.firstChild); } return el; }

  function data() { return window.CHROMA_DATA || null; }

  function source(id) {
    var d = data();
    return d ? d.sources.filter(function (s) { return s.source_id === id; })[0] : null;
  }

  function module_(id) {
    var d = data();
    return d ? d.modules.filter(function (m) { return m.id === id; })[0] : null;
  }

  function citeLink(id) {
    var s = source(id);
    return h('a', { class: 'cite', href: 'references.html#' + id, title: s ? s.title : id }, '[' + id + ']');
  }

  function moduleLink(id, label) {
    var m = module_(id);
    return h('a', { class: 'mod-link', href: 'wiki.html#' + id }, label || (m ? id + ' ' + m.title : id));
  }

  /** Render safe inline tokens from build_site_data.py. */
  function inline(tokens) {
    var frag = document.createDocumentFragment();
    (tokens || []).forEach(function (t) {
      if (t.t === 'cite') { frag.appendChild(citeLink(t.id)); }
      else if (t.t === 'module') { frag.appendChild(moduleLink(t.id, t.v)); }
      else if (t.t === 'link' && /^https:\/\//.test(t.href)) {
        frag.appendChild(h('a', { href: t.href, rel: 'noopener noreferrer', class: 'ext' }, t.v));
      } else { frag.appendChild(document.createTextNode(t.v || '')); }
    });
    return frag;
  }

  function blocks(list) {
    var frag = document.createDocumentFragment();
    (list || []).forEach(function (b) {
      if (b.type === 'p') { frag.appendChild(h('p', null, inline(b.inline))); }
      else if (b.type === 'ul') {
        frag.appendChild(h('ul', null, b.items.map(function (it) { return h('li', null, inline(it)); })));
      }
    });
    return frag;
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** True when a key event comes from a control that needs arrow keys / typing. */
  function isEditable(target) {
    if (!target || !target.tagName) { return false; }
    var tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable ||
      (target.closest && !!target.closest('[role="slider"], [role="radiogroup"], [role="listbox"], [role="tablist"]'));
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;left:-9999px;top:0' });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { if (document.execCommand('copy')) { resolve(); } else { reject(new Error('copy failed')); } }
      catch (e) { reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }

  function download(filename, text, type) {
    var blob = new Blob([text], { type: (type || 'application/json') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: filename, hidden: '' });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); document.body.removeChild(a); }, 0);
  }

  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.getElementById('site-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        nav.classList.toggle('is-open', !open);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        }
      });
    }
    var page = document.body.getAttribute('data-page');
    document.querySelectorAll('#site-nav a[data-page]').forEach(function (a) {
      if (a.getAttribute('data-page') === page) { a.setAttribute('aria-current', 'page'); }
    });
    if (!data()) {
      var main = document.querySelector('main');
      if (main) {
        main.insertBefore(h('p', { class: 'notice', role: 'alert' },
          '無法載入 assets/data/chroma-data.js。請確認檔案存在或重新執行 python scripts/build_site_data.py。'), main.firstChild);
      }
    }
  }

  window.Chroma = {
    h: h, svg: svg, clear: clear, data: data, source: source, module: module_, citeLink: citeLink,
    moduleLink: moduleLink, inline: inline, blocks: blocks, reducedMotion: reducedMotion,
    isEditable: isEditable, copyText: copyText, download: download
  };

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initNav); }
  else { initNav(); }
})();
