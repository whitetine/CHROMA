import json,shutil,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from validate_content import validate, ROOT
class ContentTests(unittest.TestCase):
    def test_baseline(self): self.assertTrue(all(ok for _,ok in validate()))
    def mutate(self,file,fn,expected):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)/'copy'; shutil.copytree(ROOT,root)
            p=root/'content'/file; d=json.loads(p.read_text(encoding='utf-8')); fn(d); p.write_text(json.dumps(d,ensure_ascii=False),encoding='utf-8')
            self.assertIn(expected,[n for n,ok in validate(root) if not ok])
    def test_unknown_source(self): self.mutate('slides.json',lambda d:d[1]['claims'][0].update(source_refs=['S999']),'SL02 trace')
    def test_wrong_section(self): self.mutate('slides.json',lambda d:d[1]['claims'][0].update(section='學習目標'),'SL02 trace')
    def test_missing_slide(self): self.mutate('slides.json',lambda d:d.pop(),'14 ordered slides')
    def test_invalid_answer(self): self.mutate('quiz-bank.json',lambda d:d[0].update(correct_index=4),'Q01 answer and trace')
    def test_missing_source(self): self.mutate('slides.json',lambda d:d[1]['claims'][0].update(source_refs=[]),'SL02 trace')
    def test_wrong_interaction(self): self.mutate('slides.json',lambda d:d[1].update(interaction='missing'),'SL02 outline and interaction')
