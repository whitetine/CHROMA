"""Offline source registry integrity checks; not a semantic or live URL audit."""
import json, re, hashlib
from pathlib import Path
from datetime import date
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]

def validate(root=ROOT):
    data=json.loads((root/'raw/sources.json').read_text(encoding='utf-8'))
    checks=[]
    def check(name,ok): checks.append((name,bool(ok)))
    ids=[d.get('source_id') for d in data]
    check('approved IDs S001–S010',set(ids)=={f'S{i:03}' for i in range(1,11)} and len(ids)==10)
    check('unique URLs',len({d.get('url') for d in data})==len(data))
    modules={f'M{i:02}' for i in range(1,9)}
    index=(root/'wiki/sources/sources-index.md').read_text(encoding='utf-8')
    for d in data:
        sid=d['source_id']; f=root/d['path']
        check(sid+' metadata',all(d.get(k) for k in ('title','author','organization','url','retrieved_at','license','locator','summary','limitations','access_method')) and urlparse(d['url']).scheme=='https' and d['status']=='ingested')
        try: date.fromisoformat(d['retrieved_at']); valid=True
        except (ValueError,TypeError): valid=False
        check(sid+' date and modules',valid and bool(d['modules']) and set(d['modules'])<=modules)
        check(sid+' file hash',f.is_file() and hashlib.sha256(f.read_bytes()).hexdigest()==d['sha256'])
        text=f.read_text(encoding='utf-8') if f.is_file() else ''
        check(sid+' citation and index',f'[{sid}]' in text and d['summary'] in text and d['url'] in index and d['path'] in index)
    check('all eight modules covered',set(m for d in data for m in d['modules'])==modules)
    check('phase 3 wiki modules allowed', len(list((root/'wiki/concepts').glob('M*.md'))) == 8)
    approved={'index.html','slides.html','wiki.html','lab.html','workflow.html','references.html'}
    check('docs HTML limited to six approved entries',{p.relative_to(root/'docs').as_posix() for p in (root/'docs').rglob('*.html')}<=approved)
    check('phase 4 teaching data present',all(isinstance(json.loads((root/'content'/f).read_text(encoding='utf-8')),list) and bool(json.loads((root/'content'/f).read_text(encoding='utf-8'))) for f in ('slides.json','quiz-bank.json')))
    return checks
if __name__=='__main__':
    checks=validate()
    for n,ok in checks: print(('PASS' if ok else 'FAIL')+' | '+n)
    print(f'{sum(ok for _,ok in checks)}/{len(checks)} checks passed')
    raise SystemExit(0 if all(ok for _,ok in checks) else 1)
