import unittest, tempfile, shutil, json, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from validate_sources import validate, ROOT
class SourceTests(unittest.TestCase):
    def test_baseline(self): self.assertTrue(all(ok for _,ok in validate()))
    def mutate(self, fn, expected):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'copy'; shutil.copytree(ROOT,root)
            f=root/'raw/sources.json'; data=json.loads(f.read_text(encoding='utf-8')); fn(data,root); f.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
            self.assertIn(expected,[n for n,ok in validate(root) if not ok])
    def test_duplicate(self): self.mutate(lambda d,r:d.append(d[0]),'approved IDs S001–S010')
    def test_missing_license(self): self.mutate(lambda d,r:d[0].update(license=''),'S001 metadata')
    def test_tamper(self): self.mutate(lambda d,r:(r/d[0]['path']).write_text('modified', encoding='utf-8'),'S001 file hash')
    def test_unknown_module(self): self.mutate(lambda d,r:d[0].update(modules=['M99']),'S001 date and modules')
    def test_unapproved_html(self): self.mutate(lambda d,r:(r/'docs/extra.html').write_text('test', encoding='utf-8'),'docs HTML limited to six approved entries')
