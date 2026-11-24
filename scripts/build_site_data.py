"""Build docs/assets/data/chroma-data.js from verified Wiki, content and workflow records.

Phase 5. The output is plain data (strings, numbers, lists); the frontend renders it with
textContent / createElement only, so no Markdown or HTML from the knowledge base is injected
as markup. The build is deterministic (no timestamps) so validate_frontend.py can compare the
committed file against a fresh build.
"""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('docs/assets/data/chroma-data.js')

# Presentation grouping only (Phase 5 decision D005); slide order and content are unchanged.
CHAPTERS = [
    {'id': 'see', 'no': '01', 'title': 'SEE COLOR', 'title_zh': '看見色彩', 'slides': ['SL01', 'SL02', 'SL03']},
    {'id': 'think', 'no': '02', 'title': 'THINK COLOR', 'title_zh': '理解色彩', 'slides': ['SL04', 'SL05', 'SL06', 'SL07']},
    {'id': 'design', 'no': '03', 'title': 'DESIGN WITH COLOR', 'title_zh': '用色彩設計', 'slides': ['SL08', 'SL09', 'SL10', 'SL11', 'SL12']},
    {'id': 'experiment', 'no': '04', 'title': 'EXPERIMENT', 'title_zh': '實驗與驗收', 'slides': ['SL13', 'SL14']},
]

PUBLIC_SOURCE_FIELDS = ['source_id', 'title', 'author', 'organization', 'url', 'original_url', 'published_at',
                        'retrieved_at', 'source_type', 'language', 'license', 'status', 'modules', 'locator',
                        'summary', 'limitations', 'access_method']

WORKFLOW_FILES = {
    'graph_v1': 'workflow/graph-v1.md',
    'graph_v2': 'workflow/graph-v2.md',
    'graph_v3': 'workflow/graph-v3.md',
    'execution_log': 'workflow/execution-log.md',
    'error_log': 'workflow/error-log.md',
    'err_002': 'workflow/ERR-002.md',
    'decisions': 'workflow/decisions.md',
    'reflection': 'workflow/reflection.md',
    'validation_rules': 'workflow/validation-rules.md',
    'knowledge_review': 'workflow/knowledge-review.md',
    'content_review': 'workflow/content-review.md',
    'browser_checklist': 'tests/browser-checklist.md',
    'test_plan': 'tests/test-plan.md',
}

# Patterns that must never reach the public site (private local paths, credentials).
PRIVATE_PATTERNS = [
    re.compile(r'[A-Za-z]:\\+Users\\+', re.I),
    re.compile(r'[A-Za-z]:/Users/', re.I),
    re.compile(r'/c/Users/', re.I),
    re.compile(r'/home/[a-z0-9_-]+/', re.I),
    re.compile(r'AppData', re.I),
    re.compile(r'\bsk-[A-Za-z0-9]{16,}'),
    re.compile(r'\bAKIA[0-9A-Z]{16}\b'),
    re.compile(r'\bgh[pousr]_[A-Za-z0-9]{20,}'),
    re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'),
]


def read(root, rel):
    return (root / rel).read_text(encoding='utf-8')


def parse_front(text):
    _, front, body = text.split('---', 2)
    meta = {k: json.loads(v) for k, v in (line.split(': ', 1) for line in front.strip().splitlines())}
    return meta, body


LINK_RE = re.compile(r'\[([^\]\n]+)\]\(([^)\n]+)\)|\[(S\d{3})\]')


def inline(text):
    """Split a Markdown line into safe inline tokens."""
    tokens = []
    pos = 0
    for m in LINK_RE.finditer(text):
        if m.start() > pos:
            tokens.append({'t': 'text', 'v': text[pos:m.start()]})
        if m.group(3):
            tokens.append({'t': 'cite', 'id': m.group(3)})
        else:
            label, href = m.group(1), m.group(2)
            mod = re.match(r'^(?:\.\./concepts/|concepts/)?(M\d{2})-[a-z-]+\.md$', href)
            src = re.match(r'^(?:\.\./)*raw/articles/(S\d{3})\.md$', href)
            if mod:
                tokens.append({'t': 'module', 'id': mod.group(1), 'v': label})
            elif src:
                tokens.append({'t': 'cite', 'id': src.group(1)})
            elif href.startswith('https://'):
                tokens.append({'t': 'link', 'href': href, 'v': label})
            else:
                tokens.append({'t': 'text', 'v': label})
        pos = m.end()
    if pos < len(text):
        tokens.append({'t': 'text', 'v': text[pos:]})
    return tokens


def blocks(md):
    """Paragraphs and bullet lists from a small Markdown section."""
    out, para, items = [], [], []

    def flush():
        nonlocal para, items
        if para:
            out.append({'type': 'p', 'inline': inline(' '.join(para))})
        if items:
            out.append({'type': 'ul', 'items': [inline(i) for i in items]})
        para, items = [], []

    for line in md.strip().splitlines():
        s = line.strip()
        if not s:
            flush()
        elif s.startswith('- '):
            if para:
                out.append({'type': 'p', 'inline': inline(' '.join(para))})
                para = []
            items.append(s[2:])
        else:
            if items:
                flush()
            para.append(s)
    flush()
    return out


def build_modules(root):
    modules = []
    for p in sorted((root / 'wiki/concepts').glob('M*.md')):
        meta, body = parse_front(read(root, p.relative_to(root).as_posix()))
        if meta.get('status') not in ('verified', 'published'):
            raise ValueError(f'{p.name}: only verified/published Wiki may be built')
        sections = [{'heading': h.strip(), 'blocks': blocks(b)}
                    for h, b in re.findall(r'^## ([^\n]+)\n(.*?)(?=^## |\Z)', body, re.M | re.S)]
        title_line = re.search(r'^# (.+)$', body, re.M)
        modules.append({**{k: meta[k] for k in ('id', 'title', 'title_en', 'status', 'version', 'updated_at',
                                                 'sources', 'prerequisites', 'related')},
                        'heading': title_line.group(1).strip() if title_line else meta['title'],
                        'file': 'wiki/concepts/' + p.name,
                        'sections': sections})
    return modules


def build_glossary(root):
    rows = []
    for line in read(root, 'wiki/glossary.md').splitlines():
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) != 4 or cells[0] in ('術語',) or set(cells[0]) <= set('-'):
            continue
        mod = re.search(r'\[(M\d{2})\]', cells[2])
        src = re.findall(r'\[(S\d{3})\]', cells[3])
        term = cells[0]
        m = re.match(r'^(.*?)\s+([A-Za-z][A-Za-z \-’\']*)$', term)
        rows.append({'term': term, 'zh': m.group(1) if m else term, 'en': m.group(2) if m else '',
                     'definition': cells[1], 'module': mod.group(1) if mod else None, 'sources': src})
    return rows


def bullets(root, rel):
    return [line.strip()[2:] for line in read(root, rel).splitlines() if line.strip().startswith('- ')]


def parse_index(root):
    out = {}
    for line in read(root, 'wiki/index.md').splitlines():
        m = re.match(r'^- \[(M\d{2}) [^\]]+\]\([^)]+\)｜前置：(.+)$', line.strip())
        if m:
            out[m.group(1)] = [] if m.group(2).strip() == '無' else re.findall(r'M\d{2}', m.group(2))
    return out


def parse_mermaid(src):
    nodes, edges = {}, []
    node_re = r'([A-Za-z0-9_]+)(?:\[([^\]]*)\]|\{([^}]*)\})?'
    for line in src.splitlines():
        s = line.strip()
        if not s or s.startswith('flowchart'):
            continue
        m = re.match(node_re + r'\s*-->\s*(?:\|([^|]*)\|\s*)?' + node_re + r'$', s)
        if not m:
            raise ValueError('unsupported mermaid line: ' + s)
        a, al, ad, label, b, bl, bd = m.groups()
        for nid, rect, dec in ((a, al, ad), (b, bl, bd)):
            if nid not in nodes:
                nodes[nid] = {'id': nid, 'label': nid, 'shape': 'rect'}
            if rect is not None:
                nodes[nid].update(label=rect, shape='rect')
            if dec is not None:
                nodes[nid].update(label=dec, shape='decision')
        edges.append({'from': a, 'to': b, 'label': label or ''})
    return {'nodes': list(nodes.values()), 'edges': edges, 'source': src.strip()}


def graphs(root, rel):
    text = read(root, rel)
    return [parse_mermaid(b) for b in re.findall(r'```mermaid\n(.*?)```', text, re.S)]


def md_sections(text):
    """Split a log into level-2 sections; content stays plain text."""
    parts = re.split(r'^## ', text, flags=re.M)
    intro = parts[0].strip()
    secs = []
    for p in parts[1:]:
        head, _, body = p.partition('\n')
        secs.append({'heading': head.strip(), 'text': body.strip()})
    return {'intro': intro, 'sections': secs}


def check_private(payload_text):
    hits = [p.pattern for p in PRIVATE_PATTERNS if p.search(payload_text)]
    if hits:
        raise ValueError('private or secret-like content would be published: ' + ', '.join(hits))


def build(root=ROOT):
    slides = json.loads(read(root, 'content/slides.json'))
    quiz = json.loads(read(root, 'content/quiz-bank.json'))
    sources = json.loads(read(root, 'raw/sources.json'))
    chapter_of = {sid: c['id'] for c in CHAPTERS for sid in c['slides']}
    if [s['slide_id'] for s in slides] != [sid for c in CHAPTERS for sid in c['slides']]:
        raise ValueError('chapter grouping must cover the 14 slides in order')
    inputs = ['content/slides.json', 'content/quiz-bank.json', 'raw/sources.json', 'wiki/glossary.md',
              'wiki/index.md', 'wiki/knowledge-gaps.md'] + sorted(
        'wiki/concepts/' + p.name for p in (root / 'wiki/concepts').glob('M*.md')) + list(WORKFLOW_FILES.values())
    data = {
        'meta': {
            'project': 'CHROMA',
            'phase': 5,
            'generator': 'scripts/build_site_data.py',
            'note': '由已驗證 Wiki 與 Phase 4 教材確定性轉換；前端僅以文字節點呈現。',
            'inputs': [{'path': p, 'sha256': hashlib.sha256((root / p).read_bytes()).hexdigest()} for p in inputs],
        },
        'chapters': CHAPTERS,
        'slides': [{**s, 'chapter': chapter_of[s['slide_id']]} for s in slides],
        'quiz': quiz,
        'modules': build_modules(root),
        'prerequisite_index': parse_index(root),
        'glossary': build_glossary(root),
        'knowledge_gaps': bullets(root, 'wiki/knowledge-gaps.md'),
        'sources': [{k: s.get(k) for k in PUBLIC_SOURCE_FIELDS} for s in sources],
        'workflow': {
            'graph_v1': graphs(root, WORKFLOW_FILES['graph_v1']),
            'graph_v2': graphs(root, WORKFLOW_FILES['graph_v2']),
            'graph_v3': graphs(root, WORKFLOW_FILES['graph_v3']),
            'docs': {k: md_sections(read(root, v)) for k, v in WORKFLOW_FILES.items()},
        },
    }
    body = json.dumps(data, ensure_ascii=False, indent=1)
    check_private(body)
    return ('/* Generated by scripts/build_site_data.py — do not edit by hand. */\n'
            'window.CHROMA_DATA = ' + body + ';\n')


if __name__ == '__main__':
    out = ROOT / OUT
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(build(), encoding='utf-8', newline='\n')
    print('PASS | wrote ' + OUT.as_posix())
