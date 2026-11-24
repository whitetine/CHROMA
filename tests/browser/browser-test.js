// CHROMA Phase 5 browser tests (real Chrome via playwright-core).
// playwright-core is NOT a project dependency. Install it outside the repo and point NODE_PATH at it:
//   npm install --prefix <dir> playwright-core
//   NODE_PATH=<dir>/node_modules node tests/browser/browser-test.js
// Uses the locally installed Google Chrome (channel "chrome"); set CHROMA_BROWSER_CHANNEL=msedge for Edge.
// Serves docs/ with Node's built-in http module on 127.0.0.1 (no backend logic).
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const OUT = process.env.CHROMA_EVIDENCE_DIR || path.join(ROOT, 'workflow', 'evidence', 'phase5');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8' };
const PAGES = ['index.html', 'slides.html', 'wiki.html', 'lab.html', 'workflow.html', 'references.html'];
const results = [];
const consoleIssues = [];

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://x');
      let p = path.normalize(path.join(DOCS, decodeURIComponent(u.pathname)));
      if (!p.startsWith(DOCS)) { res.writeHead(403); res.end(); return; }
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) { p = path.join(p, 'index.html'); }
      if (!fs.existsSync(p)) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function check(name, fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    results.push({ name, status: 'PASS', ms: Date.now() - t0, detail: detail || '' });
  } catch (err) {
    results.push({ name, status: 'FAIL', ms: Date.now() - t0, detail: String(err && err.message || err).slice(0, 400) });
  }
}
function assert(cond, msg) { if (!cond) { throw new Error(msg); } }

function watch(page, label) {
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { consoleIssues.push({ page: label, type: m.type(), text: m.text() }); } });
  page.on('pageerror', (e) => consoleIssues.push({ page: label, type: 'pageerror', text: e.message }));
  page.on('requestfailed', (r) => consoleIssues.push({ page: label, type: 'requestfailed', text: r.url() }));
  page.on('response', (r) => { if (r.status() >= 400) { consoleIssues.push({ page: label, type: 'http' + r.status(), text: r.url() }); } });
}

(async () => {
  const server = await serve();
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: process.env.CHROMA_BROWSER_CHANNEL || 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base.replace(/\/$/, '') });
  const page = await context.newPage();
  watch(page, 'main');

  // 1. Six pages load and navigate.
  await check('six pages load with title, h1/main and six nav links', async () => {
    const out = [];
    for (const p of PAGES) {
      await page.goto(base + p, { waitUntil: 'load' });
      const nav = await page.locator('#site-nav a').count();
      const h = await page.locator('main').isVisible();
      const charset = await page.evaluate(() => document.characterSet);
      assert(nav === 6 && h && charset === 'UTF-8', p + ' nav=' + nav + ' main=' + h + ' charset=' + charset);
      out.push(p);
    }
    return out.join(', ');
  });
  await check('header navigation reaches every page and marks aria-current', async () => {
    await page.goto(base + 'index.html');
    for (const p of PAGES) {
      await page.click('#site-nav a[href="' + p + '"]');
      await page.waitForURL('**/' + p + '*');
      const cur = await page.getAttribute('#site-nav a[aria-current="page"]', 'href');
      assert(cur === p, 'aria-current=' + cur + ' on ' + p);
    }
  });
  await check('mobile menu toggle opens/closes at 360px', async () => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(base + 'index.html');
    assert(!(await page.locator('#site-nav').isVisible()), 'nav visible before toggle');
    await page.click('[data-nav-toggle]');
    assert(await page.locator('#site-nav').isVisible(), 'nav hidden after toggle');
    await page.keyboard.press('Escape');
    assert(!(await page.locator('#site-nav').isVisible()), 'Escape did not close nav');
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  // 2. Slides.
  const cur = () => page.getAttribute('#deck', 'data-current');
  await check('deck renders 14 slides and starts at SL01', async () => {
    await page.goto(base + 'slides.html');
    const n = await page.locator('.slide').count();
    assert(n === 14, 'slides=' + n);
    assert((await cur()) === 'SL01', 'current=' + (await cur()));
    assert((await page.locator('.slide:not([hidden])').count()) === 1, 'more than one visible slide');
  });
  await check('fresh load and #SL06 load are not scrolled by native fragment jump', async () => {
    for (const u of ['slides.html', 'slides.html#SL06']) {
      const p3 = await context.newPage();
      await p3.goto(base + u);
      await p3.waitForTimeout(300);
      const y = await p3.evaluate(() => window.scrollY);
      await p3.close();
      assert(y === 0, u + ' scrollY=' + y);
    }
  });
  await check('keyboard ArrowRight/ArrowLeft/End/Home/PageDown', async () => {
    await page.locator('body').click({ position: { x: 5, y: 300 } });
    await page.keyboard.press('ArrowRight'); assert((await cur()) === 'SL02', 'Right→' + (await cur()));
    await page.keyboard.press('ArrowLeft'); assert((await cur()) === 'SL01', 'Left→' + (await cur()));
    await page.keyboard.press('End'); assert((await cur()) === 'SL14', 'End→' + (await cur()));
    await page.keyboard.press('Home'); assert((await cur()) === 'SL01', 'Home→' + (await cur()));
    await page.keyboard.press('PageDown'); assert((await cur()) === 'SL02', 'PageDown→' + (await cur()));
    assert(page.url().endsWith('#SL02'), 'hash=' + page.url());
  });
  await check('prev/next buttons, progress and boundary disabling', async () => {
    await page.goto(base + 'slides.html#SL01');
    assert(await page.isDisabled('#prev-btn'), 'prev enabled on first slide');
    await page.click('#next-btn'); await page.click('#next-btn');
    assert((await cur()) === 'SL03', 'after 2 next=' + (await cur()));
    const now = await page.getAttribute('#progress', 'aria-valuenow');
    assert(now === '3', 'aria-valuenow=' + now);
    assert((await page.textContent('#deck-count')).trim() === '03 / 14', 'count text');
    await page.click('#prev-btn'); assert((await cur()) === 'SL02', 'prev→' + (await cur()));
  });
  await check('URL hash positioning (direct load #SL12, #7, hashchange)', async () => {
    await page.goto(base + 'slides.html#SL12');
    assert((await cur()) === 'SL12', 'direct=' + (await cur()));
    await page.goto(base + 'slides.html#7');
    assert((await cur()) === 'SL07', '#7=' + (await cur()));
    await page.evaluate(() => { location.hash = '#SL09'; });
    await page.waitForFunction(() => document.getElementById('deck').getAttribute('data-current') === 'SL09');
  });
  await check('chapter menu and jump select go to a chosen slide', async () => {
    await page.click('#chapter-btn');
    assert(await page.isVisible('#chapter-panel'), 'panel hidden');
    await page.click('#chapter-panel a[href="#SL10"]');
    assert((await cur()) === 'SL10', 'menu→' + (await cur()));
    assert(!(await page.isVisible('#chapter-panel')), 'panel still open');
    await page.selectOption('#jump-select', '4');
    assert((await cur()) === 'SL05', 'jump→' + (await cur()));
  });
  await check('arrow keys inside form controls are not intercepted (SL04 slider, hue input)', async () => {
    await page.goto(base + 'slides.html#SL04');
    const slider = page.locator('#slide-SL04 input[type="range"]').first();
    await slider.focus();
    const before = Number(await slider.inputValue());
    await page.keyboard.press('ArrowRight');
    const after = Number(await slider.inputValue());
    assert((await cur()) === 'SL04', 'slide changed to ' + (await cur()));
    assert(after === before + 1, 'slider ' + before + '→' + after);
    const num = page.locator('#slide-SL04 input[type="number"]');
    await num.fill('390'); await num.press('Enter'); await num.press('Tab');
    assert((await cur()) === 'SL04', 'typing changed slide');
    assert((await slider.inputValue()) === '30', 'hue 390 → ' + (await slider.inputValue()));
    await page.locator('#slide-SL04 h2').focus();
    await page.keyboard.press('ArrowRight');
    assert((await cur()) === 'SL05', 'heading focus → ' + (await cur()));
  });
  await check('every slide shows refs and mounts its interaction without error', async () => {
    await page.goto(base + 'slides.html#SL01');
    const missing = [];
    for (let i = 0; i < 14; i += 1) {
      const id = await cur();
      const vis = page.locator('#slide-' + id);
      if (!(await vis.locator('.slide-refs').count())) { missing.push(id + ':refs'); }
      const w = vis.locator('.slide-widget');
      if (await w.count()) {
        const ready = await w.getAttribute('data-ready');
        if (ready !== 'true') { missing.push(id + ':widget'); }
      }
      await page.keyboard.press('ArrowRight');
    }
    assert(!missing.length, missing.join(', '));
    return '14 slides visited';
  });
  await check('fullscreen enter and exit', async () => {
    await page.goto(base + 'slides.html#SL02');
    await page.click('#fs-btn');
    await page.waitForFunction(() => document.fullscreenElement === document.getElementById('deck'), null, { timeout: 3000 });
    assert((await page.getAttribute('#fs-btn', 'aria-pressed')) === 'true', 'aria-pressed not true');
    await page.keyboard.press('ArrowRight');
    assert((await cur()) === 'SL03', 'nav in fullscreen');
    await page.click('#fs-btn');
    await page.waitForFunction(() => !document.fullscreenElement, null, { timeout: 3000 });
    assert((await page.getAttribute('#fs-btn', 'aria-pressed')) === 'false', 'aria-pressed not reset');
  });

  // 3. Lab interactions.
  await page.goto(base + 'lab.html');
  const W = (id) => page.locator('[data-mount="' + id + '"]');
  await check('HSL: red, gray at S=0, black/white at L ends, reset', async () => {
    const r = W('hsl').locator('input[type="range"]');
    await r.nth(0).fill('0'); await r.nth(1).fill('100'); await r.nth(2).fill('50');
    assert((await W('hsl').getAttribute('data-hex')) === '#FF0000', 'red ' + (await W('hsl').getAttribute('data-hex')));
    await r.nth(1).fill('0');
    assert((await W('hsl').getAttribute('data-hex')) === '#808080', 'gray ' + (await W('hsl').getAttribute('data-hex')));
    await r.nth(2).fill('0'); assert((await W('hsl').getAttribute('data-hex')) === '#000000', 'black');
    await r.nth(2).fill('100'); assert((await W('hsl').getAttribute('data-hex')) === '#FFFFFF', 'white');
    await W('hsl').getByRole('button', { name: /重設/ }).click();
    assert((await W('hsl').getAttribute('data-hex')) === '#FF0000', 'reset');
    const num = W('hsl').locator('input[type="number"]');
    await num.fill('-30'); await num.press('Enter');
    assert((await r.nth(0).inputValue()) === '330', '-30→' + (await r.nth(0).inputValue()));
  });
  await check('Wheel: RYB red↔green and HSL red↔cyan labels', async () => {
    const t = await W('wheel').textContent();
    assert(/紅 Red ↔ 對向 綠 Green/.test(t), 'RYB label');
    assert(/0°（#FF0000）↔ 對向 180°（#00FFFF）/.test(t), 'HSL label');
    await W('wheel').locator('label:has-text("RYB 傳統教學色輪")').click();
    assert(!(await W('wheel').locator('[data-model="hsl"]').isVisible()), 'HSL panel visible in RYB view');
  });
  await check('Harmony: six schemes, triadic and complementary palettes', async () => {
    const r = W('harmony').locator('input[type="range"]');
    await r.nth(0).fill('0'); await r.nth(1).fill('100'); await r.nth(2).fill('50');
    const labels = await W('harmony').locator('.choice').count();
    assert(labels === 6, 'scheme options=' + labels);
    await W('harmony').locator('label:has-text("三角色")').click();
    assert((await W('harmony').getAttribute('data-palette')) === '#FF0000,#00FF00,#0000FF', 'triadic ' + (await W('harmony').getAttribute('data-palette')));
    await W('harmony').locator('label:has-text("互補色")').click();
    assert((await W('harmony').getAttribute('data-palette')) === '#FF0000,#00FFFF', 'complementary');
    await r.nth(0).fill('350'); await W('harmony').locator('label:has-text("類似色")').click();
    const sw = await W('harmony').locator('.swatch-label').allTextContents();
    assert(sw.join(',') === '320°,350°,20°', 'analogous ' + sw.join(','));
  });
  await check('Contrast: 21:1, 1:1, invalid HEX shows no pass', async () => {
    const [fg, bg] = [W('contrast-check').locator('.hex-input').nth(0), W('contrast-check').locator('.hex-input').nth(1)];
    await fg.fill('#000000'); await bg.fill('#FFFFFF');
    assert((await W('contrast-check').locator('.ratio-big').textContent()) === '21.00:1', 'bw');
    assert((await W('contrast-check').locator('.status.is-pass').count()) === 2, 'AA+AAA pass');
    await bg.fill('#000000');
    assert((await W('contrast-check').locator('.ratio-big').textContent()) === '1.00:1', 'same');
    await fg.fill('#777777'); await bg.fill('#FFFFFF');
    const aa = await W('contrast-check').locator('.status[data-level="AA"]').getAttribute('class');
    assert(/is-fail/.test(aa), '#777777/white should fail AA (4.48)');
    await fg.fill('#12');
    assert((await W('contrast-check').locator('.ratio-big').textContent()) === '—', 'invalid ratio');
    assert((await W('contrast-check').locator('.status.is-pass').count()) === 0, 'pass shown for invalid');
    assert((await fg.getAttribute('aria-invalid')) === 'true', 'aria-invalid');
    await fg.fill('#202020'); await bg.fill('#F4F1E9');
  });
  await check('RGB: all 255 white, presets black', async () => {
    const r = W('rgb').locator('input[type="range"]');
    await r.nth(0).fill('255'); await r.nth(1).fill('255'); await r.nth(2).fill('255');
    assert((await W('rgb').getAttribute('data-hex')) === '#FFFFFF', 'white');
    await W('rgb').getByRole('button', { name: '全 0' }).click();
    assert((await W('rgb').getAttribute('data-hex')) === '#000000', 'black');
  });
  await check('Simultaneous contrast: chips stay #888888, reveal reversible', async () => {
    const chips = W('contrast-illusion').locator('.illusion-chip');
    const col = async () => chips.evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundColor));
    assert((await col()).every((c) => c === 'rgb(136, 136, 136)'), 'before ' + (await col()));
    const btn = W('contrast-illusion').locator('button[aria-pressed]');
    await btn.click(); assert((await btn.getAttribute('aria-pressed')) === 'true', 'pressed');
    assert((await col()).every((c) => c === 'rgb(136, 136, 136)'), 'after');
    await btn.click(); assert((await btn.getAttribute('aria-pressed')) === 'false', 'reversible');
  });
  await check('60-30-10: sum stays 100, clamps, resets', async () => {
    const r = W('ratio').locator('input[type="range"]');
    await r.nth(0).fill('80');
    assert((await W('ratio').getAttribute('data-ratio')) === '80-20-0', 'clamp ' + (await W('ratio').getAttribute('data-ratio')));
    await r.nth(1).fill('5');
    assert((await W('ratio').getAttribute('data-ratio')) === '80-5-15', 'remainder');
    await W('ratio').getByRole('button', { name: /重設/ }).click();
    assert((await W('ratio').getAttribute('data-ratio')) === '60-30-10', 'reset');
  });
  await check('Design compare: every state keeps text ≥ 4.5:1 (computed styles)', async () => {
    const box = W('design-compare');
    const worst = [];
    for (const hier of ['A 無層級', 'B 明確層級']) {
      for (const pal of ['多色競爭', '一致色票']) {
        for (const acc of ['藍', '紅', '黃']) {
          await box.locator('label:has-text("' + hier + '")').click();
          await box.locator('label:has-text("' + pal + '")').click();
          await box.locator('fieldset:has-text("強調色") label:has-text("' + acc + '")').click();
          const min = await box.locator('.compare-card').evaluate((card) => {
            const C = window.ChromaColor;
            const toHex = (s) => { const m = s.match(/\d+/g).map(Number); return C.rgbToHex(m[0], m[1], m[2]); };
            const bgOf = (el) => { while (el) { const b = getComputedStyle(el).backgroundColor; if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) { return toHex(b); } el = el.parentElement; } return '#FFFFFF'; };
            let m = 99;
            card.querySelectorAll('p, h4, span').forEach((el) => { m = Math.min(m, C.contrastRatio(toHex(getComputedStyle(el).color), bgOf(el))); });
            return m;
          });
          if (min < 4.5) { worst.push(hier + '/' + pal + '/' + acc + '=' + min.toFixed(2)); }
        }
      }
    }
    assert(!worst.length, worst.join('; '));
    return '12 states checked';
  });
  await check('Association: choice shows research note without diagnosis', async () => {
    await W('association').locator('label:has-text("平靜")').first().click();
    const t = await W('association').locator('.assoc-result').textContent();
    assert(/你的聯想/.test(t) && /聯想，不是實際情緒改變/.test(t), t.slice(0, 120));
  });
  await check('Design lab: default pairs pass AA; low-contrast button text is flagged', async () => {
    assert((await W('design-lab').getAttribute('data-all-pass')) === 'true', 'default not all-pass');
    const onAccent = W('design-lab').locator('.hex-input').nth(4);
    await onAccent.fill('#FFFFFF');
    assert((await W('design-lab').getAttribute('data-all-pass')) === 'false', 'white on #E8792B should fail');
    assert((await W('design-lab').locator('tr[data-pass="false"]').count()) >= 1, 'no failing row');
    await onAccent.fill('#202020');
  });
  await check('Quiz: 8/8 when correct, 7/8 with one wrong, reset clears', async () => {
    const quiz = await page.evaluate(() => window.CHROMA_DATA.quiz.map((q) => ({ id: q.id, c: q.correct_index })));
    const box = W('quiz');
    for (const q of quiz) { await box.locator('fieldset[data-qid="' + q.id + '"] input[type="radio"]').nth(q.c).check(); }
    await box.getByRole('button', { name: /提交/ }).click();
    assert(/得分 8 \/ 8/.test(await box.locator('.quiz-score').textContent()), await box.locator('.quiz-score').textContent());
    assert((await box.locator('fieldset[data-result="correct"]').count()) === 8, 'correct marks');
    await box.locator('fieldset[data-qid="Q01"] input[type="radio"]').nth((quiz[0].c + 1) % 4).check();
    await box.getByRole('button', { name: /提交/ }).click();
    assert(/得分 7 \/ 8/.test(await box.locator('.quiz-score').textContent()), 'one wrong');
    assert((await box.locator('.quiz-feedback a.mod-link').count()) === 8, 'wiki links in feedback');
    await box.getByRole('button', { name: /重設/ }).click();
    assert((await box.locator('input:checked').count()) === 0, 'still checked');
    assert((await box.locator('fieldset[data-result]').count()) === 0, 'result marks remain');
  });
  await check('Export: copy HEX / CSS to clipboard and download valid JSON', async () => {
    const r = W('harmony').locator('input[type="range"]');
    await r.nth(0).fill('0'); await r.nth(1).fill('100'); await r.nth(2).fill('50');
    await W('harmony').locator('label:has-text("三角色")').click();
    const ex = W('export');
    assert((await ex.getAttribute('data-count')) === '3', 'count ' + (await ex.getAttribute('data-count')));
    await ex.getByRole('button', { name: '複製全部 HEX' }).click();
    await page.waitForFunction(() => /已複製|瀏覽器未允許/.test(document.querySelector('[data-mount="export"] [role="status"]').textContent));
    const clip1 = await page.evaluate(() => navigator.clipboard.readText());
    assert(clip1 === '#FF0000, #00FF00, #0000FF', 'clipboard ' + clip1);
    await ex.getByRole('button', { name: '複製 CSS Variables' }).click();
    await page.waitForTimeout(150);
    const clip2 = await page.evaluate(() => navigator.clipboard.readText());
    assert(/--chroma-base: #FF0000;/.test(clip2) && clip2.startsWith(':root {'), 'css ' + clip2);
    const [dl] = await Promise.all([page.waitForEvent('download'), ex.getByRole('button', { name: /下載 JSON/ }).click()]);
    const file = await dl.path();
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    const ok = await page.evaluate((j) => window.ChromaColor.validatePaletteJson(j), json);
    assert(ok && json.scheme === 'triadic' && dl.suggestedFilename() === 'chroma-palette-triadic.json', 'json ' + JSON.stringify(json).slice(0, 120));
    return dl.suggestedFilename();
  });

  // 4. Wiki / Sources / Workflow.
  await check('Wiki: module render, section hash, search, glossary, prereq graph', async () => {
    await page.goto(base + 'wiki.html#M07');
    assert(/色彩與無障礙設計/.test(await page.textContent('#module-title')), 'M07 title');
    await page.goto(base + 'wiki.html#M03/' + encodeURIComponent('基礎理論'));
    assert(await page.locator('[id="M03/基礎理論"]').isVisible(), 'section anchor');
    await page.fill('#wiki-search', 'WCAG');
    const n = await page.locator('#search-results li').count();
    assert(n > 0, 'no search hits');
    await page.fill('#wiki-search', 'Lightness');
    assert((await page.locator('#search-results li').count()) > 0, 'no English hits');
    assert((await page.locator('#glossary-body tr').count()) === 23, 'glossary rows');
    assert((await page.locator('#prereq-graph svg a').count()) === 8, 'graph nodes');
    const cites = await page.locator('#wiki-article a.cite').count();
    assert(cites > 0, 'no citations');
    return 'search hits (WCAG)=' + n;
  });
  await check('Sources: S001–S010 with license, filter by module, hash focus', async () => {
    await page.goto(base + 'references.html#S006');
    assert((await page.locator('.source-item').count()) === 10, 'items');
    assert(await page.locator('#S006').isVisible(), 'S006');
    const lic = await page.locator('.source-item dt:has-text("授權")').count();
    assert(lic === 10, 'licenses ' + lic);
    await page.click('button[data-m="M04"]');
    assert((await page.locator('.source-item:visible').count()) === 2, 'M04 filter');
    await page.click('button[data-m=""]');
    assert((await page.locator('.source-item:visible').count()) === 10, 'all');
  });
  await check('Workflow: Graph V1, V2, sub-flow, V3 SVGs and records rendered', async () => {
    await page.goto(base + 'workflow.html');
    const svgs = await page.locator('.graph-figure svg').count();
    assert(svgs === 4, 'graphs=' + svgs);
    const rec = await page.locator('#exec-log details').count();
    assert(rec >= 5, 'records=' + rec);
    const errs = await page.locator('#error-log details').count();
    assert(errs >= 2, 'errors=' + errs);
    const body = await page.textContent('main');
    assert(/ERR-001/.test(body) && /ERR-002/.test(body) && /CP950/.test(body), 'ERR text');
    // ERR-007 regression: no label over a node or another label; no edge through a non-endpoint node.
    const overlaps = await page.evaluate(() => {
      const out = [];
      const inter = (a, b, m) => a.x < b.x + b.width - m && b.x < a.x + a.width - m && a.y < b.y + b.height - m && b.y < a.y + a.height - m;
      document.querySelectorAll('.graph-figure svg').forEach((svg, gi) => {
        const nodes = Array.from(svg.querySelectorAll('.g-node')).map((n) => ({ id: n.getAttribute('data-id'), b: n.getBBox() }));
        const labels = Array.from(svg.querySelectorAll('.g-label')).map((l) => l.getBBox());
        labels.forEach((l, i) => {
          nodes.forEach((n) => { if (inter(l, n.b, 1)) { out.push('g' + gi + ' label' + i + '∩' + n.id); } });
          labels.forEach((l2, j) => { if (j > i && inter(l, l2, 1)) { out.push('g' + gi + ' label' + i + '∩label' + j); } });
        });
        svg.querySelectorAll('.g-edge').forEach((p) => {
          const from = p.getAttribute('data-from'), to = p.getAttribute('data-to'), len = p.getTotalLength();
          for (let s = 0; s <= len; s += 3) {
            const pt = p.getPointAtLength(s);
            nodes.forEach((n) => {
              if (n.id === from || n.id === to) { return; }
              if (pt.x > n.b.x + 2 && pt.x < n.b.x + n.b.width - 2 && pt.y > n.b.y + 2 && pt.y < n.b.y + n.b.height - 2) { out.push('g' + gi + ' ' + from + '→' + to + ' through ' + n.id); }
            });
          }
        });
      });
      return Array.from(new Set(out));
    });
    assert(!overlaps.length, 'graph overlaps: ' + overlaps.slice(0, 8).join(', '));
    return 'graphs=4 records=' + rec + ' overlap-free';
  });

  // 5. Responsive + reduced motion.
  for (const w of [360, 768, 1024, 1440]) {
    await check('responsive ' + w + 'px: no horizontal overflow on six pages (+ deck slides)', async () => {
      await page.setViewportSize({ width: w, height: w < 800 ? 800 : 900 });
      const bad = [];
      for (const p of PAGES) {
        await page.goto(base + p);
        await page.waitForTimeout(80);
        const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (o > 1) { bad.push(p + '+' + o + 'px'); }
        if (w === 360 || w === 1440) {
          await page.waitForTimeout(650); // let the 520ms page fade-in finish
          await page.screenshot({ path: path.join(OUT, p.replace('.html', '') + '-' + w + '.png') });
        }
      }
      for (const sid of ['SL04', 'SL07', 'SL12', 'SL13']) {
        await page.goto(base + 'slides.html#' + sid);
        const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (o > 1) { bad.push('slides#' + sid + '+' + o + 'px'); }
      }
      assert(!bad.length, bad.join(', '));
    });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await check('prefers-reduced-motion disables decorative animation', async () => {
    const ctx2 = await browser.newContext({ reducedMotion: 'reduce' });
    const p2 = await ctx2.newPage();
    watch(p2, 'reduced');
    await p2.goto(base + 'index.html');
    const anim = await p2.evaluate(() => getComputedStyle(document.querySelector('.geo-spin')).animationName);
    const toggleShown = await p2.locator('#motion-toggle').isVisible();
    await p2.goto(base + 'slides.html#SL01');
    await p2.keyboard.press('ArrowRight');
    const entering = await p2.locator('#slide-SL02.is-entering').count();
    await ctx2.close();
    assert(anim === 'none' && !toggleShown && entering === 0, 'anim=' + anim + ' toggle=' + toggleShown + ' entering=' + entering);
  });
  await check('home animation pause control', async () => {
    await page.goto(base + 'index.html');
    await page.click('#motion-toggle');
    const st = await page.evaluate(() => getComputedStyle(document.querySelector('.geo-spin')).animationPlayState);
    assert(st === 'paused', 'state=' + st);
  });
  await check('file:// (no server): six pages render data without errors', async () => {
    const p4 = await context.newPage();
    const errs = [];
    p4.on('pageerror', (e) => errs.push(e.message));
    p4.on('console', (m) => { if (m.type() === 'error') { errs.push(m.text()); } });
    for (const p of PAGES) {
      await p4.goto('file:///' + path.join(DOCS, p).replace(/\\/g, '/'));
      const hasData = await p4.evaluate(() => !!window.CHROMA_DATA && !document.querySelector('.notice[role="alert"]'));
      assert(hasData, p + ' data missing');
    }
    assert((await p4.evaluate(() => document.querySelectorAll('.source-item').length)) === 10, 'references not rendered');
    await p4.close();
    assert(!errs.length, errs.slice(0, 3).join(' | '));
  });
  await check('browser console: no errors, page errors or failed requests', async () => {
    const errs = consoleIssues.filter((c) => c.type !== 'warning');
    assert(!errs.length, JSON.stringify(errs.slice(0, 5)));
    return 'warnings=' + consoleIssues.filter((c) => c.type === 'warning').length;
  });

  await browser.close();
  server.close();
  const summary = { run_at: new Date().toISOString(), browser: (process.env.CHROMA_BROWSER_CHANNEL || 'chrome') + ' (headless, playwright-core)',
    node: process.version, platform: process.platform, total: results.length,
    pass: results.filter((r) => r.status === 'PASS').length, fail: results.filter((r) => r.status === 'FAIL').length,
    results, console_issues: consoleIssues };
  fs.writeFileSync(path.join(OUT, 'browser-results.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
  for (const r of results) { console.log(r.status + ' | ' + r.name + (r.status === 'FAIL' || r.detail ? ' — ' + r.detail : '')); }
  console.log(summary.pass + '/' + summary.total + ' browser checks passed');
  process.exit(summary.fail ? 1 : 0);
})().catch((e) => { console.error('BLOCKED | ' + e.message); process.exit(2); });
