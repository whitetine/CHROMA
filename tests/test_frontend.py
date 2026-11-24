"""Phase 5 frontend validator tests: baseline plus mutations that must each be rejected."""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from validate_frontend import validate, ROOT  # noqa: E402
import build_site_data  # noqa: E402


class FrontendTests(unittest.TestCase):
    def test_baseline(self):
        failed = [n for n, ok in validate() if not ok]
        self.assertEqual(failed, [])

    def mutate(self, fn, expected):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / 'copy'
            shutil.copytree(ROOT, root, ignore=shutil.ignore_patterns('.git', '__pycache__', 'node_modules'))
            fn(root)
            failed = [n for n, ok in validate(root) if not ok]
            self.assertIn(expected, failed)

    @staticmethod
    def edit(root, rel, old, new):
        p = root / rel
        text = p.read_text(encoding='utf-8')
        assert old in text, (rel, old)
        p.write_text(text.replace(old, new, 1), encoding='utf-8')

    def test_missing_entry(self):
        self.mutate(lambda r: (r / 'docs/wiki.html').unlink(), 'six HTML entries and .nojekyll')

    def test_extra_html(self):
        self.mutate(lambda r: (r / 'docs/draft.html').write_text('<!DOCTYPE html>', encoding='utf-8'), 'docs HTML limited to six approved entries')

    def test_missing_charset(self):
        self.mutate(lambda r: self.edit(r, 'docs/lab.html', '<meta charset="UTF-8">', '<meta charset="big5">'), 'lab.html meta charset UTF-8 first')

    def test_broken_link(self):
        self.mutate(lambda r: self.edit(r, 'docs/index.html', 'href="wiki.html#M01"', 'href="wiki.html#M99"'), 'index.html local resources and links resolve')

    def test_absolute_path(self):
        self.mutate(lambda r: self.edit(r, 'docs/index.html', 'href="assets/css/base.css"', 'href="/assets/css/base.css"'), 'index.html local resources and links resolve')

    def test_external_script(self):
        self.mutate(lambda r: self.edit(r, 'docs/index.html', '</head>', '<script src="https://cdn.example.com/x.js"></script></head>'), 'index.html no external runtime resources')

    def test_stale_data(self):
        def fn(r):
            p = r / 'content/slides.json'
            d = json.loads(p.read_text(encoding='utf-8'))
            d[3]['example'] = '已修改但未重新建置'
            p.write_text(json.dumps(d, ensure_ascii=False), encoding='utf-8')
        self.mutate(fn, 'generated data in sync with wiki/content/workflow')

    def test_missing_feature(self):
        self.mutate(lambda r: self.edit(r, 'docs/lab.html', 'data-mount="ratio"', 'data-mount="removed"'), 'P1 feature ratio on lab.html and registered')

    def test_missing_export(self):
        self.mutate(lambda r: self.edit(r, 'docs/assets/js/lab.js', "register('export'", "register('exp0rt'"), 'P2 feature export on lab.html and registered')

    def test_inner_html(self):
        self.mutate(lambda r: self.edit(r, 'docs/assets/js/home.js', "'use strict';", "'use strict'; document.body.innerHTML = '';"), 'no innerHTML / document.write / eval in site JS')

    def test_code_in_data_file(self):
        self.mutate(lambda r: (r / 'docs/assets/data/chroma-data.js').write_text(
            (r / 'docs/assets/data/chroma-data.js').read_text(encoding='utf-8') + "document.write('x');\n", encoding='utf-8'),
            'no innerHTML / document.write / eval in site JS')

    def test_network_call(self):
        self.mutate(lambda r: self.edit(r, 'docs/assets/js/home.js', "'use strict';", "'use strict'; fetch('x');"), 'no network requests in site JS or CSS')

    def test_private_path(self):
        path = 'C:' + '\\\\' + 'Users' + '\\\\' + 'someone' + '\\\\' + 'x'
        self.mutate(lambda r: (r / 'docs/README.md').write_text(path, encoding='utf-8'), 'no private paths, e-mail addresses or credential patterns')

    def test_api_key(self):
        key = 'sk-' + 'A1b2C3d4E5f6G7h8I9j0'
        self.mutate(lambda r: (r / 'docs/assets/js/home.js').write_text('var k="' + key + '";', encoding='utf-8'), 'no private paths, e-mail addresses or credential patterns')

    def test_raster_asset(self):
        self.mutate(lambda r: (r / 'docs/assets/illustrations/photo.png').write_bytes(b'\x89PNG'), 'no raster or font assets of unverified licence')

    def test_low_contrast_token_pair(self):
        self.mutate(lambda r: self.edit(r, 'docs/assets/css/tokens.css', ' * ink/red large', ' * yellow/canvas normal'), 'design-token text pairs meet WCAG AA')

    def test_psychology_certainty(self):
        self.mutate(lambda r: self.edit(r, 'docs/assets/js/lab.js', '研究常見：黃色常與', '黃色必然帶來'), 'psychology copy keeps disclaimers and avoids certainty / medical claims')

    def test_build_rejects_private_content(self):
        with self.assertRaises(ValueError):
            build_site_data.check_private('see ' + 'C:' + '\\' + 'Users' + '\\' + 'x')

    @unittest.skipUnless(shutil.which('node'), 'Node.js not installed')
    def test_js_color_math(self):
        out = subprocess.run(['node', '--test', str(ROOT / 'tests/js/color-utils.test.js')], capture_output=True, text=True, encoding='utf-8')
        self.assertEqual(out.returncode, 0, out.stdout[-2000:] + out.stderr[-2000:])


if __name__ == '__main__':
    unittest.main()
