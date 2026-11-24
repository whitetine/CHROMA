"""Structural traceability checks, not independent semantic proof."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def validate(root=ROOT):
    checks=[]
    def ck(n,v): checks.append((n,bool(v)))
    def load(p): return json.loads((root/p).read_text(encoding='utf-8'))
    sources={d['source_id'] for d in load('raw/sources.json') if d['status']=='ingested'}
    wiki={}
    for p in (root/'wiki/concepts').glob('M*.md'):
        _,front,body=p.read_text(encoding='utf-8').split('---',2)
        meta={k:json.loads(v) for k,v in (line.split(': ',1) for line in front.strip().splitlines())}
        wiki[meta['id']]=(meta,dict(re.findall(r'^## ([^\n]+)\n(.*?)(?=^## |\Z)',body,re.M|re.S)))
    def trace(c):
        mid=c.get('wiki_ref'); refs=c.get('source_refs',[]); kind=c.get('kind'); meta,sections=wiki.get(mid,({},{})); section=sections.get(c.get('section'),'')
        if not section.strip() or meta.get('status') not in ('verified','published'): return False
        if kind=='knowledge': return bool(refs) and set(refs)<=sources and set(refs)<=set(meta['sources']) and all('['+s+']' in section for s in refs)
        return kind in ('project_rule','original_example') and not refs and (('專案' in section or 'CHROMA' in section or '原創' in section))
    slides=load('content/slides.json'); quiz=load('content/quiz-bank.json')
    ck('14 ordered slides',[s.get('slide_id') for s in slides]==[f'SL{i:02}' for i in range(1,15)])
    ck('eight modules covered',set(m for s in slides for m in s['wiki_refs'])==set(wiki))
    spec=(root/'content/interaction-spec.md').read_text(encoding='utf-8')
    outline=(root/'content/slide-outline.md').read_text(encoding='utf-8'); objectives=(root/'content/learning-objectives.md').read_text(encoding='utf-8')
    for s in slides:
        sid=s['slide_id']; claims=s['claims']; ck(sid+' fields',all(s.get(k) for k in ('title','objective','example','visual')) and s.get('status')=='reviewed' and (bool(claims) or sid=='SL01'))
        ck(sid+' trace',all(c.get('text') and trace(c) for c in claims) and set(s['wiki_refs'])=={c['wiki_ref'] for c in claims} and set(s['source_refs'])=={x for c in claims for x in c['source_refs']})
        ck(sid+' outline and interaction',sid+' '+s['title'] in outline and s['objective'] in objectives and (s['interaction'] is None or '| '+s['interaction']+' |' in spec))
    ck('eight quiz IDs and modules',[q['id'] for q in quiz]==[f'Q{i:02}' for i in range(1,9)] and {q['wiki_ref'] for q in quiz}==set(wiki))
    for q in quiz:
        ck(q['id']+' answer and trace',trace(q) and bool(q['question']) and bool(q['explanation']) and len(q['options'])==len(set(q['options']))==4 and all(q['options']) and type(q['correct_index']) is int and 0<=q['correct_index']<4)
    approved={'index.html','slides.html','wiki.html','lab.html','workflow.html','references.html'}
    ck('docs HTML limited to six approved entries',{p.relative_to(root/'docs').as_posix() for p in (root/'docs').rglob('*.html')}<=approved)
    return checks
if __name__=='__main__':
    results=validate()
    for n,ok in results: print(('PASS' if ok else 'FAIL')+' | '+n)
    print(f'{sum(ok for _,ok in results)}/{len(results)} checks passed')
    raise SystemExit(not all(ok for _,ok in results))
