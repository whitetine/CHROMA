"""Offline structure and citation validation; not semantic proof."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HEADS=['學習目標','核心定義','基礎理論','初學者解釋','視覺範例','設計應用','常見錯誤','適用限制','相關知識','參考來源','驗證紀錄']
def validate(root=ROOT):
    checks=[]
    def check(n,v): checks.append((n,bool(v)))
    reg={d['source_id']:d for d in json.loads((root/'raw/sources.json').read_text(encoding='utf-8'))}
    ids={f'M{i:02}' for i in range(1,9)}
    files=sorted((root/'wiki/concepts').glob('M*.md'))
    check('eight module files',len(files)==8 and {p.name[:3] for p in files}==ids)
    all_refs=set(); graph={}
    for p in files:
        mid=p.name[:3]; text=p.read_text(encoding='utf-8')
        try:
            _,front,body=text.split('---',2)
            meta={k:json.loads(v) for k,v in (line.split(': ',1) for line in front.strip().splitlines())}
        except (ValueError,TypeError):
            check(mid+' metadata',False); continue
        check(mid+' metadata',meta.get('id')==mid and meta.get('status') in ('verified','published') and all(meta.get(k) for k in ('title','title_en','version','created_at','updated_at')))
        sections=dict(re.findall(r'^## ([^\n]+)\n(.*?)(?=^## |\Z)',body,re.M|re.S))
        check(mid+' sections',all(sections.get(h,'').strip() for h in HEADS))
        prose=body.split('## 參考來源')[0]
        refs=set(re.findall(r'\[(S\d{3})\]',prose)); all_refs |= refs
        check(mid+' source refs',bool(refs) and refs==set(meta.get('sources',[])) and refs<=reg.keys() and all(mid in reg[s]['modules'] for s in refs if s in reg))
        check(mid+' source backlinks',all(f'[{s}](../../raw/articles/{s}.md)' in body for s in refs))
        pre=set(meta.get('prerequisites',[])); rel=set(meta.get('related',[])); graph[mid]=pre
        check(mid+' related IDs',(pre|rel)<=ids-{mid} and all(re.search(r'\['+x+r'\]\('+x+r'-[^)]+\.md\)',body) for x in pre|rel))
    def acyclic(n,stack): return n not in stack and all(acyclic(x,stack|{n}) for x in graph.get(n,[]))
    check('prerequisites acyclic',all(acyclic(n,set()) for n in graph))
    check('all sources integrated',all_refs==set(reg))
    index=(root/'wiki/index.md').read_text(encoding='utf-8')
    check('index includes modules',all(f'concepts/{p.name}' in index for p in files))
    for p in sorted((root/'wiki').rglob('*.md')):
        text=p.read_text(encoding='utf-8')
        links=re.findall(r'\[[^\]\n]+\]\(([^)\n]+)\)',text)
        check(p.relative_to(root).as_posix()+' local links',all((p.parent/link.split('#')[0]).exists() for link in links if not link.startswith(('https://','http://','#'))))
    approved={'index.html','slides.html','wiki.html','lab.html','workflow.html','references.html'}
    check('docs HTML limited to six approved entries',{p.relative_to(root/'docs').as_posix() for p in (root/'docs').rglob('*.html')}<=approved)
    check('phase 4 teaching data present',all(isinstance(json.loads((root/'content'/f).read_text(encoding='utf-8')),list) and bool(json.loads((root/'content'/f).read_text(encoding='utf-8'))) for f in ('slides.json','quiz-bank.json')))
    return checks
if __name__=='__main__':
    checks=validate()
    for n,ok in checks: print(('PASS' if ok else 'FAIL')+' | '+n)
    print(f'{sum(ok for _,ok in checks)}/{len(checks)} checks passed')
    raise SystemExit(not all(ok for _,ok in checks))
