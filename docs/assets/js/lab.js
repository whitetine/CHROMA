/*
 * CHROMA Lab components (Phase 5). Each interaction ID from content/interaction-spec.md is
 * registered here and can be mounted on lab.html or inside a slide.
 * P0: hsl, wheel, harmony, contrast-check · P1: rgb, contrast-illusion, ratio, design-compare,
 * association, design-lab, quiz · P2 (approved): export.
 * Requires: navigation.js, color-utils.js, color-wheel.js, contrast.js, quiz.js.
 */
(function () {
  'use strict';
  var CC = window.ChromaColor, C = window.Chroma, h = C.h;
  var registry = {};
  var uidN = 0;
  function uid(p) { uidN += 1; return (p || 'w') + '-' + uidN; }

  function register(id, fn) { registry[id] = fn; }

  function mount(id, el, opts) {
    var fn = registry[id];
    if (!fn) { throw new Error('unknown interaction: ' + id); }
    el.classList.add('widget');
    el.setAttribute('data-widget', id);
    var api = fn(el, opts || {});
    el.setAttribute('data-ready', 'true');
    return api;
  }

  function slider(label, min, max, value, unit, step) {
    var id = uid('sl');
    var input = h('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step || 1), value: String(value) });
    var out = h('output', { for: id, class: 'slider-value' }, value + (unit || ''));
    input.addEventListener('input', function () { out.textContent = input.value + (unit || ''); });
    return { wrap: h('div', { class: 'field slider' }, h('div', { class: 'field-head' }, h('label', { for: id }, label), out), input),
      input: input, out: out, set: function (v) { input.value = String(v); out.textContent = input.value + (unit || ''); } };
  }

  function choiceGroup(legend, name, options, checked) {
    var fs = h('fieldset', { class: 'field choices' }, h('legend', null, legend));
    var inputs = options.map(function (o) {
      var id = uid('ch');
      var inp = h('input', { type: 'radio', name: name, id: id, value: o.value });
      if (o.value === checked) { inp.checked = true; }
      fs.appendChild(h('label', { for: id, class: 'choice' }, inp, h('span', null, o.label)));
      return inp;
    });
    return { el: fs, value: function () { var c = inputs.filter(function (i) { return i.checked; })[0]; return c ? c.value : null; },
      inputs: inputs };
  }

  function codeLine(label, value) {
    return h('div', { class: 'code-line' }, h('span', { class: 'code-label' }, label), h('code', null, value));
  }

  function swatch(hex, label, sub) {
    var textColor = CC.contrastRatio(hex, '#202020') >= CC.contrastRatio(hex, '#FFFFFF') ? '#202020' : '#FFFFFF';
    return h('div', { class: 'swatch', style: 'background:' + hex + ';color:' + textColor },
      h('span', { class: 'swatch-hex' }, hex), label ? h('span', { class: 'swatch-label' }, label) : null,
      sub ? h('span', { class: 'swatch-sub' }, sub) : null);
  }

  function note(text, refs, kind) {
    var p = h('p', { class: 'small muted widget-note' }, kind ? h('span', { class: 'tag' }, kind) : null, kind ? ' ' : null, text);
    (refs || []).forEach(function (r) { p.appendChild(document.createTextNode(' ')); p.appendChild(C.citeLink(r)); });
    return p;
  }

  /* ---------------- P0 · HSL 三要素調色器 ---------------- */
  register('hsl', function (el) {
    var H = slider('色相 Hue（H）', 0, 359, 0, '°'), S = slider('飽和度 Saturation（S）', 0, 100, 100, '%'), L = slider('明度 Lightness（L）', 0, 100, 50, '%');
    var hueNum = h('input', { type: 'number', id: uid('hn'), step: '1', value: '0', class: 'num-input' });
    var hueNote = h('span', { class: 'small muted', 'aria-live': 'polite' });
    var preview = h('div', { class: 'big-swatch', role: 'img', 'aria-label': '目前色彩預覽' });
    var codes = h('div', { class: 'codes' });
    var reset = h('button', { type: 'button', class: 'btn' }, '重設 Reset');
    var desc = h('p', { class: 'small', 'aria-live': 'polite' });
    function update() {
      var hh = Number(H.input.value), ss = Number(S.input.value), ll = Number(L.input.value);
      var rgb = CC.hslToRgb(hh, ss, ll), hex = CC.rgbToHex(rgb);
      preview.style.background = hex;
      preview.setAttribute('aria-label', '目前色彩 ' + hex);
      C.clear(codes);
      codes.appendChild(codeLine('HSL', 'hsl(' + hh + ', ' + ss + '%, ' + ll + '%)'));
      codes.appendChild(codeLine('HEX', hex));
      codes.appendChild(codeLine('RGB', 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')'));
      desc.textContent = ss === 0 ? 'S = 0%：灰階（無色相）。' : ll === 0 ? 'L = 0%：黑色。' : ll === 100 ? 'L = 100%：白色。' : '色相 ' + hh + '°，飽和 ' + ss + '%，明度 ' + ll + '%。';
      el.setAttribute('data-hex', hex);
    }
    H.input.addEventListener('input', function () { hueNum.value = H.input.value; hueNote.textContent = ''; update(); });
    [S, L].forEach(function (x) { x.input.addEventListener('input', update); });
    hueNum.addEventListener('change', function () {
      var raw = Number(hueNum.value);
      if (!isFinite(raw) || hueNum.value === '') { hueNote.textContent = '請輸入數字角度。'; return; }
      var n = Math.round(CC.normalizeHue(raw)) % 360;
      H.set(n);
      hueNote.textContent = raw !== n ? raw + '° 正規化為 ' + n + '°' : '';
      hueNum.value = String(n);
      update();
    });
    reset.addEventListener('click', function () { H.set(0); S.set(100); L.set(50); hueNum.value = '0'; hueNote.textContent = ''; update(); });
    el.appendChild(h('div', { class: 'widget-grid' },
      h('div', { class: 'widget-controls' }, H.wrap, S.wrap, L.wrap,
        h('div', { class: 'field' }, h('label', { for: hueNum.id }, '輸入任意色相角度（例如 390 或 -30）'), h('div', { class: 'field-row' }, hueNum, hueNote)),
        reset),
      h('div', { class: 'widget-output' }, preview, desc, codes)));
    el.appendChild(note('HSL 明度 L 不等於感知亮度，也不能取代 WCAG 相對亮度。', ['S003']));
    update();
    return { update: update, H: H.input, S: S.input, L: L.input };
  });

  /* ---------------- P0 · RYB / HSL 色輪比較 ---------------- */
  register('wheel', function (el) {
    var view = choiceGroup('顯示 View', uid('wv'), [{ value: 'both', label: '並列比較' }, { value: 'ryb', label: 'RYB 傳統教學色輪' }, { value: 'hsl', label: 'HSL 數位色輪' }], 'both');
    var rybSel = h('select', { id: uid('rs') }, CC.RYB_WHEEL.map(function (c, i) { return h('option', { value: String(i) }, c.name); }));
    var hue = slider('HSL 主色角度 H', 0, 359, 0, '°');
    var ryb = window.ChromaWheel.rybWheel({ selected: 0 });
    var canvas = h('canvas', { class: 'wheel-canvas', width: '280', height: '280', 'aria-hidden': 'true' });
    var rybOut = h('p', { class: 'wheel-out', 'aria-live': 'polite' });
    var hslOut = h('p', { class: 'wheel-out', 'aria-live': 'polite' });
    var rybPanel = h('figure', { class: 'wheel-panel', 'data-model': 'ryb' },
      h('figcaption', null, h('strong', null, 'RYB'), ' 傳統教學色輪（靜態示意）'), ryb.el,
      h('div', { class: 'field' }, h('label', { for: rybSel.id }, '選擇 RYB 色'), rybSel), rybOut,
      h('p', { class: 'small muted' }, '色塊為示意用螢幕色，不是 RYB→sRGB 精確換算。', ' ', C.citeLink('S001')));
    var hslPanel = h('figure', { class: 'wheel-panel', 'data-model': 'hsl' },
      h('figcaption', null, h('strong', null, 'HSL'), ' 數位色輪（S 100%、L 50%）'), canvas, hue.wrap, hslOut,
      h('p', { class: 'small muted' }, '0° 紅、180° 青、360° 回到紅。', ' ', C.citeLink('S003')));
    function update() {
      var r = ryb.update(Number(rybSel.value));
      rybOut.textContent = 'RYB：' + CC.RYB_WHEEL[r.index].name + ' ↔ 對向 ' + CC.RYB_WHEEL[r.opposite].name;
      var hh = Number(hue.input.value), opp = CC.normalizeHue(hh + 180);
      window.ChromaWheel.drawHslWheel(canvas, { markers: [{ h: hh }, { h: opp }] });
      hslOut.textContent = 'HSL：' + hh + '°（' + CC.hslToHex(hh, 100, 50) + '）↔ 對向 ' + opp + '°（' + CC.hslToHex(opp, 100, 50) + '）';
      var v = view.value();
      rybPanel.hidden = v === 'hsl';
      hslPanel.hidden = v === 'ryb';
    }
    rybSel.addEventListener('change', update);
    hue.input.addEventListener('input', update);
    view.inputs.forEach(function (i) { i.addEventListener('change', update); });
    el.appendChild(view.el);
    el.appendChild(h('div', { class: 'wheel-pair' }, rybPanel, hslPanel));
    el.appendChild(note('兩種色輪屬於不同模型：RYB 的紅對綠，HSL 的紅（0°）對青（180°），不可混用。', ['S001', 'S003']));
    update();
    window.addEventListener('resize', update);
    return { update: update };
  });

  /* ---------------- P0 · 六種配色產生器 ---------------- */
  var lastPalette = null;
  function publishPalette(colors, info) {
    lastPalette = { colors: colors, info: info };
    document.dispatchEvent(new CustomEvent('chroma:palette', { detail: lastPalette }));
  }

  register('harmony', function (el) {
    var H = slider('主色色相 H', 0, 359, 350, '°'), S = slider('飽和度 S', 0, 100, 70, '%'), L = slider('明度 L', 0, 100, 50, '%');
    var opts = Object.keys(CC.SCHEMES).map(function (k) { return { value: k, label: CC.SCHEMES[k].label }; });
    var scheme = choiceGroup('配色方法 Scheme', uid('hs'), opts, 'analogous');
    var canvas = h('canvas', { class: 'wheel-canvas', width: '280', height: '280', 'aria-hidden': 'true' });
    var swatches = h('div', { class: 'swatch-row', 'aria-live': 'polite' });
    var rule = h('p', { class: 'rule-line' });
    function update() {
      var hh = Number(H.input.value), ss = Number(S.input.value), ll = Number(L.input.value), sc = scheme.value();
      var colors = CC.harmony(hh, ss, ll, sc);
      var marks = sc === 'monochromatic' ? [{ h: hh }] : colors.map(function (c) { return { h: c.h }; });
      if (sc === 'analogous') { marks = [marks[1], marks[0], marks[2]]; }
      window.ChromaWheel.drawHslWheel(canvas, { markers: marks, s: ss, l: ll });
      C.clear(swatches);
      colors.forEach(function (c) {
        swatches.appendChild(swatch(c.hex, Math.round(c.h) + '°', 'S' + Math.round(c.s) + ' L' + Math.round(c.l)));
      });
      rule.textContent = CC.SCHEMES[sc].label + '：' + CC.SCHEMES[sc].note + '。角度皆取模 360。';
      el.setAttribute('data-palette', colors.map(function (c) { return c.hex; }).join(','));
      publishPalette(colors, { scheme: sc, base: { h: hh, s: ss, l: ll } });
    }
    [H, S, L].forEach(function (x) { x.input.addEventListener('input', update); });
    scheme.inputs.forEach(function (i) { i.addEventListener('change', update); });
    el.appendChild(h('div', { class: 'widget-grid' },
      h('div', { class: 'widget-controls' }, scheme.el, H.wrap, S.wrap, L.wrap),
      h('div', { class: 'widget-output' }, canvas, rule, swatches)));
    el.appendChild(note('類似色 ±30° 與分裂互補 150°／210° 是 CHROMA 工具設定，不是來源規定。色輪角度不是感知均勻距離，色相對比不保證可讀性。', ['S001', 'S003'], '工具設定'));
    update();
    window.addEventListener('resize', update);
    return { update: update, H: H.input, scheme: scheme };
  });

  /* ---------------- P0 · WCAG 對比度檢查器 ---------------- */
  register('contrast-check', function (el, opts) { return window.ChromaContrast.mount(el, opts); });

  /* ---------------- P1 · RGB 混色實驗 ---------------- */
  register('rgb', function (el) {
    var R = slider('紅 Red（R）', 0, 255, 255), G = slider('綠 Green（G）', 0, 255, 255), B = slider('藍 Blue（B）', 0, 255, 255);
    var S = C.svg;
    var cR = S('circle', { cx: '100', cy: '80', r: '58', 'class': 'mix' }), cG = S('circle', { cx: '72', cy: '128', r: '58', 'class': 'mix' }),
      cB = S('circle', { cx: '128', cy: '128', r: '58', 'class': 'mix' });
    var art = S('svg', { viewBox: '0 0 200 200', class: 'rgb-art', role: 'img', 'aria-label': 'RGB 三盞光的加法混色示意' },
      S('rect', { width: '200', height: '200', fill: '#000000' }), cR, cG, cB);
    var result = h('div', { class: 'big-swatch' });
    var codes = h('div', { class: 'codes' });
    var desc = h('p', { class: 'small', 'aria-live': 'polite' });
    var presets = h('div', { class: 'btn-row' });
    [['全 255', 255, 255, 255], ['全 0', 0, 0, 0], ['R+G', 255, 255, 0], ['G+B', 0, 255, 255], ['R+B', 255, 0, 255]].forEach(function (p) {
      presets.appendChild(h('button', { type: 'button', class: 'btn btn-sm', onclick: function () { R.set(p[1]); G.set(p[2]); B.set(p[3]); update(); } }, p[0]));
    });
    function update() {
      var r = Number(R.input.value), g = Number(G.input.value), b = Number(B.input.value), hex = CC.rgbToHex(r, g, b);
      cR.setAttribute('fill', CC.rgbToHex(r, 0, 0)); cG.setAttribute('fill', CC.rgbToHex(0, g, 0)); cB.setAttribute('fill', CC.rgbToHex(0, 0, b));
      result.style.background = hex;
      C.clear(codes);
      codes.appendChild(codeLine('RGB', 'rgb(' + r + ', ' + g + ', ' + b + ')'));
      codes.appendChild(codeLine('HEX', hex));
      desc.textContent = (r === 255 && g === 255 && b === 255) ? '三通道全強度：加法混色得到白色。' :
        (r === 0 && g === 0 && b === 0) ? '三通道皆為 0：沒有光，呈現黑色。' : '合成色 ' + hex + '。';
      el.setAttribute('data-hex', hex);
    }
    [R, G, B].forEach(function (x) { x.input.addEventListener('input', update); });
    el.appendChild(h('div', { class: 'widget-grid' },
      h('div', { class: 'widget-controls' }, R.wrap, G.wrap, B.wrap, presets),
      h('div', { class: 'widget-output' }, art, h('div', { class: 'mix-result' }, result, h('div', null, desc, codes)))));
    el.appendChild(h('div', { class: 'cmyk-note' },
      h('p', { class: 'small' }, h('strong', null, 'CMYK 對照：'), '印刷以油墨吸收光線，屬減法混色；實際結果受設備與色彩管理影響，本實驗不模擬印刷，也不提供精準 RGB↔CMYK 換算。', ' ', C.citeLink('S002'))));
    update();
    return { update: update, R: R.input, G: G.input, B: B.input };
  });

  /* ---------------- P1 · 同時對比實驗 ---------------- */
  register('contrast-illusion', function (el) {
    var GRAY = '#888888';
    var toggle = h('button', { type: 'button', class: 'btn btn-primary', 'aria-pressed': 'false' }, '揭曉：統一背景');
    var left = h('div', { class: 'illusion-bg', style: 'background:#222222' }, h('div', { class: 'illusion-chip', style: 'background:' + GRAY }));
    var right = h('div', { class: 'illusion-bg', style: 'background:#EEEEEE' }, h('div', { class: 'illusion-chip', style: 'background:' + GRAY }));
    var status = h('p', { class: 'small', 'aria-live': 'polite' });
    var q = h('p', null, '哪一個灰色方塊看起來比較亮？先觀察，再按揭曉。');
    function set(revealed) {
      toggle.setAttribute('aria-pressed', String(revealed));
      toggle.textContent = revealed ? '還原：不同背景' : '揭曉：統一背景';
      left.style.background = revealed ? '#888888' : '#222222';
      right.style.background = revealed ? '#888888' : '#EEEEEE';
      left.classList.toggle('is-revealed', revealed); right.classList.toggle('is-revealed', revealed);
      status.textContent = revealed ? '背景統一後：兩個方塊皆為 ' + GRAY + '，數值從未改變（以外框標示方塊範圍）。' : '背景：左 #222222、右 #EEEEEE；方塊皆為 ' + GRAY + '。';
    }
    toggle.addEventListener('click', function () { set(toggle.getAttribute('aria-pressed') !== 'true'); });
    el.appendChild(q);
    el.appendChild(h('div', { class: 'illusion' }, h('figure', null, left, h('figcaption', null, '方塊 A')), h('figure', null, right, h('figcaption', null, '方塊 B'))));
    el.appendChild(h('div', { class: 'btn-row' }, toggle));
    el.appendChild(status);
    el.appendChild(note('相同灰色在暗背景旁可能顯得較亮；個人感受可能不同，此實驗不是視覺能力診斷，側抑制也不足以解釋所有明度錯覺。', ['S006']));
    set(false);
    return { toggle: toggle, gray: GRAY };
  });

  /* ---------------- P1 · 60-30-10 比例實驗 ---------------- */
  register('ratio', function (el) {
    var P = slider('主色 Dominant（背景）', 0, 100, 60, '%'), Sx = slider('輔助色 Secondary（區塊）', 0, 100, 30, '%');
    var accentOut = h('output', { class: 'slider-value' }, '10%');
    var bar = h('div', { class: 'ratio-bar', role: 'img' });
    var segP = h('span', { class: 'seg', style: 'background:#F4F1E9' }), segS = h('span', { class: 'seg', style: 'background:#2855AA' }),
      segA = h('span', { class: 'seg', style: 'background:#F4C846' });
    bar.appendChild(segP); bar.appendChild(segS); bar.appendChild(segA);
    var mock = h('div', { class: 'ratio-mock', 'aria-hidden': 'true' });
    var mockSide = h('div', { class: 'rm-side' }, h('span', null, '輔助區塊'));
    var mockMain = h('div', { class: 'rm-main' }, h('span', { class: 'rm-title' }, '主色背景'), h('span', { class: 'rm-btn' }, '強調'));
    mock.appendChild(mockSide); mock.appendChild(mockMain);
    var status = h('p', { class: 'small', 'aria-live': 'polite' });
    var reset = h('button', { type: 'button', class: 'btn' }, '重設 60 / 30 / 10');
    function update(changed) {
      var r = CC.normalizeRatio(P.input.value, Sx.input.value);
      if (changed === 'p' && Number(Sx.input.value) !== r.secondary) { Sx.set(r.secondary); }
      if (changed === 's' && Number(Sx.input.value) !== r.secondary) { Sx.set(r.secondary); }
      P.set(r.primary);
      accentOut.textContent = r.accent + '%';
      segP.style.flexBasis = r.primary + '%'; segS.style.flexBasis = r.secondary + '%'; segA.style.flexBasis = r.accent + '%';
      bar.setAttribute('aria-label', '主色 ' + r.primary + '%、輔助色 ' + r.secondary + '%、強調色 ' + r.accent + '%');
      mockSide.style.flexBasis = Math.max(r.secondary, 0) + '%';
      mockSide.hidden = r.secondary === 0;
      mockMain.querySelector('.rm-btn').style.padding = (0.2 + r.accent / 20) + 'rem ' + (0.4 + r.accent / 10) + 'rem';
      mockMain.querySelector('.rm-btn').hidden = r.accent === 0;
      status.textContent = '主色 ' + r.primary + '% ＋ 輔助色 ' + r.secondary + '% ＋ 強調色 ' + r.accent + '% ＝ ' + (r.primary + r.secondary + r.accent) + '%';
      el.setAttribute('data-ratio', r.primary + '-' + r.secondary + '-' + r.accent);
    }
    P.input.addEventListener('input', function () { update('p'); });
    Sx.input.addEventListener('input', function () { update('s'); });
    reset.addEventListener('click', function () { P.set(60); Sx.set(30); update(); });
    el.appendChild(h('div', { class: 'widget-grid' },
      h('div', { class: 'widget-controls' }, P.wrap, Sx.wrap,
        h('div', { class: 'field' }, h('div', { class: 'field-head' }, h('span', null, '強調色 Accent（剩餘值）'), accentOut)), reset, status),
      h('div', { class: 'widget-output' }, bar, mock, h('p', { class: 'small muted' }, '版面示意面積為概略呈現，色帶比例為精確數值。'))));
    el.appendChild(note('60-30-10 是室內配色的設計經驗法則；延伸到網頁是 CHROMA 原創示範，不是強制標準。', ['S001'], '經驗法則'));
    update();
    return { update: update, P: P.input, S: Sx.input };
  });

  /* ---------------- P1 · 視覺設計前後對照 ---------------- */
  register('design-compare', function (el) {
    var hier = choiceGroup('層級 Hierarchy', uid('dh'), [{ value: 'flat', label: 'A 無層級：字級相同' }, { value: 'clear', label: 'B 明確層級' }], 'flat');
    var pal = choiceGroup('色票 Palette', uid('dp'), [{ value: 'busy', label: '多色競爭' }, { value: 'calm', label: '一致色票' }], 'busy');
    var acc = choiceGroup('強調色 Accent', uid('da'), [{ value: 'blue', label: '藍' }, { value: 'red', label: '紅' }, { value: 'yellow', label: '黃' }], 'blue');
    var card = h('article', { class: 'compare-card' },
      h('p', { class: 'cc-kicker' }, 'WORKSHOP 03'),
      h('h4', { class: 'cc-title' }, '色彩與閱讀工作坊'),
      h('p', { class: 'cc-meta' }, '12 月 6 日 14:00｜線上'),
      h('p', { class: 'cc-body' }, '從色相、明度到對比，練習替一張活動頁建立清楚的閱讀順序。'),
      h('span', { class: 'cc-btn' }, '報名 →'));
    var status = h('p', { class: 'small', 'aria-live': 'polite' });
    function update() {
      card.setAttribute('data-hierarchy', hier.value());
      card.setAttribute('data-palette', pal.value());
      card.setAttribute('data-accent', acc.value());
      status.textContent = '目前：' + (hier.value() === 'clear' ? '明確層級' : '無層級') + '、' + (pal.value() === 'calm' ? '一致色票' : '多色競爭') +
        '、強調色' + { blue: '藍', red: '紅', yellow: '黃' }[acc.value()] + '。文字內容維持不變。';
    }
    [hier, pal, acc].forEach(function (g) { g.inputs.forEach(function (i) { i.addEventListener('change', update); }); });
    el.appendChild(h('div', { class: 'widget-grid' },
      h('div', { class: 'widget-controls' }, hier.el, pal.el, acc.el, status),
      h('div', { class: 'widget-output compare-stage' }, card)));
    el.appendChild(note('觀察自己先注意哪裡；不同人的反應可能不同，此對照未經使用者研究，不宣稱某版本已被實證較佳。所有狀態的文字色組合均通過一般文字 4.5:1。', ['S007', 'S008']));
    update();
    return { update: update };
  });

  /* ---------------- P1 · 色彩情緒聯想實驗 ---------------- */
  register('association', function (el) {
    var words = ['活潑', '溫暖', '平靜', '清爽', '緊張', '可靠', '沒有特別感受'];
    var posters = [{ id: 'yellow', name: '黃色版', bg: '#F4C846', fg: '#202020' }, { id: 'teal', name: '藍綠版', bg: '#1E7A78', fg: '#FFFFFF' }];
    var chosen = {};
    var result = h('div', { class: 'assoc-result', 'aria-live': 'polite' });
    var grid = h('div', { class: 'assoc-grid' });
    posters.forEach(function (p) {
      var name = uid('as');
      var fs = h('fieldset', { class: 'field choices compact' }, h('legend', null, p.name + '讓你聯想到？'));
      words.forEach(function (w) {
        var id = uid('aw');
        var inp = h('input', { type: 'radio', name: name, id: id, value: w });
        inp.addEventListener('change', function () { chosen[p.id] = w; render(); });
        fs.appendChild(h('label', { for: id, class: 'choice' }, inp, h('span', null, w)));
      });
      grid.appendChild(h('div', { class: 'assoc-col' },
        h('div', { class: 'poster', style: 'background:' + p.bg + ';color:' + p.fg },
          h('span', { class: 'poster-no' }, 'No.12'), h('span', { class: 'poster-title' }, '週末市集'), h('span', { class: 'poster-sub' }, 'Weekend Market')),
        fs));
    });
    function render() {
      C.clear(result);
      var keys = Object.keys(chosen);
      if (!keys.length) { result.appendChild(h('p', { class: 'small muted' }, '尚未選擇。選擇只保留在此頁面，不會上傳或儲存。')); return; }
      result.appendChild(h('p', null, '你的聯想：' + posters.filter(function (p) { return chosen[p.id]; }).map(function (p) { return p.name + '「' + chosen[p.id] + '」'; }).join('、') + '。'));
      result.appendChild(h('p', { class: 'small' }, '研究常見：黃色常與正向高喚起情緒相連，藍綠常與正向低喚起情緒相連；多數研究測量的是聯想，不是實際情緒改變。你的答案與研究趨勢不同也很正常。', ' ', C.citeLink('S005')));
    }
    el.appendChild(grid);
    el.appendChild(result);
    el.appendChild(note('此實驗不評定人格、不提供心理診斷，也不宣稱色彩必然造成某種情緒或具有醫療效果；文化、情境、個體與研究方法皆可能影響結果。', ['S004', 'S005']));
    render();
    return { chosen: chosen };
  });

  /* ---------------- P1 · 自由配色設計實驗室 ---------------- */
  register('design-lab', function (el) {
    var fields = [
      { key: 'bg', label: '背景 Background', value: '#F4F1E9' },
      { key: 'title', label: '標題 Title', value: '#1F3A73' },
      { key: 'text', label: '內文 Body', value: '#202020' },
      { key: 'accent', label: '強調／按鈕 Accent', value: '#E8792B' },
      { key: 'onAccent', label: '按鈕文字 On-accent', value: '#202020' },
      { key: 'error', label: '錯誤狀態 Error', value: '#B5321F' }
    ];
    var inputs = {};
    var ctrl = h('div', { class: 'widget-controls dl-fields' });
    fields.forEach(function (f) {
      var id = uid('dl');
      var text = h('input', { type: 'text', id: id, value: f.value, maxlength: '7', class: 'hex-input', autocomplete: 'off', spellcheck: 'false', 'aria-describedby': id + '-e' });
      var pick = h('input', { type: 'color', value: f.value.toLowerCase(), 'aria-label': f.label + ' 色彩選擇器', class: 'color-picker' });
      var err = h('span', { class: 'field-error', id: id + '-e', 'aria-live': 'polite' });
      pick.addEventListener('input', function () { text.value = pick.value.toUpperCase(); update(); });
      text.addEventListener('input', update);
      inputs[f.key] = { text: text, pick: pick, err: err };
      ctrl.appendChild(h('div', { class: 'field' }, h('label', { for: id }, f.label), h('div', { class: 'field-row' }, pick, text), err));
    });
    var preview = h('div', { class: 'dl-preview' },
      h('p', { class: 'dl-kicker' }, 'CHROMA EVENT'),
      h('h4', { class: 'dl-title' }, '色彩與閱讀之夜'),
      h('p', { class: 'dl-body' }, '一場關於色相、明度與層級的小型展覽導覽。'),
      h('span', { class: 'dl-btn' }, '預約導覽'),
      h('p', { class: 'dl-error' }, h('span', { 'aria-hidden': 'true' }, '⚠ '), '錯誤：請輸入有效的電子郵件格式'));
    var table = h('table', { class: 'dl-table' });
    var verdict = h('p', { class: 'small', 'aria-live': 'polite' });
    var pairs = [
      { name: '標題 / 背景', fg: 'title', bg: 'bg', size: 'large' },
      { name: '內文 / 背景', fg: 'text', bg: 'bg', size: 'normal' },
      { name: '按鈕文字 / 強調', fg: 'onAccent', bg: 'accent', size: 'normal' },
      { name: '錯誤文字 / 背景', fg: 'error', bg: 'bg', size: 'normal' }
    ];
    function update() {
      var v = {}, ok = true;
      Object.keys(inputs).forEach(function (k) {
        var hex = CC.normalizeHex(inputs[k].text.value);
        inputs[k].text.setAttribute('aria-invalid', hex ? 'false' : 'true');
        inputs[k].err.textContent = hex ? '' : '無效 HEX';
        if (hex) { inputs[k].pick.value = hex.toLowerCase(); } else { ok = false; }
        v[k] = hex;
      });
      if (v.bg) { preview.style.background = v.bg; }
      if (v.title) { preview.querySelector('.dl-title').style.color = v.title; }
      if (v.text) { preview.querySelector('.dl-body').style.color = v.text; preview.querySelector('.dl-kicker').style.color = v.text; }
      if (v.accent) { preview.querySelector('.dl-btn').style.background = v.accent; }
      if (v.onAccent) { preview.querySelector('.dl-btn').style.color = v.onAccent; }
      if (v.error) { preview.querySelector('.dl-error').style.color = v.error; }
      C.clear(table);
      table.appendChild(h('thead', null, h('tr', null, h('th', { scope: 'col' }, '文字 / 背景'), h('th', { scope: 'col' }, '對比率'), h('th', { scope: 'col' }, 'AA'))));
      var tb = h('tbody'), allPass = true;
      pairs.forEach(function (p) {
        var r = CC.contrastRatio(v[p.fg], v[p.bg]);
        var res = CC.wcagTextResult(r, p.size);
        if (!res || !res.AA) { allPass = false; }
        tb.appendChild(h('tr', { 'data-pass': res ? String(res.AA) : 'invalid' },
          h('th', { scope: 'row' }, p.name, h('span', { class: 'small muted' }, p.size === 'large' ? '（大型）' : '（一般）')),
          h('td', null, CC.formatRatio(r)),
          h('td', null, !res ? '⚠ 無效' : res.AA ? '✓ 通過' : '✗ 未通過')));
      });
      table.appendChild(tb);
      verdict.textContent = !ok ? '⚠ 有無效色碼，未判定。' : allPass ? '✓ 四組文字組合均達 AA；仍需檢查非文字元件、狀態與實際內容。' : '✗ 有組合未達 AA，請調整後再採用。';
      el.setAttribute('data-all-pass', String(ok && allPass));
    }
    el.appendChild(h('div', { class: 'widget-grid' }, ctrl, h('div', { class: 'widget-output' }, preview, table, verdict)));
    el.appendChild(note('流程：確認媒介與目標 → 選色 → 組織版面 → 檢查可讀性 → 迭代（CHROMA 專案規則）。錯誤狀態同時使用圖示與文字，不只靠紅色。', ['S009', 'S010'], '專案規則'));
    update();
    return { update: update, inputs: inputs };
  });

  /* ---------------- P1 · 學習成果測驗 ---------------- */
  register('quiz', function (el, opts) {
    var d = C.data();
    return window.ChromaQuiz.mount(el, d ? d.quiz : [], opts);
  });

  /* ---------------- P2 · 配色方案匯出 ---------------- */
  register('export', function (el) {
    var list = h('div', { class: 'export-list' });
    var cssOut = h('pre', { class: 'export-pre', tabindex: '0', 'aria-label': 'CSS Variables 預覽' });
    var jsonOut = h('pre', { class: 'export-pre', tabindex: '0', 'aria-label': 'JSON 預覽' });
    var status = h('p', { class: 'small', role: 'status', 'aria-live': 'polite' });
    var copyAll = h('button', { type: 'button', class: 'btn' }, '複製全部 HEX');
    var copyCss = h('button', { type: 'button', class: 'btn' }, '複製 CSS Variables');
    var dl = h('button', { type: 'button', class: 'btn btn-primary' }, '下載 JSON 色票');
    var current = null;
    function say(msg) { status.textContent = msg; }
    function copy(text, label) {
      C.copyText(text).then(function () { say('已複製' + label + '。'); }, function () { say('瀏覽器未允許剪貼簿，請手動選取下方文字複製。'); });
    }
    function render(p) {
      current = p;
      C.clear(list);
      if (!p) { list.appendChild(h('p', { class: 'small muted' }, '請先在「六種配色產生器」產生色票。')); return; }
      p.colors.forEach(function (c, i) {
        list.appendChild(h('div', { class: 'export-item' }, swatch(c.hex, c.role),
          h('button', { type: 'button', class: 'btn btn-sm', 'aria-label': '複製 ' + c.hex, onclick: function () { copy(c.hex, ' ' + c.hex); } }, '複製 ' + c.hex)));
      });
      cssOut.textContent = CC.paletteToCss(p.colors, 'chroma');
      jsonOut.textContent = JSON.stringify(CC.paletteToJson(p.colors, p.info), null, 2);
      el.setAttribute('data-count', String(p.colors.length));
    }
    copyAll.addEventListener('click', function () { if (current) { copy(CC.paletteHexList(current.colors), '全部 HEX'); } });
    copyCss.addEventListener('click', function () { if (current) { copy(CC.paletteToCss(current.colors, 'chroma'), ' CSS Variables'); } });
    dl.addEventListener('click', function () {
      if (!current) { return; }
      var name = 'chroma-palette-' + (current.info.scheme || 'custom') + '.json';
      C.download(name, JSON.stringify(CC.paletteToJson(current.colors, current.info), null, 2) + '\n', 'application/json');
      say('已建立下載：' + name + '（本機產生，不經伺服器）。');
    });
    document.addEventListener('chroma:palette', function (e) { render(e.detail); });
    el.appendChild(h('p', null, '匯出「六種配色產生器」目前的色票。所有檔案在瀏覽器本機產生。'));
    el.appendChild(list);
    el.appendChild(h('div', { class: 'btn-row' }, copyAll, copyCss, dl));
    el.appendChild(status);
    el.appendChild(h('div', { class: 'export-previews' },
      h('div', null, h('p', { class: 'label' }, 'CSS Variables'), cssOut), h('div', null, h('p', { class: 'label' }, 'JSON'), jsonOut)));
    render(lastPalette);
    return { render: render };
  });

  window.ChromaLab = { register: register, mount: mount, ids: function () { return Object.keys(registry); } };
})();
