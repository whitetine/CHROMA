/*
 * CHROMA color wheels.
 * - drawHslWheel: digital HSL hue wheel on Canvas (0° red, 180° cyan) [S003].
 * - rybWheel: traditional RYB teaching wheel as static SVG illustration [S001]; swatches
 *   are approximate display colors, not a colorimetric conversion.
 * Requires color-utils.js and navigation.js.
 */
(function () {
  'use strict';
  var CC = window.ChromaColor;

  function prep(canvas) {
    var size = canvas.clientWidth || Number(canvas.getAttribute('width')) || 280;
    var dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(size * dpr)) {
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
    }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, size: size };
  }

  /** Angle 0° at 12 o'clock, clockwise — same convention for both wheels. */
  function point(cx, cy, r, deg) {
    var a = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function drawHslWheel(canvas, opts) {
    opts = opts || {};
    var p = prep(canvas), ctx = p.ctx, size = p.size;
    var cx = size / 2, cy = size / 2, outer = size / 2 - 28, inner = outer * 0.56;
    var s = opts.s === undefined ? 100 : opts.s, l = opts.l === undefined ? 50 : opts.l;
    ctx.clearRect(0, 0, size, size);
    for (var d = 0; d < 360; d += 1) {
      var a0 = (d - 90 - 0.6) * Math.PI / 180, a1 = (d - 90 + 0.6) * Math.PI / 180;
      ctx.beginPath();
      ctx.arc(cx, cy, outer, a0, a1);
      ctx.arc(cx, cy, inner, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = 'hsl(' + d + ',' + s + '%,' + l + '%)';
      ctx.fill();
    }
    ctx.strokeStyle = '#202020';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, outer, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.stroke();
    // degree ticks for 0/90/180/270
    ctx.fillStyle = '#202020';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    [0, 90, 180, 270].forEach(function (deg) {
      var t = point(cx, cy, outer + 14, deg);
      ctx.fillText(deg + '°', t.x, t.y);
    });
    var markers = opts.markers || [];
    if (markers.length > 1) {
      ctx.strokeStyle = '#202020';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      markers.forEach(function (m, i) {
        var q = point(cx, cy, (outer + inner) / 2, m.h);
        if (i === 0) { ctx.moveTo(q.x, q.y); } else { ctx.lineTo(q.x, q.y); }
      });
      if (markers.length > 2) { ctx.closePath(); }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    markers.forEach(function (m, i) {
      var q = point(cx, cy, (outer + inner) / 2, m.h);
      ctx.beginPath();
      ctx.arc(q.x, q.y, i === 0 ? 11 : 8, 0, Math.PI * 2);
      ctx.fillStyle = CC.hslToHex(m.h, s, l);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#202020';
      ctx.stroke();
      if (i === 0) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        var e = point(cx, cy, inner - 4, m.h);
        ctx.lineTo(e.x, e.y);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    ctx.fillStyle = '#202020';
    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillText(opts.centerLabel || 'HSL', cx, cy - 8);
    ctx.font = '500 11px system-ui, sans-serif';
    ctx.fillText(opts.centerSub || '數位色輪', cx, cy + 10);
  }

  function arcPath(cx, cy, r0, r1, d0, d1) {
    var a = point(cx, cy, r1, d0), b = point(cx, cy, r1, d1), c = point(cx, cy, r0, d1), e = point(cx, cy, r0, d0);
    var large = (d1 - d0) > 180 ? 1 : 0;
    return 'M' + a.x.toFixed(2) + ' ' + a.y.toFixed(2) + ' A' + r1 + ' ' + r1 + ' 0 ' + large + ' 1 ' + b.x.toFixed(2) + ' ' + b.y.toFixed(2) +
      ' L' + c.x.toFixed(2) + ' ' + c.y.toFixed(2) + ' A' + r0 + ' ' + r0 + ' 0 ' + large + ' 0 ' + e.x.toFixed(2) + ' ' + e.y.toFixed(2) + ' Z';
  }

  /** Returns { el, update(selectedIndex) }. */
  function rybWheel(opts) {
    opts = opts || {};
    var S = window.Chroma.svg, size = 280, cx = 140, cy = 140, r1 = 126, r0 = 72;
    var root = S('svg', { viewBox: '0 0 ' + size + ' ' + size, class: 'wheel-svg', role: 'img',
      'aria-label': '傳統 RYB 教學色輪示意（12 等分）' });
    var segs = CC.RYB_WHEEL.map(function (c, i) {
      var p = S('path', { d: arcPath(cx, cy, r0, r1, i * 30 - 15, i * 30 + 15), fill: c.hex, stroke: '#202020', 'stroke-width': '1' });
      root.appendChild(p);
      return p;
    });
    var line = S('line', { x1: cx, y1: cy, x2: cx, y2: cy, stroke: '#202020', 'stroke-width': '2', 'stroke-dasharray': '5 4' });
    root.appendChild(line);
    var dotA = S('circle', { r: '10', fill: 'none', stroke: '#202020', 'stroke-width': '3' });
    var dotB = S('circle', { r: '10', fill: 'none', stroke: '#202020', 'stroke-width': '3' });
    root.appendChild(dotA); root.appendChild(dotB);
    root.appendChild(S('circle', { cx: cx, cy: cy, r: r0 - 1, fill: '#F4F1E9' }));
    var t1 = S('text', { x: cx, y: cy - 6, 'text-anchor': 'middle', 'font-size': '13', 'font-weight': '700', fill: '#202020' }, 'RYB');
    var t2 = S('text', { x: cx, y: cy + 12, 'text-anchor': 'middle', 'font-size': '11', fill: '#202020' }, '傳統教學色輪');
    root.appendChild(t1); root.appendChild(t2);
    function update(sel) {
      var i = ((Math.round(sel) % 12) + 12) % 12, j = CC.rybOppositeIndex(i);
      var a = point(cx, cy, (r0 + r1) / 2, i * 30), b = point(cx, cy, (r0 + r1) / 2, j * 30);
      dotA.setAttribute('cx', a.x); dotA.setAttribute('cy', a.y);
      dotB.setAttribute('cx', b.x); dotB.setAttribute('cy', b.y);
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      segs.forEach(function (p, k) { p.setAttribute('stroke-width', k === i || k === j ? '3' : '1'); });
      return { index: i, opposite: j };
    }
    update(opts.selected || 0);
    return { el: root, update: update };
  }

  window.ChromaWheel = { drawHslWheel: drawHslWheel, rybWheel: rybWheel, point: point };
})();
