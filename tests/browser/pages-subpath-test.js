// CHROMA Phase 6 — GitHub Pages repository sub-path compatibility (local simulation, not a deployment).
// Serves docs/ ONLY under /CHROMA/ (like https://<user>.github.io/CHROMA/); any request outside the
// prefix returns 404, so a root-absolute path would surface as a failed request.
//   NODE_PATH=<dir>/node_modules node tests/browser/pages-subpath-test.js
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const DOCS = path.resolve(__dirname, '..', '..', 'docs');
const PREFIX = '/CHROMA/';
const PAGES = ['index.html', 'slides.html', 'wiki.html', 'lab.html', 'workflow.html', 'references.html'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };

const outside = [];
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (!u.pathname.startsWith(PREFIX)) { outside.push(u.pathname); res.writeHead(404); res.end(); return; }
  let p = path.normalize(path.join(DOCS, decodeURIComponent(u.pathname.slice(PREFIX.length))));
  if (!p.startsWith(DOCS)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) { p = path.join(p, 'index.html'); }
  if (!fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

server.listen(0, '127.0.0.1', async () => {
  const base = 'http://127.0.0.1:' + server.address().port + PREFIX;
  const browser = await chromium.launch({ channel: process.env.CHROMA_BROWSER_CHANNEL || 'chrome', headless: true });
  const page = await browser.newPage();
  const problems = [];
  let requests = 0;
  page.on('request', () => { requests += 1; });
  page.on('response', (r) => { if (r.status() >= 400) { problems.push(r.status() + ' ' + r.url()); } });
  page.on('pageerror', (e) => problems.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') { problems.push('console ' + m.text()); } });
  const lines = [];
  // Directory URL (GitHub Pages serves index.html for /CHROMA/)
  await page.goto(base);
  lines.push((await page.title()) ? 'PASS | ' + PREFIX + ' serves index.html' : 'FAIL | ' + PREFIX);
  for (const p of PAGES) {
    await page.goto(base + p, { waitUntil: 'load' });
    const ok = await page.evaluate(() => !!window.CHROMA_DATA && document.querySelectorAll('#site-nav a').length === 6);
    // getAttribute + URL resolution: SVG <a> exposes href as SVGAnimatedString, not a string.
    const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('a[href], link[href], script[src]'))
      .map((e) => new URL(e.getAttribute('href') || e.getAttribute('src'), location.href).href)
      .filter((u) => u.startsWith(location.origin)));
    const escaped = hrefs.filter((u) => !new URL(u).pathname.startsWith('/CHROMA/'));
    lines.push((ok && !escaped.length ? 'PASS' : 'FAIL') + ' | ' + PREFIX + p + ' data+nav ok=' + ok + ', in-site URLs=' + hrefs.length + ', outside prefix=' + escaped.length);
    if (escaped.length) { problems.push(...escaped); }
  }
  // Follow every header nav link from the sub-path.
  await page.goto(base + 'index.html');
  for (const p of PAGES) {
    await page.click('#site-nav a[href="' + p + '"]');
    await page.waitForURL('**' + PREFIX + p + '*');
  }
  lines.push('PASS | header navigation stays under ' + PREFIX);
  await browser.close();
  server.close();
  const fail = problems.length || outside.length || lines.some((l) => l.startsWith('FAIL'));
  lines.forEach((l) => console.log(l));
  console.log((fail ? 'FAIL' : 'PASS') + ' | requests=' + requests + ', HTTP>=400/console problems=' + problems.length + ', requests outside ' + PREFIX + '=' + outside.length);
  problems.concat(outside).slice(0, 10).forEach((x) => console.log('  ' + x));
  process.exit(fail ? 1 : 0);
});
