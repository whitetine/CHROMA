/*
 * CHROMA shared color math (Phase 5).
 * Single source for hue normalisation, HSL/RGB/HEX conversion, WCAG 2.2 contrast,
 * harmony angles (CHROMA tool settings) and palette export. Works in the browser
 * (window.ChromaColor) and in Node (require) for tests/js.
 * Knowledge basis: M01/M02/M03 [S003], M07 [S009][S010]; harmony angles are project_rule (M03).
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.ChromaColor = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function clamp(v, min, max) {
    var n = Number(v);
    if (!isFinite(n)) { n = min; }
    return Math.min(max, Math.max(min, n));
  }

  /** Hue angle modulo 360 → [0, 360). 390 → 30, -30 → 330. */
  function normalizeHue(h) {
    var n = Number(h);
    if (!isFinite(n)) { return 0; }
    var r = ((n % 360) + 360) % 360;
    return r === 0 ? 0 : r; // avoid -0
  }

  /** HSL (H degrees, S/L percent) → 8-bit sRGB integers (CSS Color 4 algorithm). */
  function hslToRgb(h, s, l) {
    var hh = normalizeHue(h);
    var ss = clamp(s, 0, 100) / 100;
    var ll = clamp(l, 0, 100) / 100;
    function f(n) {
      var k = (n + hh / 30) % 12;
      var a = ss * Math.min(ll, 1 - ll);
      return ll - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    }
    return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
  }

  /** 8-bit RGB → HSL with H in degrees and S/L in percent (unrounded). */
  function rgbToHsl(r, g, b) {
    var rr = clamp(r, 0, 255) / 255, gg = clamp(g, 0, 255) / 255, bb = clamp(b, 0, 255) / 255;
    var max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
    var l = (max + min) / 2, d = max - min, h = 0, s = 0;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === rr) { h = 60 * (((gg - bb) / d) % 6); }
      else if (max === gg) { h = 60 * ((bb - rr) / d + 2); }
      else { h = 60 * ((rr - gg) / d + 4); }
    }
    return { h: normalizeHue(h), s: s * 100, l: l * 100 };
  }

  function toHex2(n) {
    var v = Math.round(clamp(n, 0, 255)).toString(16).toUpperCase();
    return v.length === 1 ? '0' + v : v;
  }

  function rgbToHex(r, g, b) {
    if (typeof r === 'object' && r !== null) { return rgbToHex(r.r, r.g, r.b); }
    return '#' + toHex2(r) + toHex2(g) + toHex2(b);
  }

  var HEX_RE = /^#?([0-9a-fA-F]{6})$/;

  /** Strict opaque #RRGGBB (leading # optional). Returns canonical "#RRGGBB" or null. */
  function normalizeHex(input) {
    if (typeof input !== 'string') { return null; }
    var m = HEX_RE.exec(input.trim());
    return m ? '#' + m[1].toUpperCase() : null;
  }

  function isValidHex(input) { return normalizeHex(input) !== null; }

  /** "#RRGGBB" → {r,g,b} or null when the input is not a valid opaque 6-digit HEX. */
  function hexToRgb(input) {
    var hex = normalizeHex(input);
    if (!hex) { return null; }
    var n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function hslToHex(h, s, l) { return rgbToHex(hslToRgb(h, s, l)); }

  /** sRGB channel linearisation per WCAG 2.2 relative luminance [S009]. */
  function linearize(channel8) {
    var c = clamp(channel8, 0, 255) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance(rgb) {
    return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
  }

  /** Raw (unrounded) contrast ratio between two HEX colors, or null for invalid input [S010]. */
  function contrastRatio(hexA, hexB) {
    var a = hexToRgb(hexA), b = hexToRgb(hexB);
    if (!a || !b) { return null; }
    var la = relativeLuminance(a), lb = relativeLuminance(b);
    var hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  var THRESHOLDS = { normal: { AA: 4.5, AAA: 7 }, large: { AA: 3, AAA: 4.5 } };

  /** Compare the unrounded ratio with WCAG text thresholds. Returns null for null ratio. */
  function wcagTextResult(ratio, textSize) {
    if (ratio === null || ratio === undefined || !isFinite(ratio)) { return null; }
    var t = THRESHOLDS[textSize === 'large' ? 'large' : 'normal'];
    return { ratio: ratio, size: textSize === 'large' ? 'large' : 'normal',
      AA: ratio >= t.AA, AAA: ratio >= t.AAA, thresholds: { AA: t.AA, AAA: t.AAA } };
  }

  /** Display string truncated (never rounded up) to 2 decimals, so 4.499 shows "4.49". */
  function formatRatio(ratio) {
    if (ratio === null || !isFinite(ratio)) { return '—'; }
    return (Math.floor(ratio * 100) / 100).toFixed(2) + ':1';
  }

  /*
   * Harmony schemes on the digital HSL wheel. Angles are CHROMA tool settings recorded in
   * PROJECT_SPEC.md and M03 (project_rule), not values claimed by an external source.
   */
  var SCHEMES = {
    monochromatic: { label: '單色 Monochromatic', offsets: null, note: '固定 H，只改變 S/L' },
    analogous: { label: '類似色 Analogous', offsets: [-30, 0, 30], note: 'H±30°（CHROMA 工具設定）' },
    complementary: { label: '互補色 Complementary', offsets: [0, 180], note: 'H+180°（HSL 數位色輪）' },
    'split-complementary': { label: '分裂互補 Split-Complementary', offsets: [0, 150, 210], note: 'H+150°、H+210°（CHROMA 工具設定）' },
    triadic: { label: '三角色 Triadic', offsets: [0, 120, 240], note: 'H+120°、H+240°' },
    square: { label: '四方色 Square', offsets: [0, 90, 180, 270], note: 'H+90°、H+180°、H+270°（四色的一種設定）' }
  };

  function schemeHues(h, scheme) {
    var def = SCHEMES[scheme];
    if (!def) { throw new Error('unknown scheme: ' + scheme); }
    var base = normalizeHue(h);
    if (!def.offsets) { return [base]; }
    return def.offsets.map(function (o) { return normalizeHue(base + o); });
  }

  function makeColor(h, s, l, role) {
    var hh = normalizeHue(h), ss = clamp(s, 0, 100), ll = clamp(l, 0, 100);
    var rgb = hslToRgb(hh, ss, ll);
    return { role: role, h: hh, s: ss, l: ll, rgb: rgb, hex: rgbToHex(rgb) };
  }

  /** Palette for a scheme. Monochromatic keeps H and varies L (and S for the lightest tint). */
  function harmony(h, s, l, scheme) {
    var hues = schemeHues(h, scheme);
    if (scheme === 'monochromatic') {
      var base = hues[0];
      return [
        makeColor(base, s, clamp(l - 30, 5, 95), 'shade-2'),
        makeColor(base, s, clamp(l - 15, 5, 95), 'shade-1'),
        makeColor(base, s, l, 'base'),
        makeColor(base, clamp(s - 20, 0, 100), clamp(l + 15, 5, 95), 'tint-1'),
        makeColor(base, clamp(s - 30, 0, 100), clamp(l + 30, 5, 97), 'tint-2')
      ];
    }
    return hues.map(function (hh, i) { return makeColor(hh, s, l, i === (scheme === 'analogous' ? 1 : 0) ? 'base' : 'color-' + (i + 1)); });
  }

  /*
   * Traditional RYB teaching wheel (static illustration, M03 [S001]). Display swatches are
   * approximate screen colors chosen for the diagram, NOT a conversion from RYB to sRGB.
   */
  var RYB_WHEEL = [
    { name: '紅 Red', hex: '#D7261E' }, { name: '紅橙 Red-Orange', hex: '#E55A1B' },
    { name: '橙 Orange', hex: '#F08C1A' }, { name: '黃橙 Yellow-Orange', hex: '#F6B81C' },
    { name: '黃 Yellow', hex: '#F4DB1F' }, { name: '黃綠 Yellow-Green', hex: '#9CC23A' },
    { name: '綠 Green', hex: '#3E9E46' }, { name: '藍綠 Blue-Green', hex: '#1F8A8A' },
    { name: '藍 Blue', hex: '#2456A6' }, { name: '藍紫 Blue-Violet', hex: '#4B3A99' },
    { name: '紫 Violet', hex: '#7A2F8E' }, { name: '紅紫 Red-Violet', hex: '#B12A6A' }
  ];

  function rybOppositeIndex(i) { return ((Math.round(i) % 12) + 12 + 6) % 12; }

  /** 60-30-10 style area split: primary and secondary sliders, accent is the remainder. */
  function normalizeRatio(primary, secondary) {
    var p = Math.round(clamp(primary, 0, 100));
    var s = Math.round(clamp(secondary, 0, 100));
    if (p + s > 100) { s = 100 - p; }
    return { primary: p, secondary: s, accent: 100 - p - s };
  }

  /* ---------- P2 palette export ---------- */

  function slug(s, i) {
    var v = String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return v || 'color-' + (i + 1);
  }

  /** CSS custom properties block. Invalid HEX values are rejected (throws). */
  function paletteToCss(colors, prefix) {
    var p = slug(prefix || 'chroma', 0);
    var lines = colors.map(function (c, i) {
      var hex = normalizeHex(c.hex);
      if (!hex) { throw new Error('invalid HEX at index ' + i); }
      return '  --' + p + '-' + slug(c.role, i) + ': ' + hex + ';';
    });
    return ':root {\n' + lines.join('\n') + '\n}\n';
  }

  function paletteHexList(colors) {
    return colors.map(function (c) { return normalizeHex(c.hex); }).filter(Boolean).join(', ');
  }

  /** JSON palette object (schema "chroma-palette" v1). */
  function paletteToJson(colors, info) {
    info = info || {};
    return {
      format: 'chroma-palette',
      version: 1,
      generator: 'CHROMA Lab',
      scheme: info.scheme || null,
      base: info.base || null,
      note: 'HSL 角度為 CHROMA 工具設定；色票未經對比度檢查前不代表可讀性合格。',
      colors: colors.map(function (c, i) {
        var hex = normalizeHex(c.hex);
        if (!hex) { throw new Error('invalid HEX at index ' + i); }
        var rgb = hexToRgb(hex), hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        return { name: slug(c.role, i), hex: hex, rgb: rgb,
          hsl: { h: Math.round(hsl.h), s: Math.round(hsl.s), l: Math.round(hsl.l) } };
      })
    };
  }

  function validatePaletteJson(obj) {
    if (!obj || obj.format !== 'chroma-palette' || obj.version !== 1 || !Array.isArray(obj.colors) || !obj.colors.length) { return false; }
    return obj.colors.every(function (c) {
      return typeof c.name === 'string' && normalizeHex(c.hex) === c.hex && c.rgb && c.hsl &&
        rgbToHex(c.rgb) === c.hex;
    });
  }

  return {
    clamp: clamp, normalizeHue: normalizeHue, hslToRgb: hslToRgb, rgbToHsl: rgbToHsl,
    rgbToHex: rgbToHex, hexToRgb: hexToRgb, hslToHex: hslToHex, normalizeHex: normalizeHex,
    isValidHex: isValidHex, linearize: linearize, relativeLuminance: relativeLuminance,
    contrastRatio: contrastRatio, wcagTextResult: wcagTextResult, formatRatio: formatRatio,
    THRESHOLDS: THRESHOLDS, SCHEMES: SCHEMES, schemeHues: schemeHues, harmony: harmony,
    RYB_WHEEL: RYB_WHEEL, rybOppositeIndex: rybOppositeIndex, normalizeRatio: normalizeRatio,
    paletteToCss: paletteToCss, paletteToJson: paletteToJson, paletteHexList: paletteHexList,
    validatePaletteJson: validatePaletteJson
  };
});
