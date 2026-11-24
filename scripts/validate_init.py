"""Phase 1 only: structural checks, not knowledge or browser validation."""
from pathlib import Path
import json
import sys
ROOT = Path(__file__).resolve().parents[1]
checks = []
def check(name, condition):
    checks.append(bool(condition))
    print(('PASS' if condition else 'FAIL') + ' | ' + name)
for name in ('AGENTS.md','README.md','PROJECT_SPEC.md','.gitignore','workflow/graph-v1.md','workflow/decisions.md','templates/source.md','templates/wiki-module.md','docs/.nojekyll'):
    check(name, (ROOT/name).is_file())
for name in ('raw/articles','wiki/concepts','wiki/applications','wiki/sources','content','workflow','scripts','tests','docs/assets/css','docs/assets/js','docs/assets/illustrations'):
    check(name+' directory', (ROOT/name).is_dir())
for name in ('raw/sources.json','content/slides.json','content/quiz-bank.json'):
    try:
        check(name+' empty JSON array', json.loads((ROOT/name).read_text(encoding='utf-8')) == [])
    except (ValueError,OSError):
        check(name+' empty JSON array', False)
check('no HTML', not list(ROOT.rglob('*.html')))
check('no ingested articles', not list((ROOT/'raw/articles').glob('*.md')))
check('no generated wiki modules', not list((ROOT/'wiki/concepts').glob('*.md')) and not list((ROOT/'wiki/applications').glob('*.md')))
print(f'{sum(checks)}/{len(checks)} checks passed')
sys.exit(0 if all(checks) else 1)
