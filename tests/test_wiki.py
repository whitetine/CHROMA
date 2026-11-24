import unittest, tempfile, shutil, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from validate_wiki import validate, ROOT
from validate_encoding import validate as encoding_validate
class WikiTests(unittest.TestCase):
    def test_baseline(self): self.assertTrue(all(ok for _,ok in validate()))
    def mutate(self, transform, expected):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'copy'; shutil.copytree(ROOT,root)
            p=next((root/'wiki/concepts').glob('M01-*.md'))
            text=p.read_text(encoding='utf-8'); p.write_text(transform(text),encoding='utf-8')
            self.assertIn(expected,[n for n,ok in validate(root) if not ok])
    def test_unknown_citation(self): self.mutate(lambda s:s.replace('[S003]','[S999]'),'M01 source refs')
    def test_missing_section(self): self.mutate(lambda s:s.replace('## 學習目標','## other'),'M01 sections')
    def test_cycle(self): self.mutate(lambda s:s.replace('prerequisites: []','prerequisites: ["M02"]'),'prerequisites acyclic')
    def test_broken_link(self): self.mutate(lambda s:s.replace('M02-color-models.md','M02-missing.md'),'wiki/concepts/M01-color-fundamentals.md local links')
    def test_unverified(self): self.mutate(lambda s:s.replace('status: "verified"','status: "draft"'),'M01 metadata')
    def test_encoding_baseline(self): self.assertEqual(encoding_validate(),[])
    def test_encoding_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/'bad.py').write_text('p.read_text()',encoding='utf-8')
            self.assertTrue(any('explicit UTF-8 required' in s for s in encoding_validate(root)))
if __name__=='__main__': unittest.main()
