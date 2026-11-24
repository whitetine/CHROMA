"""Check explicit UTF-8 for project text I/O before tests."""
import ast
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def validate(root=ROOT):
    issues=[]
    for p in sorted(root.rglob('*')):
        if not p.is_file() or any(x in ('.git','__pycache__') for x in p.parts): continue
        if p.suffix not in ('.py','.md','.json','.txt','.css','.js','.html'): continue
        try: text=p.read_text(encoding='utf-8')
        except UnicodeError:
            issues.append(f'{p.relative_to(root)}: invalid UTF-8'); continue
        if p.suffix!='.py': continue
        try: tree=ast.parse(text)
        except SyntaxError:
            issues.append(f'{p.relative_to(root)}: invalid Python'); continue
        for n in ast.walk(tree):
            if not isinstance(n,ast.Call): continue
            name=n.func.attr if isinstance(n.func,ast.Attribute) else n.func.id if isinstance(n.func,ast.Name) else ''
            if name not in ('read_text','write_text','open'): continue
            if name=='open':
                idx=0 if isinstance(n.func,ast.Attribute) else 1
                mode=next((k.value for k in n.keywords if k.arg=='mode'),n.args[idx] if len(n.args)>idx else ast.Constant('r'))
                if isinstance(mode,ast.Constant) and isinstance(mode.value,str) and 'b' in mode.value: continue
            if not any(k.arg=='encoding' and isinstance(k.value,ast.Constant) and k.value.value=='utf-8' for k in n.keywords): issues.append(f'{p.relative_to(root)}:{n.lineno}: explicit UTF-8 required')
    return issues
if __name__=='__main__':
    issues=validate()
    print('\n'.join(issues) if issues else 'PASS | UTF-8 files and explicit Python text I/O')
    raise SystemExit(bool(issues))
