/*
 * CHROMA Workflow page. Renders workflow/*.md records (plain text from the data file) with a
 * tiny safe Markdown subset, and draws Mermaid flowcharts as original SVG (layered layout,
 * back edges routed on the right). No external libraries, no innerHTML.
 */
(function () {
  'use strict';
  var C = window.Chroma, h = C.h, S = C.svg, d = C.data();
  if (!d) { return; }
  var W = d.workflow;

  /* ---------- Markdown subset ---------- */
  function inlineMd(text) {
    var frag = document.createDocumentFragment();
    var re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|\[(S\d{3})\]/g, pos = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > pos) { frag.appendChild(document.createTextNode(text.slice(pos, m.index))); }
      if (m[1] !== undefined) { frag.appendChild(h('code', null, m[1])); }
      else if (m[2] !== undefined) { frag.appendChild(h('strong', null, m[2])); }
      else if (m[3] !== undefined) {
        frag.appendChild(/^https:\/\//.test(m[4]) ? h('a', { href: m[4], rel: 'noopener noreferrer' }, m[3]) : h('span', null, m[3]));
      } else if (m[5]) { frag.appendChild(C.citeLink(m[5])); }
      pos = re.lastIndex;
    }
    if (pos < text.length) { frag.appendChild(document.createTextNode(text.slice(pos))); }
    return frag;
  }
  function md(text) {
    var root = h('div', { class: 'md' }), lines = (text || '').split('\n'), i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (/^```/.test(line)) {
        var buf = []; i += 1;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i += 1; }
        root.appendChild(h('pre', { tabindex: '0' }, h('code', null, buf.join('\n'))));
        i += 1; continue;
      }
      if (/^\|/.test(line.trim())) {
        var rows = [];
        while (i < lines.length && /^\|/.test(lines[i].trim())) { rows.push(lines[i].trim()); i += 1; }
        var cells = rows.map(function (r) { return r.replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); }); });
        var body = cells.filter(function (c, k) { return !(k === 1 && c.every(function (x) { return /^:?-+:?$/.test(x); })); });
        var table = h('table', null, h('thead', null, h('tr', null, body[0].map(function (c) { return h('th', { scope: 'col' }, inlineMd(c)); }))),
          h('tbody', null, body.slice(1).map(function (r) { return h('tr', null, r.map(function (c) { return h('td', null, pill(c)); })); })));
        root.appendChild(h('div', { style: 'overflow-x:auto' }, table));
        continue;
      }
      var hm = /^(#{1,4})\s+(.*)$/.exec(line);
      if (hm) { root.appendChild(h(hm[1].length <= 2 ? 'h3' : 'h4', null, inlineMd(hm[2]))); i += 1; continue; }
      if (/^\s*- /.test(line)) {
        var ul = h('ul');
        while (i < lines.length && /^\s*- /.test(lines[i])) {
          var item = lines[i].replace(/^\s*- /, ''), box = /^\[( |x)\]\s*/.exec(item);
          ul.appendChild(h('li', null, box ? (box[1] === 'x' ? '☑ ' : '☐ ') : null, inlineMd(box ? item.slice(box[0].length) : item)));
          i += 1;
        }
        root.appendChild(ul); continue;
      }
      if (!line.trim()) { i += 1; continue; }
      var para = [];
      while (i < lines.length && lines[i].trim() && !/^(```|\||#{1,4}\s|\s*- )/.test(lines[i])) { para.push(lines[i]); i += 1; }
      root.appendChild(h('p', null, inlineMd(para.join(' '))));
    }
    return root;
  }
  function pill(text) {
    var m = /^(NOT_RUN|PASS|FAIL|BLOCKED|SKIPPED)\b(.*)$/.exec(text);
    if (!m) { return inlineMd(text); }
    return h('span', null, h('span', { class: 'status-pill', 'data-s': m[1] }, m[1]), inlineMd(m[2]));
  }

  function doc(key) { return W.docs[key]; }
  function fullText(key) {
    var dd = doc(key);
    return [dd.intro].concat(dd.sections.map(function (s) { return '## ' + s.heading + '\n' + s.text; })).join('\n\n');
  }
  function record(title, text, open) {
    return h('details', { class: 'record', open: open ? '' : null }, h('summary', null, title), h('div', { class: 'record-body' }, md(text)));
  }

  /* ---------- Graph renderer ---------- */
  function layout(g) {
    var ids = g.nodes.map(function (n) { return n.id; }), out = {}, onStack = {}, seen = {}, back = [];
    ids.forEach(function (id) { out[id] = []; });
    g.edges.forEach(function (e, k) { out[e.from].push(k); });
    function dfs(u) {
      seen[u] = true; onStack[u] = true;
      out[u].forEach(function (k) {
        var v = g.edges[k].to;
        if (onStack[v]) { back[k] = true; } else if (!seen[v]) { dfs(v); }
      });
      onStack[u] = false;
    }
    ids.forEach(function (id) { if (!seen[id]) { dfs(id); } });
    var level = {}, indeg = {};
    ids.forEach(function (id) { level[id] = 0; indeg[id] = 0; });
    g.edges.forEach(function (e, k) { if (!back[k]) { indeg[e.to] += 1; } });
    var queue = ids.filter(function (id) { return indeg[id] === 0; });
    while (queue.length) {
      var u = queue.shift();
      out[u].forEach(function (k) {
        if (back[k]) { return; }
        var v = g.edges[k].to;
        level[v] = Math.max(level[v], level[u] + 1);
        indeg[v] -= 1;
        if (indeg[v] === 0) { queue.push(v); }
      });
    }
    return { level: level, back: back };
  }

  function nodeWidth(label) {
    var w = 0;
    for (var i = 0; i < label.length; i += 1) { w += label.charCodeAt(i) > 255 ? 13.5 : 7.4; }
    return Math.max(92, Math.min(230, Math.round(w + 30)));
  }

  function drawGraph(g, title) {
    var L = layout(g), rows = {};
    g.nodes.forEach(function (n) { (rows[L.level[n.id]] = rows[L.level[n.id]] || []).push(n); });
    var rowKeys = Object.keys(rows).map(Number).sort(function (a, b) { return a - b; });
    var NH = 40, GY = 46, GX = 26, PAD = 20;
    var rowW = rowKeys.map(function (k) { return rows[k].reduce(function (s, n) { return s + nodeWidth(n.label); }, 0) + (rows[k].length - 1) * GX; });
    var contentW = Math.max.apply(null, rowW) + PAD * 2;
    var backCount = L.back.filter(Boolean).length;
    var width = contentW + 40 + backCount * 14, height = PAD * 2 + rowKeys.length * NH + (rowKeys.length - 1) * GY;
    var pos = {}, rowOf = {};
    rowKeys.forEach(function (k, ri) { rows[k].forEach(function (n) { rowOf[n.id] = ri; }); });
    // ERR-007: forward edges spanning several rows use a left lane instead of crossing nodes.
    var isLong = g.edges.map(function (e, k) { return !L.back[k] && rowOf[e.to] - rowOf[e.from] > 1; });
    var LEFT = isLong.some(Boolean) ? 24 + isLong.filter(Boolean).length * 14 : 0;
    contentW += LEFT;
    width += LEFT;
    rowKeys.forEach(function (k, ri) {
      var x = LEFT + (contentW - LEFT - rowW[ri]) / 2, y = PAD + ri * (NH + GY);
      rows[k].forEach(function (n) { var w = nodeWidth(n.label); pos[n.id] = { x: x, y: y, w: w }; x += w + GX; });
    });
    var labelledOut = {};
    g.edges.forEach(function (e, k) { if (!L.back[k] && e.label) { labelledOut[e.from] = (labelledOut[e.from] || 0) + 1; } });
    function rightNeighbour(id) {
      return g.nodes.some(function (n) { return n.id !== id && rowOf[n.id] === rowOf[id] && pos[n.id].x > pos[id].x; });
    }
    var mid = 'arr-' + Math.random().toString(36).slice(2, 7);
    var svg = S('svg', { viewBox: '0 0 ' + width + ' ' + height, role: 'img', 'aria-label': title + '（' + g.nodes.length + ' 個節點、' + g.edges.length + ' 條連線，文字版見下方）' },
      S('defs', null,
        S('marker', { id: mid, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, S('path', { d: 'M0 0 L10 5 L0 10 Z', fill: '#202020' })),
        S('marker', { id: mid + 'b', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, S('path', { d: 'M0 0 L10 5 L0 10 Z', fill: '#B5321F' }))));
    var labels = S('g');
    var lane = 0, leftLane = 0, backLabelN = {};
    g.edges.forEach(function (e, k) {
      var a = pos[e.from], b = pos[e.to], path, lx, ly, stackDir = 1;
      if (L.back[k]) {
        var laneX = contentW + 12 + lane * 14; lane += 1;
        var sx = a.x + a.w, sy = a.y + NH / 2 + 6, tx = b.x + b.w + 2, ty = b.y + NH / 2 - 6;
        if (rightNeighbour(e.from)) {
          // ERR-007: leave from the bottom so the segment does not cross a node in the same row.
          var bx = a.x + a.w / 2 + 10, by = a.y + NH + 12;
          path = 'M' + bx + ' ' + (a.y + NH) + ' V' + by + ' H' + laneX + ' V' + ty + ' H' + tx;
          lx = a.x + a.w + 6; ly = by + 14;
        } else {
          path = 'M' + sx + ' ' + sy + ' H' + laneX + ' V' + ty + ' H' + tx;
          lx = sx + 6; ly = sy + 13; stackDir = -1;
        }
        svg.appendChild(S('path', { d: path, class: 'g-edge', 'data-from': e.from, 'data-to': e.to, fill: 'none', stroke: '#B5321F', 'stroke-width': '1.6', 'stroke-dasharray': '5 4', 'marker-end': 'url(#' + mid + 'b)' }));
      } else if (isLong[k]) {
        var lxl = 12 + leftLane * 14; leftLane += 1;
        var fy = a.y + NH / 2 + 6, ty2 = b.y + NH / 2;
        path = 'M' + a.x + ' ' + fy + ' H' + lxl + ' V' + ty2 + ' H' + (b.x - 2);
        svg.appendChild(S('path', { d: path, class: 'g-edge', 'data-from': e.from, 'data-to': e.to, fill: 'none', stroke: '#202020', 'stroke-width': '1.6', 'marker-end': 'url(#' + mid + ')' }));
        lx = lxl + 6; ly = fy + 17;
      } else {
        var x1 = a.x + a.w / 2, y1 = a.y + NH, x2 = b.x + b.w / 2, y2 = b.y - 2, dy = (y2 - y1) / 2;
        path = 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + (y1 + dy) + ' ' + x2 + ' ' + (y2 - dy) + ' ' + x2 + ' ' + y2;
        svg.appendChild(S('path', { d: path, class: 'g-edge', 'data-from': e.from, 'data-to': e.to, fill: 'none', stroke: '#202020', 'stroke-width': '1.6', 'marker-end': 'url(#' + mid + ')' }));
        if (e.label && labelledOut[e.from] > 1) {
          // ERR-007: sibling labels sit near their own targets (bezier t = 0.75) instead of overlapping.
          var tt = 0.75, s3 = 3 * tt * tt - 2 * tt * tt * tt;
          lx = x1 + (x2 - x1) * s3 + 4; ly = y1 + (y2 - y1) * (0.5 * s3 + 0.5 * tt) + 4;
        } else {
          lx = (x1 + x2) / 2 + 4; ly = (y1 + y2) / 2 + 4;
        }
      }
      if (e.label && L.back[k]) {
        // ERR-007: several feedback labels from one node are stacked instead of drawn on the same spot.
        var nb = backLabelN[e.from] || 0; backLabelN[e.from] = nb + 1; ly += stackDir * nb * 19;
      }
      if (e.label) {
        var lw = 0;
        for (var ci = 0; ci < e.label.length; ci += 1) { lw += e.label.charCodeAt(ci) > 255 ? 12 : 6.6; }
        lw = Math.round(lw + 10);
        labels.appendChild(S('rect', { class: 'g-label', x: lx - 3, y: ly - 12, width: lw, height: 17, fill: '#FBFAF6', stroke: L.back[k] ? '#B5321F' : '#202020', 'stroke-width': '0.8' }));
        labels.appendChild(S('text', { x: lx + 2, y: ly + 1, 'font-size': '11.5', fill: L.back[k] ? '#B5321F' : '#202020', 'font-weight': '700' }, e.label));
      }
    });
    g.nodes.forEach(function (n) {
      var p = pos[n.id], shape;
      if (n.shape === 'decision') {
        var c = 12;
        shape = S('polygon', { points: [p.x + c, p.y, p.x + p.w - c, p.y, p.x + p.w, p.y + NH / 2, p.x + p.w - c, p.y + NH, p.x + c, p.y + NH, p.x, p.y + NH / 2].join(' '),
          fill: '#F4C846', stroke: '#202020', 'stroke-width': '2', class: 'g-node', 'data-id': n.id });
      } else {
        shape = S('rect', { x: p.x, y: p.y, width: p.w, height: NH, fill: '#FFFFFF', stroke: '#202020', 'stroke-width': '2', class: 'g-node', 'data-id': n.id });
      }
      svg.appendChild(shape);
      svg.appendChild(S('text', { x: p.x + p.w / 2, y: p.y + NH / 2 + 5, 'text-anchor': 'middle', 'font-size': '13', 'font-weight': '700', fill: '#202020' }, n.label));
    });
    svg.appendChild(labels);
    var byId = {};
    g.nodes.forEach(function (n) { byId[n.id] = n.label; });
    var textList = h('ol', { class: 'small' }, g.edges.map(function (e, k) {
      return h('li', null, byId[e.from] + ' → ' + byId[e.to] + (e.label ? '（' + e.label + '）' : '') + (L.back[k] ? '　↺ 回饋迴圈' : ''));
    }));
    return h('figure', { class: 'graph-figure' },
      h('figcaption', null, title),
      h('div', { class: 'graph-scroll', tabindex: '0', 'aria-label': title + ' 圖形（可捲動）' }, svg),
      h('div', { class: 'graph-legend' },
        h('span', null, h('span', { class: 'legend-line', 'aria-hidden': 'true' }), '前進流程'),
        h('span', null, h('span', { class: 'legend-line back', 'aria-hidden': 'true' }), '回饋／修正迴圈（虛線）'),
        h('span', null, '黃色六角形＝判斷節點；白色方框＝執行節點')),
      h('details', { class: 'record' }, h('summary', null, '文字版連線與 Mermaid 原始碼'),
        h('div', { class: 'record-body' }, textList, h('pre', { class: 'md', tabindex: '0' }, h('code', null, 'flowchart TD\n' + g.source.replace(/^flowchart TD\n?/, ''))))));
  }

  function afterCode(key) {
    var t = fullText(key).replace(/```mermaid[\s\S]*?```/g, '').trim();
    return t;
  }

  var v1 = document.getElementById('graph-v1');
  v1.appendChild(drawGraph(W.graph_v1[0], 'Graph V1（規劃版，保留歷史）'));
  v1.appendChild(md(afterCode('graph_v1').replace(/^# .*\n?/, '')));
  var v2 = document.getElementById('graph-v2');
  v2.appendChild(drawGraph(W.graph_v2[0], 'Graph V2（依 ERR-001／ERR-002 改進）'));
  var v2text = fullText('graph_v2');
  var parts = v2text.split('## Phase 4 子流程');
  v2.appendChild(md(parts[0].replace(/```mermaid[\s\S]*?```/g, '').replace(/^# .*\n?/, '').replace(/\|[\s\S]*?\n\n/, '').trim()));
  if (W.graph_v2[1]) {
    document.getElementById('graph-v2-sub').appendChild(drawGraph(W.graph_v2[1], 'Graph V2 · Phase 4 子流程（知識補充迴圈）'));
    if (parts[1]) { document.getElementById('graph-v2-sub').appendChild(md(parts[1].replace(/（已執行一次）/, '').replace(/```mermaid[\s\S]*?```/g, '').trim())); }
  }
  if (W.graph_v3 && W.graph_v3[0]) {
    var v3 = document.getElementById('graph-v3');
    v3.appendChild(drawGraph(W.graph_v3[0], 'Graph V3（依 ERR-003～ERR-006 改進，Phase 6）'));
    v3.appendChild(md(afterCode('graph_v3').replace(/^# .*\n?/, '')));
  }
  var tableMatch = /(\| 改進[\s\S]*?)(\n\n|$)/.exec(v2text);
  document.getElementById('shift-table').appendChild(md(tableMatch ? tableMatch[1] : ''));

  var ex = doc('execution_log'), exBox = document.getElementById('exec-log');
  if (ex.intro) { exBox.appendChild(md(ex.intro.replace(/^# .*\n?/, ''))); }
  ex.sections.forEach(function (s, i) { exBox.appendChild(record(s.heading, s.text, i === ex.sections.length - 1)); });

  var er = doc('error_log'), erBox = document.getElementById('error-log');
  if (er.intro) { erBox.appendChild(md(er.intro.replace(/^# .*\n?/, ''))); }
  er.sections.forEach(function (s) { erBox.appendChild(record(s.heading, s.text, true)); });
  document.getElementById('err-002').appendChild(record('ERR-002 詳細報告（workflow/ERR-002.md）', fullText('err_002').replace(/^## .*\n/, ''), false));

  document.getElementById('test-plan').appendChild(h('h3', null, '預定與實際測試（tests/test-plan.md）'));
  document.getElementById('test-plan').appendChild(md(fullText('test_plan').replace(/^# .*\n?/, '')));
  document.getElementById('browser-checklist').appendChild(h('h3', null, '瀏覽器驗收（tests/browser-checklist.md）'));
  document.getElementById('browser-checklist').appendChild(md(fullText('browser_checklist').replace(/^# .*\n?/, '')));
  document.getElementById('validation-rules').appendChild(record('驗證規則（workflow/validation-rules.md）', fullText('validation_rules').replace(/^# .*\n?/, ''), false));

  var dec = doc('decisions'), decBox = document.getElementById('decision-log');
  dec.sections.forEach(function (s) { decBox.appendChild(record(s.heading, s.text, false)); });
  var rv = document.getElementById('reviews');
  rv.appendChild(record('反思（workflow/reflection.md）', fullText('reflection').replace(/^# .*\n?/, ''), true));
  rv.appendChild(record('Phase 3 知識語意審查（workflow/knowledge-review.md）', fullText('knowledge_review').replace(/^# .*\n?/, ''), false));
  rv.appendChild(record('Phase 4 教材語意審查（workflow/content-review.md）', fullText('content_review').replace(/^# .*\n?/, ''), false));
})();
