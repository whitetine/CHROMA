// CHROMA Phase 5 — JavaScript color math tests. Run: node --test tests/js/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const C = require(path.join(__dirname, '..', '..', 'docs', 'assets', 'js', 'color-utils.js'));
const Q = require(path.join(__dirname, '..', '..', 'docs', 'assets', 'js', 'quiz.js'));
const fs = require('node:fs');

test('TC002 hue 390° normalises to 30°', () => { assert.equal(C.normalizeHue(390), 30); });
test('hue -30° normalises to 330°', () => { assert.equal(C.normalizeHue(-30), 330); });
test('hue 360° → 0°, -720° → 0°, 719.5° → 359.5°', () => {
  assert.equal(C.normalizeHue(360), 0);
  assert.ok(Object.is(C.normalizeHue(-720), 0));
  assert.equal(C.normalizeHue(719.5), 359.5);
});

test('TC001 HSL complementary angle is H+180 (0→180, 200→20)', () => {
  assert.deepEqual(C.schemeHues(0, 'complementary'), [0, 180]);
  assert.deepEqual(C.schemeHues(200, 'complementary'), [200, 20]);
});
test('TC003 triadic angles 0,120,240 and wrap from 300', () => {
  assert.deepEqual(C.schemeHues(0, 'triadic'), [0, 120, 240]);
  assert.deepEqual(C.schemeHues(300, 'triadic'), [300, 60, 180]);
});
test('analogous ±30 (tool setting) wraps: H=350 → 320,350,20 (SL07 example)', () => {
  assert.deepEqual(C.schemeHues(350, 'analogous'), [320, 350, 20]);
});
test('split-complementary 150/210 and square 90 steps', () => {
  assert.deepEqual(C.schemeHues(10, 'split-complementary'), [10, 160, 220]);
  assert.deepEqual(C.schemeHues(45, 'square'), [45, 135, 225, 315]);
});
test('monochromatic keeps hue and varies S/L', () => {
  const p = C.harmony(200, 60, 50, 'monochromatic');
  assert.equal(p.length, 5);
  assert.ok(p.every((c) => c.h === 200));
  assert.equal(new Set(p.map((c) => c.l)).size, 5);
});
test('six schemes are defined', () => {
  assert.deepEqual(Object.keys(C.SCHEMES).sort(),
    ['analogous', 'complementary', 'monochromatic', 'split-complementary', 'square', 'triadic']);
});

test('HSL → RGB reference values (red, gray, black, white, cyan)', () => {
  assert.deepEqual(C.hslToRgb(0, 100, 50), { r: 255, g: 0, b: 0 });
  assert.deepEqual(C.hslToRgb(0, 0, 50), { r: 128, g: 128, b: 128 });
  assert.deepEqual(C.hslToRgb(123, 80, 0), { r: 0, g: 0, b: 0 });
  assert.deepEqual(C.hslToRgb(123, 80, 100), { r: 255, g: 255, b: 255 });
  assert.equal(C.hslToHex(180, 100, 50), '#00FFFF');
});
test('RGB ↔ HEX round trip', () => {
  assert.equal(C.rgbToHex(40, 85, 170), '#2855AA');
  assert.deepEqual(C.hexToRgb('#2855aa'), { r: 40, g: 85, b: 170 });
  assert.deepEqual(C.hexToRgb('F4C846'), { r: 244, g: 200, b: 70 });
  for (const hex of ['#000000', '#FFFFFF', '#E64C37', '#123ABC']) {
    assert.equal(C.rgbToHex(C.hexToRgb(hex)), hex);
  }
  const hsl = C.rgbToHsl(255, 0, 0);
  assert.deepEqual([hsl.h, hsl.s, hsl.l], [0, 100, 50]);
});

test('TC004 black/white contrast is exactly 21:1', () => {
  assert.equal(C.contrastRatio('#000000', '#FFFFFF'), 21);
  assert.equal(C.formatRatio(C.contrastRatio('#FFFFFF', '#000000')), '21.00:1');
});
test('TC005 identical colors contrast is 1:1', () => {
  assert.equal(C.contrastRatio('#2855AA', '#2855aa'), 1);
});
test('sRGB linearisation uses 0.04045 threshold and 2.4 exponent', () => {
  assert.equal(C.linearize(10), (10 / 255) / 12.92);
  assert.ok(Math.abs(C.linearize(128) - Math.pow((128 / 255 + 0.055) / 1.055, 2.4)) < 1e-15);
});
test('thresholds compare the unrounded ratio (4.499 fails AA, display truncates)', () => {
  assert.equal(C.wcagTextResult(4.499, 'normal').AA, false);
  assert.equal(C.wcagTextResult(4.5, 'normal').AA, true);
  assert.equal(C.wcagTextResult(4.499, 'large').AAA, false);
  assert.equal(C.wcagTextResult(3, 'large').AA, true);
  assert.equal(C.wcagTextResult(6.99, 'normal').AAA, false);
  assert.equal(C.formatRatio(4.499), '4.49:1');
  // A real pair just under 4.5: #777777 on white ≈ 4.478
  const r = C.contrastRatio('#777777', '#FFFFFF');
  assert.ok(r < 4.5 && r > 4.47);
  assert.equal(C.wcagTextResult(r, 'normal').AA, false);
});
test('TC006 invalid HEX is rejected and never yields a pass', () => {
  for (const bad of ['#FFF', '#GGGGGG', '12345', '#1234567', '', null, undefined, 'red', '#12345G', 'rgb(0,0,0)']) {
    assert.equal(C.normalizeHex(bad), null, String(bad));
    assert.equal(C.hexToRgb(bad), null);
    assert.equal(C.contrastRatio(bad, '#FFFFFF'), null);
  }
  assert.equal(C.wcagTextResult(null, 'normal'), null);
  assert.equal(C.formatRatio(null), '—');
});

test('RYB teaching wheel: red is opposite green (index 0 ↔ 6), distinct from HSL red ↔ cyan', () => {
  assert.equal(C.RYB_WHEEL.length, 12);
  assert.equal(C.rybOppositeIndex(0), 6);
  assert.match(C.RYB_WHEEL[6].name, /綠/);
  assert.equal(C.hslToHex(C.normalizeHue(0 + 180), 100, 50), '#00FFFF');
});

test('60-30-10 ratio: sums to 100, no negatives, defaults', () => {
  assert.deepEqual(C.normalizeRatio(60, 30), { primary: 60, secondary: 30, accent: 10 });
  assert.deepEqual(C.normalizeRatio(80, 50), { primary: 80, secondary: 20, accent: 0 });
  assert.deepEqual(C.normalizeRatio(-5, 120), { primary: 0, secondary: 100, accent: 0 });
  for (let p = 0; p <= 100; p += 7) {
    for (let s = 0; s <= 100; s += 9) {
      const r = C.normalizeRatio(p, s);
      assert.equal(r.primary + r.secondary + r.accent, 100);
      assert.ok(r.accent >= 0 && r.secondary >= 0);
    }
  }
});

test('P2 palette JSON export format', () => {
  const colors = C.harmony(0, 100, 50, 'triadic');
  const json = C.paletteToJson(colors, { scheme: 'triadic', base: { h: 0, s: 100, l: 50 } });
  assert.equal(json.format, 'chroma-palette');
  assert.equal(json.version, 1);
  assert.equal(json.scheme, 'triadic');
  assert.equal(json.colors.length, 3);
  assert.deepEqual(json.colors.map((c) => c.hex), ['#FF0000', '#00FF00', '#0000FF']);
  assert.deepEqual(json.colors[0].rgb, { r: 255, g: 0, b: 0 });
  assert.deepEqual(json.colors[0].hsl, { h: 0, s: 100, l: 50 });
  assert.ok(C.validatePaletteJson(JSON.parse(JSON.stringify(json))));
  assert.equal(C.validatePaletteJson({ format: 'x' }), false);
  assert.throws(() => C.paletteToJson([{ hex: '#XYZ', role: 'a' }]), /invalid HEX/);
});
test('P2 CSS variables export and HEX list', () => {
  const colors = [{ hex: '#ff0000', role: 'base' }, { hex: '#00FFFF', role: 'color-2' }];
  assert.equal(C.paletteToCss(colors, 'chroma'), ':root {\n  --chroma-base: #FF0000;\n  --chroma-color-2: #00FFFF;\n}\n');
  assert.equal(C.paletteHexList(colors), '#FF0000, #00FFFF');
});

test('quiz scoring: all correct, partial, unanswered and invalid answers', () => {
  const quiz = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'content', 'quiz-bank.json'), 'utf8'));
  const all = Object.fromEntries(quiz.map((q) => [q.id, q.correct_index]));
  assert.deepEqual([Q.scoreQuiz(quiz, all).score, Q.scoreQuiz(quiz, all).total], [8, 8]);
  assert.equal(Q.scoreQuiz(quiz, {}).score, 0);
  assert.equal(Q.scoreQuiz(quiz, {}).answered, 0);
  const wrongFirst = { ...all, Q01: (quiz[0].correct_index + 1) % 4 };
  assert.equal(Q.scoreQuiz(quiz, wrongFirst).score, 7);
  assert.equal(Q.scoreQuiz(quiz, { Q01: 9, Q02: -1, Q03: 1.5 }).answered, 0);
  const r = Q.scoreQuiz(quiz, { Q03: 2 });
  assert.equal(r.score, 1);
  assert.equal(r.results.find((x) => x.id === 'Q03').correct, true);
});
