/*
 * CHROMA WCAG text contrast checker (P0 · interaction "contrast-check").
 * Basis: M07 v1.1.0 [S009][S010]. Ratio is compared unrounded; display is truncated.
 * Opaque #RRGGBB only; invalid input never shows a pass state.
 */
(function () {
  'use strict';
  var CC = window.ChromaColor;

  function statusRow(level, ok, threshold) {
    var h = window.Chroma.h;
    return h('li', { class: 'status ' + (ok ? 'is-pass' : 'is-fail'), 'data-level': level },
      h('span', { class: 'status-icon', 'aria-hidden': 'true' }, ok ? '✓' : '✗'),
      h('span', null, level + ' ' + (ok ? '通過' : '未通過') + '（門檻 ' + threshold + ':1）'));
  }

  /** Small reusable result list for a fg/bg pair. */
  function resultList(fg, bg, size) {
    var h = window.Chroma.h;
    var r = CC.contrastRatio(fg, bg);
    var res = CC.wcagTextResult(r, size);
    if (!res) { return h('p', { class: 'status is-invalid', role: 'alert' }, '⚠ 色碼無效，不判定'); }
    return h('ul', { class: 'status-list' }, statusRow('AA', res.AA, res.thresholds.AA), statusRow('AAA', res.AAA, res.thresholds.AAA));
  }

  function colorField(h, id, label, value) {
    var text = h('input', { type: 'text', id: id, value: value, inputmode: 'text', autocomplete: 'off', spellcheck: 'false',
      maxlength: '7', pattern: '#?[0-9A-Fa-f]{6}', 'aria-describedby': id + '-err', class: 'hex-input' });
    var picker = h('input', { type: 'color', value: value.toLowerCase(), 'aria-label': label + ' 色彩選擇器', class: 'color-picker' });
    var err = h('span', { id: id + '-err', class: 'field-error', 'aria-live': 'polite' });
    var wrap = h('div', { class: 'field' }, h('label', { for: id }, label), h('div', { class: 'field-row' }, picker, text), err);
    picker.addEventListener('input', function () { text.value = picker.value.toUpperCase(); text.dispatchEvent(new Event('input', { bubbles: true })); });
    return { wrap: wrap, text: text, picker: picker, err: err };
  }

  function mount(el, opts) {
    opts = opts || {};
    var h = window.Chroma.h;
    var uid = 'cc-' + Math.random().toString(36).slice(2, 8);
    var fg = colorField(h, uid + '-fg', '文字色 Foreground（#RRGGBB）', opts.fg || '#202020');
    var bg = colorField(h, uid + '-bg', '背景色 Background（#RRGGBB）', opts.bg || '#F4F1E9');
    var sizeName = uid + '-size';
    var normal = h('input', { type: 'radio', name: sizeName, id: sizeName + '-n', value: 'normal', checked: '' });
    var large = h('input', { type: 'radio', name: sizeName, id: sizeName + '-l', value: 'large' });
    var sizes = h('fieldset', { class: 'field inline-choices' }, h('legend', null, '文字類型（由使用者判斷）'),
      h('label', { for: sizeName + '-n' }, normal, ' 一般文字'),
      h('label', { for: sizeName + '-l' }, large, ' 大型文字（約 ≥24px 或 ≥18.67px 粗體）'));
    var swap = h('button', { type: 'button', class: 'btn' }, '⇄ 交換前景／背景');
    var ratioOut = h('output', { class: 'ratio-big', 'aria-live': 'polite' });
    var preview = h('div', { class: 'contrast-preview' },
      h('p', { class: 'cp-large' }, '大型文字 Large Text 色彩'),
      h('p', { class: 'cp-normal' }, '一般內文 Normal text：好看不等於好讀。'));
    var statusBox = h('div', { class: 'contrast-status', 'aria-live': 'polite' });
    var note = h('p', { class: 'small muted' },
      '依 WCAG 2.2 相對亮度公式計算；以未四捨五入的比率判定，顯示值為無條件捨去至小數兩位。此工具只檢查一組文字與背景，不代表頁面完整符合 WCAG。',
      ' ', window.Chroma.citeLink('S009'), ' ', window.Chroma.citeLink('S010'));

    function update() {
      var f = CC.normalizeHex(fg.text.value), b = CC.normalizeHex(bg.text.value);
      [[fg, f], [bg, b]].forEach(function (pair) {
        var field = pair[0], ok = pair[1];
        field.text.setAttribute('aria-invalid', ok ? 'false' : 'true');
        field.err.textContent = ok ? '' : '請輸入 6 位 HEX，例如 #2855AA';
        if (ok) { field.picker.value = ok.toLowerCase(); }
      });
      var size = large.checked ? 'large' : 'normal';
      window.Chroma.clear(statusBox);
      if (!f || !b) {
        ratioOut.textContent = '—';
        preview.removeAttribute('style');
        preview.classList.add('is-invalid');
        statusBox.appendChild(h('p', { class: 'status is-invalid' }, '⚠ 色碼無效，不顯示合格狀態。'));
        el.setAttribute('data-ratio', '');
        return;
      }
      var r = CC.contrastRatio(f, b);
      preview.classList.remove('is-invalid');
      preview.style.color = f;
      preview.style.backgroundColor = b;
      ratioOut.textContent = CC.formatRatio(r);
      el.setAttribute('data-ratio', String(r));
      statusBox.appendChild(h('p', { class: 'small' }, (size === 'large' ? '大型文字' : '一般文字') + '：'));
      statusBox.appendChild(resultList(f, b, size));
    }
    [fg.text, bg.text, normal, large].forEach(function (i) { i.addEventListener('input', update); i.addEventListener('change', update); });
    swap.addEventListener('click', function () {
      var t = fg.text.value; fg.text.value = bg.text.value; bg.text.value = t; update();
    });
    el.appendChild(h('div', { class: 'widget-grid' },
      h('div', { class: 'widget-controls' }, fg.wrap, bg.wrap, sizes, swap),
      h('div', { class: 'widget-output' }, h('p', { class: 'label' }, '對比率 Contrast Ratio'), ratioOut, statusBox, preview)));
    el.appendChild(note);
    update();
    return { update: update, fg: fg.text, bg: bg.text };
  }

  window.ChromaContrast = { mount: mount, resultList: resultList };
})();
