"""Phase 5 static frontend validation for docs/ (offline; not a browser test or semantic proof).

Checks: six entries, UTF-8 charset, local resources and in-site links, no external runtime
dependencies, generated data in sync with Wiki/content, slide/Wiki/source traceability, the 11
P0+P1 features and the approved P2 export, no unsafe HTML injection APIs, no private data or
credentials, verified text-colour pairs, reduced-motion support and licensed (original) assets.
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_site_data  # noqa: E402

ENTRIES = ['index.html', 'slides.html', 'wiki.html', 'lab.html', 'workflow.html', 'references.html']
P0 = ['hsl', 'wheel', 'harmony', 'contrast-check']
P1 = ['rgb', 'contrast-illusion', 'ratio', 'design-compare', 'association', 'design-lab', 'quiz']
P2 = ['export']
TEXT_EXT = ('.html', '.css', '.js', '.json', '.md', '.svg', '.txt')
UNSAFE_JS = [r'\.innerHTML\b', r'\.outerHTML\b', r'insertAdjacentHTML', r'document\.write', r'\beval\s*\(', r'new\s+Function\s*\(']
NETWORK_JS = [r'\bfetch\s*\(', r'XMLHttpRequest', r'\bimport\s*\(', r'WebSocket', r'navigator\.sendBeacon', r'EventSource']


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.ids, self.meta, self.lang, self.scripts = [], set(), [], None, []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html':
            self.lang = a.get('lang')
        if tag == 'meta':
            self.meta.append(a)
        if 'id' in a:
            self.ids.add(a['id'])
        for k in ('href', 'src', 'action', 'poster', 'data'):
            if k in a and a[k] is not None:
                self.refs.append((tag, k, a[k], a.get('rel')))
        if tag == 'script' and a.get('src'):
            self.scripts.append(a['src'])


def lin(c):
    c = c / 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def ratio(a, b):
    def lum(hx):
        r, g, bl = (int(hx[i:i + 2], 16) for i in (1, 3, 5))
        return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl)
    x, y = sorted((lum(a), lum(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)


def validate(root=ROOT):
    checks = []

    def ck(name, ok):
        checks.append((name, bool(ok)))

    docs = root / 'docs'
    ck('six HTML entries and .nojekyll', all((docs / e).is_file() for e in ENTRIES) and (docs / '.nojekyll').is_file())
    ck('docs HTML limited to six approved entries', {p.relative_to(docs).as_posix() for p in docs.rglob('*.html')} == set(ENTRIES))

    data_file = docs / 'assets/data/chroma-data.js'
    try:
        fresh = build_site_data.build(root)
        current = data_file.read_text(encoding='utf-8') if data_file.is_file() else ''
        ck('generated data in sync with wiki/content/workflow', fresh == current)
        data = json.loads(current[current.index('=') + 1:].rstrip().rstrip(';')) if current else {}
    except (ValueError, KeyError, json.JSONDecodeError) as exc:
        ck('generated data in sync with wiki/content/workflow (' + type(exc).__name__ + ')', False)
        data = {}

    slides = data.get('slides', [])
    modules = {m['id']: m for m in data.get('modules', [])}
    sources = {s['source_id'] for s in data.get('sources', [])}
    feature_ids = P0 + P1 + P2
    hash_targets = {
        'slides.html': {s.get('slide_id') for s in slides} | {''},
        'wiki.html': set(modules) | {m + '/' + s['heading'] for m in modules for s in modules[m]['sections']},
        'references.html': set(sources),
        'lab.html': set(feature_ids),
    }

    parsed = {}
    for e in ENTRIES:
        p = docs / e
        if not p.is_file():
            continue
        try:
            text = p.read_text(encoding='utf-8')
        except UnicodeError:
            ck(e + ' UTF-8', False)
            continue
        lp = Links()
        lp.feed(text)
        parsed[e] = (text, lp)
        hash_targets.setdefault(e, set()).update(lp.ids)

    for e, (text, lp) in parsed.items():
        charset = [m for m in lp.meta if 'charset' in m]
        ck(e + ' meta charset UTF-8 first', len(charset) == 1 and charset[0]['charset'] == 'UTF-8' and text.find('<meta charset="UTF-8">') < text.find('<title>'))
        ck(e + ' lang zh-Hant, viewport, title', lp.lang == 'zh-Hant' and any(m.get('name') == 'viewport' for m in lp.meta) and '<title>' in text)
        ck(e + ' site navigation has six entries', all(f'href="{x}"' in text for x in ENTRIES) and 'id="site-nav"' in text)
        bad, external_res = [], []
        for tag, attr, url, rel in lp.refs:
            u = urlparse(url)
            if u.scheme in ('http', 'https'):
                if tag != 'a':
                    external_res.append(url)
                continue
            if u.scheme in ('mailto', 'javascript', 'data', 'file') or url.startswith('/') or '\\' in url:
                bad.append(url)
                continue
            path, frag = u.path, unquote(u.fragment)
            target = (docs / e).parent / path if path else docs / e
            if path and not target.resolve().is_file():
                bad.append(url)
                continue
            name = Path(path).name if path else e
            if frag and name in hash_targets and frag not in hash_targets[name]:
                bad.append(url)
        ck(e + ' local resources and links resolve', not bad)
        ck(e + ' no external runtime resources', not external_res)
        if bad:
            print('  broken: ' + ', '.join(bad[:8]))
        for s in lp.scripts:
            ck(e + ' script exists ' + s, (docs / s).is_file())

    referenced = {s for _, lp in parsed.values() for s in lp.scripts}
    js_files = sorted((docs / 'assets/js').glob('*.js'))
    ck('every JS module is referenced by a page', all('assets/js/' + p.name in referenced for p in js_files))

    # Content traceability (from the generated data, which is checked against the sources above).
    ck('14 slides match content/slides.json order', [s.get('slide_id') for s in slides] == [f'SL{i:02}' for i in range(1, 15)])
    chapters = data.get('chapters', [])
    ck('four chapters cover slides in order', [c['title'] for c in chapters] == ['SEE COLOR', 'THINK COLOR', 'DESIGN WITH COLOR', 'EXPERIMENT']
       and [x for c in chapters for x in c['slides']] == [s.get('slide_id') for s in slides])
    ck('eight verified modules in site data', sorted(modules) == [f'M{i:02}' for i in range(1, 9)] and all(m['status'] in ('verified', 'published') for m in modules.values()))
    trace_ok = True
    for s in slides:
        for c in s.get('claims', []):
            secs = {x['heading'] for x in modules.get(c['wiki_ref'], {}).get('sections', [])}
            if c['section'] not in secs or not set(c['source_refs']) <= sources:
                trace_ok = False
        if not set(s.get('wiki_refs', [])) <= set(modules) or not set(s.get('source_refs', [])) <= sources:
            trace_ok = False
    ck('slide Wiki sections and Source IDs valid', trace_ok)
    quiz = data.get('quiz', [])
    ck('quiz Wiki and Source refs valid', len(quiz) == 8 and all(q['wiki_ref'] in modules and set(q['source_refs']) <= sources for q in quiz))
    ck('glossary and sources present', len(data.get('glossary', [])) >= 20 and sources == {f'S{i:03}' for i in range(1, 11)})
    cites_ok = all(t.get('id') in sources for m in modules.values() for sec in m['sections'] for b in sec['blocks']
                   for t in (b.get('inline', []) + [x for it in b.get('items', []) for x in it]) if t.get('t') == 'cite')
    ck('Wiki inline citations resolve to S001–S010', cites_ok)

    # Features
    lab_html = parsed.get('lab.html', ('', None))[0]
    lab_js = (docs / 'assets/js/lab.js').read_text(encoding='utf-8') if (docs / 'assets/js/lab.js').is_file() else ''
    for prio, ids in (('P0', P0), ('P1', P1), ('P2', P2)):
        for fid in ids:
            ck(f'{prio} feature {fid} on lab.html and registered',
               f'data-feature="{fid}" data-priority="{prio}"' in lab_html and f'data-mount="{fid}"' in lab_html and f"register('{fid}'" in lab_js)
    ck('every slide interaction is a registered P0/P1 feature', all((s['interaction'] is None) or s['interaction'] in P0 + P1 for s in slides))
    cu = (docs / 'assets/js/color-utils.js').read_text(encoding='utf-8') if (docs / 'assets/js/color-utils.js').is_file() else ''
    ck('P2 export: HEX copy, CSS variables, JSON download',
       all(k in cu for k in ('paletteToCss', 'paletteToJson', 'paletteHexList')) and all(k in lab_js for k in ('copyText', 'download(', 'paletteToCss', 'paletteToJson')))
    ck('WCAG formula constants present', all(k in cu for k in ('0.04045', '12.92', '0.055', '1.055', '2.4', '0.2126', '0.7152', '0.0722', '0.05')))
    ck('harmony angles labelled as CHROMA tool settings', 'CHROMA 工具設定' in cu and '工具設定' in lab_js)
    ck('60-30-10 labelled as rule of thumb', '經驗法則' in lab_js and '經驗法則' in lab_html)
    ck('contrast tool disclaims full WCAG compliance', '不代表頁面完整符合 WCAG' in (docs / 'assets/js/contrast.js').read_text(encoding='utf-8'))
    psych = re.findall(r"register\('association'[\s\S]*?\n  \}\);", lab_js)
    negated = '不宣稱色彩必然造成某種情緒或具有醫療效果'
    ck('psychology copy keeps disclaimers and avoids certainty / medical claims',
       bool(psych) and all(k in psych[0] for k in (negated, '不評定人格', '不提供心理診斷', '聯想'))
       and not re.search(r'(必然|必定|一定會|保證|療效|治療)', psych[0].replace(negated, '')))

    # Safety / privacy / network
    unsafe, network, private, binaries = [], [], [], []
    for p in sorted(docs.rglob('*')):
        if not p.is_file():
            continue
        rel = p.relative_to(root).as_posix()
        if p.suffix.lower() in ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.mp4', '.woff', '.woff2', '.ttf', '.otf'):
            binaries.append(rel)
            continue
        if p.name in ('.nojekyll', '.gitkeep') and not p.read_bytes().strip():
            continue
        if p.suffix.lower() not in TEXT_EXT:
            binaries.append(rel)
            continue
        text = p.read_text(encoding='utf-8')
        for pat in build_site_data.PRIVATE_PATTERNS:
            if pat.search(text):
                private.append(rel + ' ~ ' + pat.pattern)
        if p == data_file:
            # Generated data: must be exactly one comment + one JSON assignment, so prose inside
            # strings (e.g. decision records naming APIs) cannot execute; verified structurally.
            m = re.fullmatch(r'/\*[^*]*\*/\nwindow\.CHROMA_DATA = (\{.*\});\n', text, re.S)
            try:
                ok_struct = bool(m) and isinstance(json.loads(m.group(1)), dict)
            except json.JSONDecodeError:
                ok_struct = False
            if not ok_struct:
                unsafe.append(rel + ' is not a single JSON data assignment')
        elif p.suffix == '.js':
            unsafe += [rel + ' ' + u for u in UNSAFE_JS if re.search(u, text)]
            network += [rel + ' ' + u for u in NETWORK_JS if re.search(u, text)]
        if p.suffix == '.css':
            if re.search(r'@import|url\(\s*["\']?(https?:)?//', text):
                network.append(rel + ' css import/url')
    ck('no innerHTML / document.write / eval in site JS', not unsafe)
    ck('no network requests in site JS or CSS', not network)
    ck('no private paths, e-mail addresses or credential patterns', not private)
    ck('no raster or font assets of unverified licence', not binaries)
    for line in unsafe + network + private + binaries:
        print('  issue: ' + line)

    # Colour tokens
    tokens = (docs / 'assets/css/tokens.css').read_text(encoding='utf-8') if (docs / 'assets/css/tokens.css').is_file() else ''
    values = dict(re.findall(r'--([a-z-]+):\s*(#[0-9A-Fa-f]{6});', tokens))
    block = re.search(r'@text-pairs(.*?)@end', tokens, re.S)
    pairs = re.findall(r'\*\s*([a-z-]+)/([a-z-]+)\s+(normal|large)', block.group(1)) if block else []
    fails = [f'{a}/{b}={ratio(values[a], values[b]):.3f}' for a, b, size in pairs
             if a not in values or b not in values or ratio(values[a], values[b]) < (4.5 if size == 'normal' else 3)] if pairs else ['none']
    ck('design-token text pairs meet WCAG AA', not fails)
    if fails:
        print('  contrast: ' + ', '.join(fails))
    base = (docs / 'assets/css/base.css').read_text(encoding='utf-8') if (docs / 'assets/css/base.css').is_file() else ''
    slides_css = (docs / 'assets/css/slides.css').read_text(encoding='utf-8') if (docs / 'assets/css/slides.css').is_file() else ''
    ck('prefers-reduced-motion supported', 'prefers-reduced-motion: reduce' in base and 'prefers-reduced-motion: reduce' in slides_css)
    ck('focus-visible styles present', ':focus-visible' in base)
    slides_js = (docs / 'assets/js/slides.js').read_text(encoding='utf-8') if (docs / 'assets/js/slides.js').is_file() else ''
    ck('deck keyboard / hash / fullscreen handlers', all(k in slides_js for k in ("'ArrowRight'", "'ArrowLeft'", "'Home'", "'End'", 'isEditable', 'hashchange', 'requestFullscreen', 'exitFullscreen')))
    return checks


if __name__ == '__main__':
    results = validate()
    for n, ok in results:
        print(('PASS' if ok else 'FAIL') + ' | ' + n)
    print(f'{sum(ok for _, ok in results)}/{len(results)} checks passed')
    raise SystemExit(not all(ok for _, ok in results))
