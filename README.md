# CHROMA — 色彩解碼
*The Science and Art of Color*

色彩不只是裝飾，而是一種無聲的語言。

CHROMA 是以 LLM Wiki 驅動的初學者色彩教育專案：先取得並登錄可信來源，整合成八個已驗證知識模組，再只從 verified Wiki 生成 14 頁教材與互動實驗室，全程以 Python／Node 驗證腳本、瀏覽器測試與人工審查留下可追溯紀錄。網站為原生 HTML／CSS／JavaScript，無後端、無金鑰、無外部執行期資源。

**狀態：** Phase 6 最終驗收（待人工確認）。尚未部署 GitHub Pages。有 1 項 BLOCKED，見「已知限制」。

## 網站六大入口（docs/）

| 入口 | 檔案 | 內容 |
|---|---|---|
| Home | index.html | 展覽式主視覺、八大模組、學習／實驗／流程入口 |
| Learn | slides.html | 14 頁逐頁簡報：鍵盤、URL Hash、章節選單、全螢幕、手機滑動、每頁 Wiki 與來源引用 |
| Wiki | wiki.html | M01–M08、關鍵字搜尋、前置知識關係圖、中英詞彙表、知識限制 |
| Lab | lab.html | 11 項 P0＋P1 互動與 P2 色票匯出 |
| Workflow | workflow.html | Graph V1／V2／V3、執行紀錄、錯誤紀錄、測試狀態 |
| Sources | references.html | S001–S010 作者、網址、授權、模組與限制 |

## 十篇來源

| ID | 來源 | 機構 |
|---|---|---|
| S001 | Colour Wheel Combinations | Adobe |
| S002 | Color models and color spaces: RGB, CMYK, HSB, Lab | Adobe Help Center |
| S003 | CSS color values | MDN Web Docs |
| S004 | Color and psychological functioning: a review of theoretical and empirical work | Frontiers in Psychology |
| S005 | Do we feel colours? A systematic review of 128 years of psychological research linking colours and emotions | Psychonomic Bulletin & Review |
| S006 | Simultaneous Contrast | University of Minnesota |
| S007 | 5 Principles of Visual Design in UX | Nielsen Norman Group |
| S008 | Visual Design: Glossary | Nielsen Norman Group |
| S009 | Web Content Accessibility Guidelines (WCAG) 2.2 | W3C |
| S010 | Understanding Success Criterion 1.4.3: Contrast (Minimum) | W3C |

完整網址與授權見 [raw/sources.json](raw/sources.json)、[來源索引](wiki/sources/sources-index.md)。網站只使用原創摘要與連結，不重製全文或圖片。

## 八大 Wiki 模組

- M01 Color Fundamentals｜色彩基礎
- M02 Color Models｜色彩模型
- M03 Color Harmony｜色彩搭配
- M04 Color Psychology｜色彩心理學
- M05 Color Perception｜色彩感知
- M06 Visual Design｜視覺設計原則
- M07 Accessibility｜色彩與無障礙設計
- M08 Design Application｜實際設計應用

[Wiki 索引](wiki/index.md) · [詞彙表](wiki/glossary.md) · [知識缺口](wiki/knowledge-gaps.md)

## 14 頁教學簡報

| 章節 | 頁面 |
|---|---|
| SEE COLOR | SL01 CHROMA — 色彩解碼 · SL02 色彩為什麼重要？ · SL03 我們如何感知色彩？ |
| THINK COLOR | SL04 色彩三要素 HSL · SL05 RGB 與 CMYK · SL06 認識兩種色輪 · SL07 六種配色方法 |
| DESIGN WITH COLOR | SL08 色彩與心理 · SL09 眼睛會欺騙你嗎？ · SL10 60-30-10 配色比例 · SL11 視覺層級與對比 · SL12 好看不等於好讀 |
| EXPERIMENT | SL13 色彩設計實驗室 · SL14 學習成果驗收 |

教材來源：[content/slides.json](content/slides.json)、[教學大綱](content/slide-outline.md)、[學習目標](content/learning-objectives.md)。

## 互動功能

- **P0：** HSL 三要素調色器、RYB／HSL 色輪比較、六種配色產生器、WCAG 對比度檢查器
- **P1：** RGB 混色、同時對比、60-30-10 比例、視覺設計前後對照、色彩情緒聯想、自由配色設計、學習成果測驗
- **P2（已核准）：** 配色方案匯出（HEX 複製、CSS Variables、JSON 下載）
- **暫不實作：** 色覺差異模擬、圖片色票擷取、AI 配色助手

色彩計算集中於 docs/assets/js/color-utils.js：色相取模、WCAG sRGB 線性化，對比以未四捨五入的數值判定。類似色與分裂互補色的角度標示為 CHROMA 工具設定；60-30-10 標示為設計經驗法則；對比通過不等於完整 WCAG 合規；色彩心理學只描述聯想，不作必然性或醫療宣稱。

## Workflow Graph

- [Graph V1](workflow/graph-v1.md)：Phase 1 規劃版
- [Graph V2](workflow/graph-v2.md)：依 ERR-001（正文 403）新增正文預檢；依 ERR-002（Windows CP950）新增 UTF-8 靜態檢查
- [Graph V3](workflow/graph-v3.md)：依 ERR-003～ERR-006 新增「驗證器正常及異常測試」「多寬度與水平溢出」「截圖視覺審查」「CSS／SVG 修正」「自動回歸檢查」。V3 尚未從頭完整重跑；Phase 6 只執行其前端段落

[錯誤紀錄](workflow/error-log.md) · [執行紀錄](workflow/execution-log.md) · [決策](workflow/decisions.md) · [反思](workflow/reflection.md)

## 本機啟動

- 直接開啟 `docs/index.html`（file:// 可用）
- 或執行 `python -m http.server 8000 --directory docs`，再開啟 http://localhost:8000/

修改 wiki/、content/ 或 workflow/ 後，先執行 `python scripts/build_site_data.py`。

## 實際測試結果（Phase 6，2026-11-24，Windows 11／Python 3.11.9／Node v22.17.0／Chrome headless）

| 指令 | 結果 |
|---|---|
| `python scripts/validate_encoding.py` | PASS |
| `python scripts/validate_sources.py` | 46/46 |
| `python scripts/validate_wiki.py` | 59/59 |
| `python scripts/validate_content.py` | 54/54 |
| `python scripts/validate_frontend.py` | 96/96 |
| `python -m unittest discover -s tests -v` | 41 tests OK |
| `node --test tests/js/color-utils.test.js` | 21/21 |
| `node tests/browser/browser-test.js` | 34/35（1 FAIL → BLOCKED，ERR-007） |
| `node tests/browser/pages-subpath-test.js` | PASS（/CHROMA/ 子路徑模擬） |

兩個瀏覽器腳本需本機 Chrome 與 playwright-core（不列為專案相依）：先執行 `npm install --prefix <目錄> playwright-core`，再以 `NODE_PATH=<目錄>/node_modules` 執行。

Linux、實體手機觸控、螢幕閱讀器、Firefox／Safari、實際 GitHub Pages：NOT_RUN。

證據：workflow/evidence/phase5/、workflow/evidence/phase6/、WIN-001-redacted.png。

## GitHub Pages 部署方式（Phase 7 才執行）

1. 將專案推送至 GitHub repository（例如 `CHROMA`）。
2. 進入 Settings → Pages → Build and deployment → Source 選「Deploy from a branch」，Branch 選 `main`、資料夾選 `/docs`。
3. 網站位於 `https://<帳號>.github.io/CHROMA/`。全站使用相對路徑，且 docs/.nojekyll 已存在；子路徑相容性已在本機模擬通過。
4. 部署後請在線上重跑六頁、資源與 Console 檢查。

推送前請確認未遮蔽的 workflow/evidence/WIN-001.png 已被 .gitignore 排除（`git check-ignore workflow/evidence/WIN-001.png`）。

## 已知限制

- **BLOCKED（ERR-007）：** Workflow 頁的 Graph V1／V2 各有少數連線標籤重疊。這是 Phase 5 已存在的問題，經 3 次修正後仍有 3 處；V3 無重疊，文字版連線列表完整。待人工決定。
- 「verified」指摘要層語意審查與結構驗證，不代表獨立學術審查。
- 光譜、生理視覺、冷暖色及完整色彩恆常性仍缺來源（見知識缺口）。
- 設計對照與情緒聯想實驗未經使用者研究。
- 只在 Windows Chrome 實測。
- 剪貼簿在非安全環境可能被瀏覽器拒絕，此時頁面會提示手動複製。
- 原創內容的發布授權待擁有者確認；外部資料依各來源限制使用。
