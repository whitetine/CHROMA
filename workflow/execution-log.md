# 執行紀錄

尚未執行完整 Graph。初始化檢查結果將附於本文件。

## INIT-001
- Phase: 1
- Action: python scripts/validate_init.py
- Result: PASS（僅初始化結構）
- Exit code: 0
- Actual output:
```text
PASS | AGENTS.md
PASS | README.md
PASS | PROJECT_SPEC.md
PASS | .gitignore
PASS | workflow/graph-v1.md
PASS | workflow/decisions.md
PASS | templates/source.md
PASS | templates/wiki-module.md
PASS | docs/.nojekyll
PASS | raw/articles directory
PASS | wiki/concepts directory
PASS | wiki/applications directory
PASS | wiki/sources directory
PASS | content directory
PASS | workflow directory
PASS | scripts directory
PASS | tests directory
PASS | docs/assets/css directory
PASS | docs/assets/js directory
PASS | docs/assets/illustrations directory
PASS | raw/sources.json empty JSON array
PASS | content/slides.json empty JSON array
PASS | content/quiz-bank.json empty JSON array
PASS | no HTML
PASS | no ingested articles
PASS | no generated wiki modules
26/26 checks passed
```

## ING-001 — 2026-11-24
- Phase: 2; Graph: V1; Executor: LLM + Python
- Input: approved S001–S010
- Actual: retrieved relevant web text, created 10 source notes, registry and source index. S006 required alternate institutional entry (ERR-001). No formal Wiki modules or HTML generated.
- Validation: offline structural integrity only; not independent semantic review or live link audit.
- Commands and exit codes: validate_sources.py=0; unittest=0

```text
PASS | approved IDs S001–S010
PASS | unique URLs
PASS | S001 metadata
PASS | S001 date and modules
PASS | S001 file hash
PASS | S001 citation and index
PASS | S002 metadata
PASS | S002 date and modules
PASS | S002 file hash
PASS | S002 citation and index
PASS | S003 metadata
PASS | S003 date and modules
PASS | S003 file hash
PASS | S003 citation and index
PASS | S004 metadata
PASS | S004 date and modules
PASS | S004 file hash
PASS | S004 citation and index
PASS | S005 metadata
PASS | S005 date and modules
PASS | S005 file hash
PASS | S005 citation and index
PASS | S006 metadata
PASS | S006 date and modules
PASS | S006 file hash
PASS | S006 citation and index
PASS | S007 metadata
PASS | S007 date and modules
PASS | S007 file hash
PASS | S007 citation and index
PASS | S008 metadata
PASS | S008 date and modules
PASS | S008 file hash
PASS | S008 citation and index
PASS | S009 metadata
PASS | S009 date and modules
PASS | S009 file hash
PASS | S009 citation and index
PASS | S010 metadata
PASS | S010 date and modules
PASS | S010 file hash
PASS | S010 citation and index
PASS | all eight modules covered
PASS | no formal wiki modules
PASS | no HTML
PASS | no generated teaching data
46/46 checks passed
test_baseline (test_sources.SourceTests.test_baseline) ... ok
test_duplicate (test_sources.SourceTests.test_duplicate) ... ok
test_early_html (test_sources.SourceTests.test_early_html) ... ok
test_missing_license (test_sources.SourceTests.test_missing_license) ... ok
test_tamper (test_sources.SourceTests.test_tamper) ... ok
test_unknown_module (test_sources.SourceTests.test_unknown_module) ... ok

----------------------------------------------------------------------
Ran 6 tests in 0.077s

OK

```
- Next: human approval before Phase 3.

## WIN-001 — 2026-11-24
使用者提供 Windows Python 3.11 截圖：原指令重新執行，6 tests in 1.513s，OK。證據：[截圖（Phase 6 已遮蔽本機路徑）](evidence/WIN-001-redacted.png)；未遮蔽原檔僅保留於本機並由 .gitignore 排除。此前 1 PASS、5 ERROR（ERR-002）。本次未直接操作使用者電腦。

## WIKI-001 — 2026-11-24
Phase 3 / Graph V2 / Linux container / Python 3.13.5。從 Phase 2 ZIP 讀取十份摘要，整合八模組，未重新抓取原文。先執行靜態編碼檢查，再執行來源及 Wiki 驗證與單元測試。以下皆實際 exit code 0。

### python scripts/validate_encoding.py
```text
PASS | UTF-8 files and explicit Python text I/O
```

### python scripts/validate_sources.py
```text
PASS | approved IDs S001–S010
PASS | unique URLs
PASS | S001 metadata
PASS | S001 date and modules
PASS | S001 file hash
PASS | S001 citation and index
PASS | S002 metadata
PASS | S002 date and modules
PASS | S002 file hash
PASS | S002 citation and index
PASS | S003 metadata
PASS | S003 date and modules
PASS | S003 file hash
PASS | S003 citation and index
PASS | S004 metadata
PASS | S004 date and modules
PASS | S004 file hash
PASS | S004 citation and index
PASS | S005 metadata
PASS | S005 date and modules
PASS | S005 file hash
PASS | S005 citation and index
PASS | S006 metadata
PASS | S006 date and modules
PASS | S006 file hash
PASS | S006 citation and index
PASS | S007 metadata
PASS | S007 date and modules
PASS | S007 file hash
PASS | S007 citation and index
PASS | S008 metadata
PASS | S008 date and modules
PASS | S008 file hash
PASS | S008 citation and index
PASS | S009 metadata
PASS | S009 date and modules
PASS | S009 file hash
PASS | S009 citation and index
PASS | S010 metadata
PASS | S010 date and modules
PASS | S010 file hash
PASS | S010 citation and index
PASS | all eight modules covered
PASS | phase 3 wiki modules allowed
PASS | no HTML
PASS | no generated teaching data
46/46 checks passed
```

### python scripts/validate_wiki.py
```text
PASS | eight module files
PASS | M01 metadata
PASS | M01 sections
PASS | M01 source refs
PASS | M01 source backlinks
PASS | M01 related IDs
PASS | M02 metadata
PASS | M02 sections
PASS | M02 source refs
PASS | M02 source backlinks
PASS | M02 related IDs
PASS | M03 metadata
PASS | M03 sections
PASS | M03 source refs
PASS | M03 source backlinks
PASS | M03 related IDs
PASS | M04 metadata
PASS | M04 sections
PASS | M04 source refs
PASS | M04 source backlinks
PASS | M04 related IDs
PASS | M05 metadata
PASS | M05 sections
PASS | M05 source refs
PASS | M05 source backlinks
PASS | M05 related IDs
PASS | M06 metadata
PASS | M06 sections
PASS | M06 source refs
PASS | M06 source backlinks
PASS | M06 related IDs
PASS | M07 metadata
PASS | M07 sections
PASS | M07 source refs
PASS | M07 source backlinks
PASS | M07 related IDs
PASS | M08 metadata
PASS | M08 sections
PASS | M08 source refs
PASS | M08 source backlinks
PASS | M08 related IDs
PASS | prerequisites acyclic
PASS | all sources integrated
PASS | index includes modules
PASS | wiki/concepts/M01-color-fundamentals.md local links
PASS | wiki/concepts/M02-color-models.md local links
PASS | wiki/concepts/M03-color-harmony.md local links
PASS | wiki/concepts/M04-color-psychology.md local links
PASS | wiki/concepts/M05-color-perception.md local links
PASS | wiki/concepts/M06-visual-design.md local links
PASS | wiki/concepts/M07-accessibility.md local links
PASS | wiki/concepts/M08-design-application.md local links
PASS | wiki/glossary.md local links
PASS | wiki/index.md local links
PASS | wiki/knowledge-gaps.md local links
PASS | wiki/log.md local links
PASS | wiki/sources/sources-index.md local links
PASS | no HTML
PASS | no teaching data
59/59 checks passed
```

### python -m unittest discover -s tests -v
```text
test_baseline (test_sources.SourceTests.test_baseline) ... ok
test_duplicate (test_sources.SourceTests.test_duplicate) ... ok
test_early_html (test_sources.SourceTests.test_early_html) ... ok
test_missing_license (test_sources.SourceTests.test_missing_license) ... ok
test_tamper (test_sources.SourceTests.test_tamper) ... ok
test_unknown_module (test_sources.SourceTests.test_unknown_module) ... ok
test_baseline (test_wiki.WikiTests.test_baseline) ... ok
test_broken_link (test_wiki.WikiTests.test_broken_link) ... ok
test_cycle (test_wiki.WikiTests.test_cycle) ... ok
test_encoding_baseline (test_wiki.WikiTests.test_encoding_baseline) ... ok
test_encoding_missing (test_wiki.WikiTests.test_encoding_missing) ... ok
test_missing_section (test_wiki.WikiTests.test_missing_section) ... ok
test_unknown_citation (test_wiki.WikiTests.test_unknown_citation) ... ok
test_unverified (test_wiki.WikiTests.test_unverified) ... ok

----------------------------------------------------------------------
Ran 14 tests in 0.137s

OK
```

下一步：人工驗收及使用者 Windows 重測；不進入 Phase 4。

## CONTENT-001 — Phase 4（2026-11-24）

使用者回報 Phase 3 Windows 四項驗證通過；本次執行環境 Linux 容器。讀取 M01–M08；回查 S009/S010 並更新 M07；調整 SL03 範圍；生成 14 頁及八題。原驗證器的空白教材條件依階段調整，非本次測試失敗。以下為實際指令輸出，異常測試均使用臨時副本。

```text
PASS | UTF-8 files and explicit Python text I/O
PASS | approved IDs S001–S010
PASS | unique URLs
PASS | S001 metadata
PASS | S001 date and modules
PASS | S001 file hash
PASS | S001 citation and index
PASS | S002 metadata
PASS | S002 date and modules
PASS | S002 file hash
PASS | S002 citation and index
PASS | S003 metadata
PASS | S003 date and modules
PASS | S003 file hash
PASS | S003 citation and index
PASS | S004 metadata
PASS | S004 date and modules
PASS | S004 file hash
PASS | S004 citation and index
PASS | S005 metadata
PASS | S005 date and modules
PASS | S005 file hash
PASS | S005 citation and index
PASS | S006 metadata
PASS | S006 date and modules
PASS | S006 file hash
PASS | S006 citation and index
PASS | S007 metadata
PASS | S007 date and modules
PASS | S007 file hash
PASS | S007 citation and index
PASS | S008 metadata
PASS | S008 date and modules
PASS | S008 file hash
PASS | S008 citation and index
PASS | S009 metadata
PASS | S009 date and modules
PASS | S009 file hash
PASS | S009 citation and index
PASS | S010 metadata
PASS | S010 date and modules
PASS | S010 file hash
PASS | S010 citation and index
PASS | all eight modules covered
PASS | phase 3 wiki modules allowed
PASS | no HTML
PASS | phase 4 teaching data present
46/46 checks passed
PASS | eight module files
PASS | M01 metadata
PASS | M01 sections
PASS | M01 source refs
PASS | M01 source backlinks
PASS | M01 related IDs
PASS | M02 metadata
PASS | M02 sections
PASS | M02 source refs
PASS | M02 source backlinks
PASS | M02 related IDs
PASS | M03 metadata
PASS | M03 sections
PASS | M03 source refs
PASS | M03 source backlinks
PASS | M03 related IDs
PASS | M04 metadata
PASS | M04 sections
PASS | M04 source refs
PASS | M04 source backlinks
PASS | M04 related IDs
PASS | M05 metadata
PASS | M05 sections
PASS | M05 source refs
PASS | M05 source backlinks
PASS | M05 related IDs
PASS | M06 metadata
PASS | M06 sections
PASS | M06 source refs
PASS | M06 source backlinks
PASS | M06 related IDs
PASS | M07 metadata
PASS | M07 sections
PASS | M07 source refs
PASS | M07 source backlinks
PASS | M07 related IDs
PASS | M08 metadata
PASS | M08 sections
PASS | M08 source refs
PASS | M08 source backlinks
PASS | M08 related IDs
PASS | prerequisites acyclic
PASS | all sources integrated
PASS | index includes modules
PASS | wiki/concepts/M01-color-fundamentals.md local links
PASS | wiki/concepts/M02-color-models.md local links
PASS | wiki/concepts/M03-color-harmony.md local links
PASS | wiki/concepts/M04-color-psychology.md local links
PASS | wiki/concepts/M05-color-perception.md local links
PASS | wiki/concepts/M06-visual-design.md local links
PASS | wiki/concepts/M07-accessibility.md local links
PASS | wiki/concepts/M08-design-application.md local links
PASS | wiki/glossary.md local links
PASS | wiki/index.md local links
PASS | wiki/knowledge-gaps.md local links
PASS | wiki/log.md local links
PASS | wiki/sources/sources-index.md local links
PASS | no HTML
PASS | phase 4 teaching data present
59/59 checks passed
PASS | 14 ordered slides
PASS | eight modules covered
PASS | SL01 fields
PASS | SL01 trace
PASS | SL01 outline and interaction
PASS | SL02 fields
PASS | SL02 trace
PASS | SL02 outline and interaction
PASS | SL03 fields
PASS | SL03 trace
PASS | SL03 outline and interaction
PASS | SL04 fields
PASS | SL04 trace
PASS | SL04 outline and interaction
PASS | SL05 fields
PASS | SL05 trace
PASS | SL05 outline and interaction
PASS | SL06 fields
PASS | SL06 trace
PASS | SL06 outline and interaction
PASS | SL07 fields
PASS | SL07 trace
PASS | SL07 outline and interaction
PASS | SL08 fields
PASS | SL08 trace
PASS | SL08 outline and interaction
PASS | SL09 fields
PASS | SL09 trace
PASS | SL09 outline and interaction
PASS | SL10 fields
PASS | SL10 trace
PASS | SL10 outline and interaction
PASS | SL11 fields
PASS | SL11 trace
PASS | SL11 outline and interaction
PASS | SL12 fields
PASS | SL12 trace
PASS | SL12 outline and interaction
PASS | SL13 fields
PASS | SL13 trace
PASS | SL13 outline and interaction
PASS | SL14 fields
PASS | SL14 trace
PASS | SL14 outline and interaction
PASS | eight quiz IDs and modules
PASS | Q01 answer and trace
PASS | Q02 answer and trace
PASS | Q03 answer and trace
PASS | Q04 answer and trace
PASS | Q05 answer and trace
PASS | Q06 answer and trace
PASS | Q07 answer and trace
PASS | Q08 answer and trace
PASS | no HTML
54/54 checks passed
test_baseline (test_content.ContentTests.test_baseline) ... ok
test_invalid_answer (test_content.ContentTests.test_invalid_answer) ... ok
test_missing_slide (test_content.ContentTests.test_missing_slide) ... ok
test_missing_source (test_content.ContentTests.test_missing_source) ... ok
test_unknown_source (test_content.ContentTests.test_unknown_source) ... ok
test_wrong_interaction (test_content.ContentTests.test_wrong_interaction) ... ok
test_wrong_section (test_content.ContentTests.test_wrong_section) ... ok
test_baseline (test_sources.SourceTests.test_baseline) ... ok
test_duplicate (test_sources.SourceTests.test_duplicate) ... ok
test_early_html (test_sources.SourceTests.test_early_html) ... ok
test_missing_license (test_sources.SourceTests.test_missing_license) ... ok
test_tamper (test_sources.SourceTests.test_tamper) ... ok
test_unknown_module (test_sources.SourceTests.test_unknown_module) ... ok
test_baseline (test_wiki.WikiTests.test_baseline) ... ok
test_broken_link (test_wiki.WikiTests.test_broken_link) ... ok
test_cycle (test_wiki.WikiTests.test_cycle) ... ok
test_encoding_baseline (test_wiki.WikiTests.test_encoding_baseline) ... ok
test_encoding_missing (test_wiki.WikiTests.test_encoding_missing) ... ok
test_missing_section (test_wiki.WikiTests.test_missing_section) ... ok
test_unknown_citation (test_wiki.WikiTests.test_unknown_citation) ... ok
test_unverified (test_wiki.WikiTests.test_unverified) ... ok

----------------------------------------------------------------------
Ran 21 tests in 0.198s

OK
```

結果 PASS；待人工及 Windows 驗收。無 HTML，無瀏覽器測試。

## FE-001 — Phase 5 前端開發（2026-11-24）

- Phase: 5；Graph: V2（節點 O HTML 生成、P 瀏覽器測試）；Executor: LLM + Python + Node + Chrome
- 環境：Windows 11（win32）、Python 3.11.9、Node v22.17.0、Google Chrome headless（playwright-core，安裝於專案外暫存目錄，非專案相依）。Linux：NOT_RUN。
- 輸入：verified M01–M08、content/slides.json（14 頁）、quiz-bank.json（8 題）、interaction-spec.md、raw/sources.json（S001–S010）、workflow 紀錄。未修改 Wiki、來源摘要或教材內容。
- 產出：docs/ 六大入口、共用 CSS／JS、scripts/build_site_data.py、scripts/validate_frontend.py、tests/test_frontend.py、tests/js/color-utils.test.js、tests/browser/browser-test.js、workflow/evidence/phase5/（browser-results.json 與 12 張截圖）。
- 修正迴圈：ERR-003（驗證器 2 次）、ERR-004（響應式 1 次）、ERR-005（視覺審查 1 次）、ERR-006（驗證器誤判 1 次）；皆未超過 3 次。另 `node --test tests/js/` 目錄參數為指令用法修正。
- 驗證器階段條件：Phase 2–4 的 no HTML 改為「docs HTML limited to six approved entries」（D007）。

### 最終執行輸出（2026-11-24，ERR-006 修正後）

```text
$ python scripts/build_site_data.py
PASS | wrote docs/assets/data/chroma-data.js
$ python scripts/validate_encoding.py
PASS | UTF-8 files and explicit Python text I/O
$ python scripts/validate_sources.py
46/46 checks passed   (exit 0；含 docs HTML limited to six approved entries)
$ python scripts/validate_wiki.py
59/59 checks passed   (exit 0)
$ python scripts/validate_content.py
54/54 checks passed   (exit 0)
$ python scripts/validate_frontend.py
PASS | six HTML entries and .nojekyll
PASS | docs HTML limited to six approved entries
PASS | generated data in sync with wiki/content/workflow
PASS | index.html meta charset UTF-8 first
PASS | index.html lang zh-Hant, viewport, title
PASS | index.html site navigation has six entries
PASS | index.html local resources and links resolve
PASS | index.html no external runtime resources
PASS | index.html script exists assets/data/chroma-data.js
PASS | index.html script exists assets/js/navigation.js
PASS | index.html script exists assets/js/home.js
PASS | slides.html meta charset UTF-8 first
PASS | slides.html lang zh-Hant, viewport, title
PASS | slides.html site navigation has six entries
PASS | slides.html local resources and links resolve
PASS | slides.html no external runtime resources
PASS | slides.html script exists assets/data/chroma-data.js
PASS | slides.html script exists assets/js/navigation.js
PASS | slides.html script exists assets/js/color-utils.js
PASS | slides.html script exists assets/js/color-wheel.js
PASS | slides.html script exists assets/js/contrast.js
PASS | slides.html script exists assets/js/quiz.js
PASS | slides.html script exists assets/js/lab.js
PASS | slides.html script exists assets/js/slides.js
PASS | wiki.html meta charset UTF-8 first
PASS | wiki.html lang zh-Hant, viewport, title
PASS | wiki.html site navigation has six entries
PASS | wiki.html local resources and links resolve
PASS | wiki.html no external runtime resources
PASS | wiki.html script exists assets/data/chroma-data.js
PASS | wiki.html script exists assets/js/navigation.js
PASS | wiki.html script exists assets/js/wiki.js
PASS | lab.html meta charset UTF-8 first
PASS | lab.html lang zh-Hant, viewport, title
PASS | lab.html site navigation has six entries
PASS | lab.html local resources and links resolve
PASS | lab.html no external runtime resources
PASS | lab.html script exists assets/data/chroma-data.js
PASS | lab.html script exists assets/js/navigation.js
PASS | lab.html script exists assets/js/color-utils.js
PASS | lab.html script exists assets/js/color-wheel.js
PASS | lab.html script exists assets/js/contrast.js
PASS | lab.html script exists assets/js/quiz.js
PASS | lab.html script exists assets/js/lab.js
PASS | lab.html script exists assets/js/lab-page.js
PASS | workflow.html meta charset UTF-8 first
PASS | workflow.html lang zh-Hant, viewport, title
PASS | workflow.html site navigation has six entries
PASS | workflow.html local resources and links resolve
PASS | workflow.html no external runtime resources
PASS | workflow.html script exists assets/data/chroma-data.js
PASS | workflow.html script exists assets/js/navigation.js
PASS | workflow.html script exists assets/js/workflow.js
PASS | references.html meta charset UTF-8 first
PASS | references.html lang zh-Hant, viewport, title
PASS | references.html site navigation has six entries
PASS | references.html local resources and links resolve
PASS | references.html no external runtime resources
PASS | references.html script exists assets/data/chroma-data.js
PASS | references.html script exists assets/js/navigation.js
PASS | references.html script exists assets/js/references.js
PASS | every JS module is referenced by a page
PASS | 14 slides match content/slides.json order
PASS | four chapters cover slides in order
PASS | eight verified modules in site data
PASS | slide Wiki sections and Source IDs valid
PASS | quiz Wiki and Source refs valid
PASS | glossary and sources present
PASS | Wiki inline citations resolve to S001–S010
PASS | P0 feature hsl on lab.html and registered
PASS | P0 feature wheel on lab.html and registered
PASS | P0 feature harmony on lab.html and registered
PASS | P0 feature contrast-check on lab.html and registered
PASS | P1 feature rgb on lab.html and registered
PASS | P1 feature contrast-illusion on lab.html and registered
PASS | P1 feature ratio on lab.html and registered
PASS | P1 feature design-compare on lab.html and registered
PASS | P1 feature association on lab.html and registered
PASS | P1 feature design-lab on lab.html and registered
PASS | P1 feature quiz on lab.html and registered
PASS | P2 feature export on lab.html and registered
PASS | every slide interaction is a registered P0/P1 feature
PASS | P2 export: HEX copy, CSS variables, JSON download
PASS | WCAG formula constants present
PASS | harmony angles labelled as CHROMA tool settings
PASS | 60-30-10 labelled as rule of thumb
PASS | contrast tool disclaims full WCAG compliance
PASS | psychology copy keeps disclaimers and avoids certainty / medical claims
PASS | no innerHTML / document.write / eval in site JS
PASS | no network requests in site JS or CSS
PASS | no private paths, e-mail addresses or credential patterns
PASS | no raster or font assets of unverified licence
PASS | design-token text pairs meet WCAG AA
PASS | prefers-reduced-motion supported
PASS | focus-visible styles present
PASS | deck keyboard / hash / fullscreen handlers
96/96 checks passed
```

```text
$ python -m unittest discover -s tests -v
test_baseline (test_content.ContentTests.test_baseline) ... ok
test_invalid_answer (test_content.ContentTests.test_invalid_answer) ... ok
test_missing_slide (test_content.ContentTests.test_missing_slide) ... ok
test_missing_source (test_content.ContentTests.test_missing_source) ... ok
test_unknown_source (test_content.ContentTests.test_unknown_source) ... ok
test_wrong_interaction (test_content.ContentTests.test_wrong_interaction) ... ok
test_wrong_section (test_content.ContentTests.test_wrong_section) ... ok
test_absolute_path (test_frontend.FrontendTests.test_absolute_path) ... ok
test_api_key (test_frontend.FrontendTests.test_api_key) ... ok
test_baseline (test_frontend.FrontendTests.test_baseline) ... ok
test_broken_link (test_frontend.FrontendTests.test_broken_link) ... ok
test_build_rejects_private_content (test_frontend.FrontendTests.test_build_rejects_private_content) ... ok
test_code_in_data_file (test_frontend.FrontendTests.test_code_in_data_file) ... ok
test_external_script (test_frontend.FrontendTests.test_external_script) ... ok
test_extra_html (test_frontend.FrontendTests.test_extra_html) ... ok
test_inner_html (test_frontend.FrontendTests.test_inner_html) ... ok
test_js_color_math (test_frontend.FrontendTests.test_js_color_math) ... ok
test_low_contrast_token_pair (test_frontend.FrontendTests.test_low_contrast_token_pair) ... ok
test_missing_charset (test_frontend.FrontendTests.test_missing_charset) ... ok
test_missing_entry (test_frontend.FrontendTests.test_missing_entry) ... ok
test_missing_export (test_frontend.FrontendTests.test_missing_export) ... ok
test_missing_feature (test_frontend.FrontendTests.test_missing_feature) ... ok
test_network_call (test_frontend.FrontendTests.test_network_call) ... ok
test_private_path (test_frontend.FrontendTests.test_private_path) ... ok
test_psychology_certainty (test_frontend.FrontendTests.test_psychology_certainty) ... ok
test_raster_asset (test_frontend.FrontendTests.test_raster_asset) ... ok
test_stale_data (test_frontend.FrontendTests.test_stale_data) ... ok
test_baseline (test_sources.SourceTests.test_baseline) ... ok
test_duplicate (test_sources.SourceTests.test_duplicate) ... ok
test_missing_license (test_sources.SourceTests.test_missing_license) ... ok
test_tamper (test_sources.SourceTests.test_tamper) ... ok
test_unapproved_html (test_sources.SourceTests.test_unapproved_html) ... ok
test_unknown_module (test_sources.SourceTests.test_unknown_module) ... ok
test_baseline (test_wiki.WikiTests.test_baseline) ... ok
test_broken_link (test_wiki.WikiTests.test_broken_link) ... ok
test_cycle (test_wiki.WikiTests.test_cycle) ... ok
test_encoding_baseline (test_wiki.WikiTests.test_encoding_baseline) ... ok
test_encoding_missing (test_wiki.WikiTests.test_encoding_missing) ... ok
test_missing_section (test_wiki.WikiTests.test_missing_section) ... ok
test_unknown_citation (test_wiki.WikiTests.test_unknown_citation) ... ok
test_unverified (test_wiki.WikiTests.test_unverified) ... ok
Ran 41 tests in 39.191s
OK
```
（反例測試執行時，被測驗證器會印出預期的 broken／issue 診斷行，已自上方省略。）

```text
$ node --test tests/js/color-utils.test.js
ok 1 - TC002 hue 390° normalises to 30°
ok 2 - hue -30° normalises to 330°
ok 3 - hue 360° → 0°, -720° → 0°, 719.5° → 359.5°
ok 4 - TC001 HSL complementary angle is H+180 (0→180, 200→20)
ok 5 - TC003 triadic angles 0,120,240 and wrap from 300
ok 6 - analogous ±30 (tool setting) wraps: H=350 → 320,350,20 (SL07 example)
ok 7 - split-complementary 150/210 and square 90 steps
ok 8 - monochromatic keeps hue and varies S/L
ok 9 - six schemes are defined
ok 10 - HSL → RGB reference values (red, gray, black, white, cyan)
ok 11 - RGB ↔ HEX round trip
ok 12 - TC004 black/white contrast is exactly 21:1
ok 13 - TC005 identical colors contrast is 1:1
ok 14 - sRGB linearisation uses 0.04045 threshold and 2.4 exponent
ok 15 - thresholds compare the unrounded ratio (4.499 fails AA, display truncates)
ok 16 - TC006 invalid HEX is rejected and never yields a pass
ok 17 - RYB teaching wheel: red is opposite green (index 0 ↔ 6), distinct from HSL red ↔ cyan
ok 18 - 60-30-10 ratio: sums to 100, no negatives, defaults
ok 19 - P2 palette JSON export format
ok 20 - P2 CSS variables export and HEX list
ok 21 - quiz scoring: all correct, partial, unanswered and invalid answers
# tests 21
# pass 21
# fail 0
```

```text
$ NODE_PATH=<暫存目錄>/node_modules node tests/browser/browser-test.js
PASS | six pages load with title, h1/main and six nav links — index.html, slides.html, wiki.html, lab.html, workflow.html, references.html
PASS | header navigation reaches every page and marks aria-current
PASS | mobile menu toggle opens/closes at 360px
PASS | deck renders 14 slides and starts at SL01
PASS | fresh load and #SL06 load are not scrolled by native fragment jump
PASS | keyboard ArrowRight/ArrowLeft/End/Home/PageDown
PASS | prev/next buttons, progress and boundary disabling
PASS | URL hash positioning (direct load #SL12, #7, hashchange)
PASS | chapter menu and jump select go to a chosen slide
PASS | arrow keys inside form controls are not intercepted (SL04 slider, hue input)
PASS | every slide shows refs and mounts its interaction without error — 14 slides visited
PASS | fullscreen enter and exit
PASS | HSL: red, gray at S=0, black/white at L ends, reset
PASS | Wheel: RYB red↔green and HSL red↔cyan labels
PASS | Harmony: six schemes, triadic and complementary palettes
PASS | Contrast: 21:1, 1:1, invalid HEX shows no pass
PASS | RGB: all 255 white, presets black
PASS | Simultaneous contrast: chips stay #888888, reveal reversible
PASS | 60-30-10: sum stays 100, clamps, resets
PASS | Design compare: every state keeps text ≥ 4.5:1 (computed styles) — 12 states checked
PASS | Association: choice shows research note without diagnosis
PASS | Design lab: default pairs pass AA; low-contrast button text is flagged
PASS | Quiz: 8/8 when correct, 7/8 with one wrong, reset clears
PASS | Export: copy HEX / CSS to clipboard and download valid JSON — chroma-palette-triadic.json
PASS | Wiki: module render, section hash, search, glossary, prereq graph — search hits (WCAG)=3
PASS | Sources: S001–S010 with license, filter by module, hash focus
PASS | Workflow: Graph V1, V2, sub-flow SVGs and records rendered — graphs=3 records=5
PASS | responsive 360px: no horizontal overflow on six pages (+ deck slides)
PASS | responsive 768px: no horizontal overflow on six pages (+ deck slides)
PASS | responsive 1024px: no horizontal overflow on six pages (+ deck slides)
PASS | responsive 1440px: no horizontal overflow on six pages (+ deck slides)
PASS | prefers-reduced-motion disables decorative animation
PASS | home animation pause control
PASS | file:// (no server): six pages render data without errors
PASS | browser console: no errors, page errors or failed requests — warnings=0
35/35 browser checks passed
```

- 瀏覽器結果檔：workflow/evidence/phase5/browser-results.json（run_at 2026-11-24T07:06:10Z，console_issues 0）。
- 歷程：瀏覽器 29/33 → 33/33 → 33/33 → 34/34 → 35/35；前端驗證 94/96 → 95/96 → 96/96 → 最終執行 95/96（ERR-006）→ 96/96。
- 未執行：Linux、實體手機觸控、螢幕閱讀器、Firefox／Safari、GitHub Pages（Phase 7）、全螢幕 Esc 鍵（瀏覽器原生行為）。
- 本紀錄寫入後已重新執行 build_site_data.py，使 Workflow 頁面包含本節；之後重跑 validate_frontend.py 與 unittest 以確認資料同步（結果見最終回報）。

結果 PASS（Windows 本機）；待人工驗收。未部署，未進入 Phase 6／7。

## FIN-001 — Phase 6 最終驗收（2026-11-24）

- Phase: 6；Graph: V3（前端段落）；環境：Windows 11、Python 3.11.9、Node v22.17.0、Chrome headless（playwright-core 位於專案外）。Linux：NOT_RUN。
- 限制遵循：未重新設計、未新增互動功能、未修改 Wiki／教材／來源。網站程式只有兩處修改：Workflow 頁加入 V3 圖區塊（D010），以及 Graph 繪製修正（ERR-007）。
- 隱私：掃描全部文字檔（本機路徑、使用者名稱、帳號、Email、金鑰樣式），只命中 build_site_data.py 內的偵測規則字串本身。12 張 Phase 5 與 13 張 Phase 6 截圖僅為網站畫面（已逐張檢視）。WIN-001.png 建立遮蔽版，原檔以 .gitignore 排除（D009）。
- Graph：建立 graph-v3.md，V1／V2 未修改。
- 錯誤：ERR-007（圖形繪製；3/3 次後 V1／V2 殘留標籤重疊，BLOCKED）、ERR-008（子路徑測試腳本，1 次修正）。
- 證據：workflow/evidence/phase6/。Phase 5 證據未覆蓋。

### 最終執行輸出（ERR-007 第 3 次修正後）

```text
$ python scripts/build_site_data.py
PASS | wrote docs/assets/data/chroma-data.js
$ python scripts/validate_encoding.py
PASS | UTF-8 files and explicit Python text I/O
$ python scripts/validate_sources.py
46/46 checks passed
$ python scripts/validate_wiki.py
59/59 checks passed
$ python scripts/validate_content.py
54/54 checks passed
$ python scripts/validate_frontend.py
96/96 checks passed
$ python -m unittest discover -s tests -v
test_baseline (test_content.ContentTests.test_baseline) ... ok
test_invalid_answer (test_content.ContentTests.test_invalid_answer) ... ok
test_missing_slide (test_content.ContentTests.test_missing_slide) ... ok
test_missing_source (test_content.ContentTests.test_missing_source) ... ok
test_unknown_source (test_content.ContentTests.test_unknown_source) ... ok
test_wrong_interaction (test_content.ContentTests.test_wrong_interaction) ... ok
test_wrong_section (test_content.ContentTests.test_wrong_section) ... ok
test_absolute_path (test_frontend.FrontendTests.test_absolute_path) ... ok
test_api_key (test_frontend.FrontendTests.test_api_key) ... ok
test_baseline (test_frontend.FrontendTests.test_baseline) ... ok
test_broken_link (test_frontend.FrontendTests.test_broken_link) ... ok
test_build_rejects_private_content (test_frontend.FrontendTests.test_build_rejects_private_content) ... ok
test_code_in_data_file (test_frontend.FrontendTests.test_code_in_data_file) ... ok
test_external_script (test_frontend.FrontendTests.test_external_script) ... ok
test_extra_html (test_frontend.FrontendTests.test_extra_html) ... ok
test_inner_html (test_frontend.FrontendTests.test_inner_html) ... ok
test_js_color_math (test_frontend.FrontendTests.test_js_color_math) ... ok
test_low_contrast_token_pair (test_frontend.FrontendTests.test_low_contrast_token_pair) ... ok
test_missing_charset (test_frontend.FrontendTests.test_missing_charset) ... ok
test_missing_entry (test_frontend.FrontendTests.test_missing_entry) ... ok
test_missing_export (test_frontend.FrontendTests.test_missing_export) ... ok
test_missing_feature (test_frontend.FrontendTests.test_missing_feature) ... ok
test_network_call (test_frontend.FrontendTests.test_network_call) ... ok
test_private_path (test_frontend.FrontendTests.test_private_path) ... ok
test_psychology_certainty (test_frontend.FrontendTests.test_psychology_certainty) ... ok
test_raster_asset (test_frontend.FrontendTests.test_raster_asset) ... ok
test_stale_data (test_frontend.FrontendTests.test_stale_data) ... ok
test_baseline (test_sources.SourceTests.test_baseline) ... ok
test_duplicate (test_sources.SourceTests.test_duplicate) ... ok
test_missing_license (test_sources.SourceTests.test_missing_license) ... ok
test_tamper (test_sources.SourceTests.test_tamper) ... ok
test_unapproved_html (test_sources.SourceTests.test_unapproved_html) ... ok
test_unknown_module (test_sources.SourceTests.test_unknown_module) ... ok
test_baseline (test_wiki.WikiTests.test_baseline) ... ok
test_broken_link (test_wiki.WikiTests.test_broken_link) ... ok
test_cycle (test_wiki.WikiTests.test_cycle) ... ok
test_encoding_baseline (test_wiki.WikiTests.test_encoding_baseline) ... ok
test_encoding_missing (test_wiki.WikiTests.test_encoding_missing) ... ok
test_missing_section (test_wiki.WikiTests.test_missing_section) ... ok
test_unknown_citation (test_wiki.WikiTests.test_unknown_citation) ... ok
test_unverified (test_wiki.WikiTests.test_unverified) ... ok
Ran 41 tests in 36.930s
OK
$ node --test tests/js/color-utils.test.js
# tests 21
# pass 21
# fail 0
$ node tests/browser/browser-test.js   (exit 1)
PASS | six pages load with title, h1/main and six nav links — index.html, slides.html, wiki.html, lab.html, workflow.html, references.html
PASS | header navigation reaches every page and marks aria-current
PASS | mobile menu toggle opens/closes at 360px
PASS | deck renders 14 slides and starts at SL01
PASS | fresh load and #SL06 load are not scrolled by native fragment jump
PASS | keyboard ArrowRight/ArrowLeft/End/Home/PageDown
PASS | prev/next buttons, progress and boundary disabling
PASS | URL hash positioning (direct load #SL12, #7, hashchange)
PASS | chapter menu and jump select go to a chosen slide
PASS | arrow keys inside form controls are not intercepted (SL04 slider, hue input)
PASS | every slide shows refs and mounts its interaction without error — 14 slides visited
PASS | fullscreen enter and exit
PASS | HSL: red, gray at S=0, black/white at L ends, reset
PASS | Wheel: RYB red↔green and HSL red↔cyan labels
PASS | Harmony: six schemes, triadic and complementary palettes
PASS | Contrast: 21:1, 1:1, invalid HEX shows no pass
PASS | RGB: all 255 white, presets black
PASS | Simultaneous contrast: chips stay #888888, reveal reversible
PASS | 60-30-10: sum stays 100, clamps, resets
PASS | Design compare: every state keeps text ≥ 4.5:1 (computed styles) — 12 states checked
PASS | Association: choice shows research note without diagnosis
PASS | Design lab: default pairs pass AA; low-contrast button text is flagged
PASS | Quiz: 8/8 when correct, 7/8 with one wrong, reset clears
PASS | Export: copy HEX / CSS to clipboard and download valid JSON — chroma-palette-triadic.json
PASS | Wiki: module render, section hash, search, glossary, prereq graph — search hits (WCAG)=3
PASS | Sources: S001–S010 with license, filter by module, hash focus
FAIL | Workflow: Graph V1, V2, sub-flow, V3 SVGs and records rendered — graph overlaps: g0 label9∩label11, g0 label10∩Q, g1 label10∩M
PASS | responsive 360px: no horizontal overflow on six pages (+ deck slides)
PASS | responsive 768px: no horizontal overflow on six pages (+ deck slides)
PASS | responsive 1024px: no horizontal overflow on six pages (+ deck slides)
PASS | responsive 1440px: no horizontal overflow on six pages (+ deck slides)
PASS | prefers-reduced-motion disables decorative animation
PASS | home animation pause control
PASS | file:// (no server): six pages render data without errors
PASS | browser console: no errors, page errors or failed requests — warnings=0
34/35 browser checks passed
$ node tests/browser/pages-subpath-test.js
PASS | /CHROMA/ serves index.html
PASS | /CHROMA/index.html data+nav ok=true, in-site URLs=30, outside prefix=0
PASS | /CHROMA/slides.html data+nav ok=true, in-site URLs=149, outside prefix=0
PASS | /CHROMA/wiki.html data+nav ok=true, in-site URLs=110, outside prefix=0
PASS | /CHROMA/lab.html data+nav ok=true, in-site URLs=76, outside prefix=0
PASS | /CHROMA/workflow.html data+nav ok=true, in-site URLs=23, outside prefix=0
PASS | /CHROMA/references.html data+nav ok=true, in-site URLs=46, outside prefix=0
PASS | header navigation stays under /CHROMA/
PASS | requests=123, HTTP>=400/console problems=0, requests outside /CHROMA/=0
```

- 圖形重疊回歸檢查的有效性對照：以 Phase 5 舊繪製程式執行時 FAIL，列出 label∩P、N→E／N→I 穿過 P、O→L 穿過 Q 等。
- 結果：PASS（驗證腳本、單元、JS、子路徑模擬）；瀏覽器 34/35，1 項 BLOCKED 待人工決定。未部署，未進入 Phase 7。
- 本紀錄寫入後重新建置資料，並重跑 validate_frontend 與 unittest 以確認同步。
