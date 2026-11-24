/*
 * CHROMA quiz (P1 · interaction "quiz"). Questions come from content/quiz-bank.json
 * via the generated data file; each answer explanation links to its Wiki module.
 * scoreQuiz() is pure so tests/js can verify scoring without a browser.
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; }
  else { root.ChromaQuiz = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** answers: { Q01: 0, Q02: 1, ... } (option index). Unanswered counts as incorrect. */
  function scoreQuiz(questions, answers) {
    answers = answers || {};
    var results = questions.map(function (q) {
      var has = Object.prototype.hasOwnProperty.call(answers, q.id);
      var sel = has ? answers[q.id] : null;
      var valid = typeof sel === 'number' && sel >= 0 && sel < q.options.length && Math.floor(sel) === sel;
      return { id: q.id, selected: valid ? sel : null, correct: valid && sel === q.correct_index,
        answered: valid, correct_index: q.correct_index };
    });
    var score = results.filter(function (r) { return r.correct; }).length;
    return { score: score, total: questions.length, answered: results.filter(function (r) { return r.answered; }).length,
      results: results };
  }

  function mount(el, questions, opts) {
    opts = opts || {};
    var C = (typeof window !== 'undefined') ? window.Chroma : null;
    var h = C.h;
    var uid = 'quiz-' + Math.random().toString(36).slice(2, 8);
    var form = h('form', { class: 'quiz', novalidate: '', 'aria-describedby': uid + '-hint' });
    var hint = h('p', { class: 'small muted', id: uid + '-hint' },
      '八題單選，對應 M01–M08。建議 6/8 作為自我複習目標，非正式課程評分。');
    form.appendChild(hint);
    var fields = questions.map(function (q, qi) {
      var fs = h('fieldset', { class: 'quiz-q', 'data-qid': q.id });
      fs.appendChild(h('legend', null, h('span', { class: 'quiz-no' }, q.id), ' ', q.question));
      q.options.forEach(function (opt, oi) {
        var id = uid + '-' + q.id + '-' + oi;
        fs.appendChild(h('label', { class: 'quiz-opt', for: id },
          h('input', { type: 'radio', name: uid + '-' + q.id, id: id, value: String(oi) }),
          h('span', null, String.fromCharCode(65 + oi) + '. ' + opt)));
      });
      var fb = h('div', { class: 'quiz-feedback', 'aria-live': 'polite', hidden: '' });
      fs.appendChild(fb);
      form.appendChild(fs);
      return { q: q, fs: fs, fb: fb, qi: qi };
    });
    var status = h('p', { class: 'quiz-score', role: 'status', 'aria-live': 'polite' });
    var submit = h('button', { type: 'submit', class: 'btn btn-primary' }, '提交答案 Submit');
    var reset = h('button', { type: 'button', class: 'btn' }, '重設 Reset');
    form.appendChild(h('div', { class: 'quiz-actions' }, submit, reset, status));

    function collect() {
      var a = {};
      fields.forEach(function (f) {
        var c = f.fs.querySelector('input:checked');
        if (c) { a[f.q.id] = Number(c.value); }
      });
      return a;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var res = scoreQuiz(questions, collect());
      res.results.forEach(function (r, i) {
        var f = fields[i];
        f.fb.hidden = false;
        C.clear(f.fb);
        f.fs.setAttribute('data-result', r.correct ? 'correct' : (r.answered ? 'wrong' : 'unanswered'));
        var label = r.correct ? '✓ 正確' : (r.answered ? '✗ 不正確' : '— 未作答');
        var ans = String.fromCharCode(65 + f.q.correct_index) + '. ' + f.q.options[f.q.correct_index];
        f.fb.appendChild(h('p', null, h('strong', null, label), '　正確答案：' + ans));
        var ref = h('p', { class: 'small' }, f.q.explanation + ' ');
        ref.appendChild(C.moduleLink(f.q.wiki_ref, f.q.wiki_ref + '｜' + f.q.section));
        if (f.q.source_refs.length) {
          f.q.source_refs.forEach(function (s) { ref.appendChild(document.createTextNode(' ')); ref.appendChild(C.citeLink(s)); });
        } else {
          ref.appendChild(h('span', { class: 'tag' }, ' ' + (f.q.kind === 'project_rule' ? 'CHROMA 專案規則' : f.q.kind)));
        }
        f.fb.appendChild(ref);
      });
      status.textContent = '得分 ' + res.score + ' / ' + res.total + '（已作答 ' + res.answered + ' 題）';
      if (opts.onScore) { opts.onScore(res); }
    });
    reset.addEventListener('click', function () {
      form.reset();
      fields.forEach(function (f) { f.fb.hidden = true; C.clear(f.fb); f.fs.removeAttribute('data-result'); });
      status.textContent = '已重設，可重新作答。';
    });
    el.appendChild(form);
    return { form: form, collect: collect };
  }

  return { scoreQuiz: scoreQuiz, mount: mount };
});
