# 規格決策
## D001 — Phase 0 使用者確認
- 瑞士風格 × 包浩斯 × 數位藝術展覽
- 全螢幕逐頁簡報＋獨立實驗室
- 8–10 篇來源
- LLM 協作＋Python 驗證腳本
- 原生 HTML / CSS / JavaScript
- P0＋P1＋部分 P2
- P2 具體子集待確認
- 僅授權 Phase 1 初始化，不開始 Ingest、Wiki 內容或 HTML。

## D002 — 2026-11-24 Phase 2 核准
使用者核准 S001–S010；僅執行來源登錄、摘要、分類與驗證，不建立正式 Wiki 模組及 HTML。S006 使用同章節的校方 Pressbooks 入口，保留原網址。

## D003 — 2026-11-24 Phase 3 核准
使用者確認 Phase 2 Windows 六項測試通過（1.513 秒），核准八大 Wiki 整合、UTF-8 修正、Graph V2 與驗證；禁止教材及 HTML 生成。

## Phase 4 — 2026-11-24
使用者確認 Phase 3 Windows 四項驗證通過（使用者回報，未取得新截圖）。SL03 聚焦感知，避免缺證據的光譜與生理機制；原定 14 頁數不變。回查已核准 S009/S010 補足 M07；未新增來源。P2 子項未核准，保留候選。

## D005 — 2026-11-24 Phase 5 核准
使用者確認 Phase 0–4 及 Windows 本機驗證通過，核准 Phase 5 前端開發：六大入口、P0＋P1，以及 P2 子集「配色方案匯出」（HEX 複製、CSS Variables、JSON 下載）。色覺差異模擬、圖片色票擷取、AI 配色助手暫不實作。不部署 GitHub Pages，不進入 Phase 6／7。

## D006 — 2026-11-24 教材章節分組（呈現層）
slides.json 原無章節欄位。依使用者指定的四大章節，以連續且不改變頁序的方式分組：SEE COLOR SL01–SL03、THINK COLOR SL04–SL07、DESIGN WITH COLOR SL08–SL12、EXPERIMENT SL13–SL14。分組定義於 scripts/build_site_data.py，屬呈現決策，未修改 content/slides.json。SL09（錯覺）歸入第三章以維持連續頁序。

## D007 — 2026-11-24 驗證器階段條件調整
Phase 2–4 驗證器的「no HTML」為階段性限制。Phase 5 改為「docs HTML limited to six approved entries」：仍會拒絕未核准的 HTML（test_unapproved_html），未刪除檢查。新增 validate_frontend.py 與 tests/test_frontend.py（含 17 項反例），以及 tests/js 色彩計算測試與 tests/browser 瀏覽器測試。

## D008 — 2026-11-24 前端資料與安全策略
Wiki Markdown 由 build_site_data.py 轉為純資料（段落、清單、引用 token），前端只以 createElement／textContent 呈現；驗證器禁止 innerHTML、document.write、eval 與網路請求。資料以 script 載入，因此 file:// 亦可瀏覽。品牌紅 #E64C37 與黃 #F4C846 對米白未達一般文字 4.5:1，僅作圖形與填色；紅色文字改用 #B5321F（5.41:1）。

## D009 — 2026-11-24 Phase 6 核准與隱私處理
使用者確認 Phase 5 成果並核准 Phase 6 最終驗收；限制：不重新設計、不新增功能、不重新生成 Wiki 或教材、不部署。WIN-001.png 建立遮蔽版 WIN-001-redacted.png（兩處提示列路徑以「[local path redacted]」覆蓋），未遮蔽原檔不刪除、僅保留本機，以 .gitignore 排除並不放入 CHROMA_Phase6.zip。.gitignore 另新增 node_modules、.claude、.idea、*.log、*.tmp、*.zip、.pytest_cache。

## D010 — 2026-11-24 Graph V3
依 ERR-003～ERR-006 建立 workflow/graph-v3.md；V1、V2 不修改。為使公開 Workflow 頁面與文件一致，build_site_data.py 增加 graph_v3 資料，workflow.html／workflow.js 增加一個 V3 圖區塊（呈現既有資料，非新功能）。瀏覽器測試的圖數斷言由 3 改為 4。

## D011 — 2026-11-24 Graph 繪製修正與 BLOCKED 項
Phase 6 視覺審查發現 V3 繪製缺陷（ERR-007），依 V3 迴圈修正 workflow.js 的繪製細節並新增回歸檢查。3 次修正後 V1／V2 仍有 3 處既有標籤重疊，依 AGENTS.md 標記 BLOCKED，不再自動重試，亦不放寬檢查；最終瀏覽器測試因此為 34/35。需人工決定：接受現況、授權第 4 次修正，或改以文字版連線為準。

## D012 — 2026-11-24 GitHub Pages 子路徑驗證
新增 tests/browser/pages-subpath-test.js：僅在 /CHROMA/ 下提供 docs/，模擬 https://<user>.github.io/CHROMA/。屬本機模擬，不等同實際部署；實際 Pages 驗證留待 Phase 7。
