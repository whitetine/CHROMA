# 瀏覽器驗收（Phase 5）

- 指令：`NODE_PATH=<playwright-core>/node_modules node tests/browser/browser-test.js`
- 環境：Windows 11、Google Chrome（headless，playwright-core channel "chrome"）、Node v22.17.0；docs/ 以 Node 內建 http 於 127.0.0.1 提供。
- 證據：workflow/evidence/phase5/browser-results.json 與 12 張截圖（六頁 × 360／1440px）。
- 結果歷程：29/33（ERR-004）→ 33/33 → 33/33（ERR-005 視覺修正）→ 34/34（新增捲動回歸檢查）→ 35/35（新增 file:// 檢查）；最終結果見 execution-log FE-001。

- [x] 六大頁面載入、UTF-8、導覽與 aria-current — PASS
- [x] 手機選單（360px）開關與 Esc — PASS
- [x] 14 頁簡報：上一頁／下一頁、進度、邊界停用 — PASS
- [x] 鍵盤：← → Home End PageDown；輸入欄與滑桿內方向鍵不翻頁 — PASS
- [x] URL Hash（#SL12、#7、hashchange）與首次載入不被原生片段捲動 — PASS
- [x] 章節選單與跳頁選單 — PASS
- [x] 全螢幕進入與退出（按鈕） — PASS；Esc 為瀏覽器原生行為，自動化 NOT_RUN
- [x] 每頁引用與互動元件掛載 — PASS
- [x] HSL、RYB／HSL 色輪、六種配色、對比度（21:1、1:1、無效 HEX、4.48 不通過） — PASS
- [x] RGB、同時對比、60-30-10、設計對照（12 狀態文字皆 ≥4.5:1）、情緒聯想、自由配色 — PASS
- [x] 測驗提交（8/8、7/8）與重設 — PASS
- [x] 色票匯出：複製 HEX、複製 CSS Variables（剪貼簿讀回）、下載 JSON（格式驗證） — PASS
- [x] Wiki 搜尋、章節定位、詞彙表、前置關係圖；Sources 篩選與定位；Workflow 三張圖 — PASS
- [x] 360／768／1024／1440px 無水平溢出 — PASS
- [x] prefers-reduced-motion 停用裝飾動畫；首頁動畫暫停按鈕 — PASS
- [x] file:// 直接開啟六頁 — PASS
- [x] Console 無錯誤、無失敗請求 — PASS
- [ ] 實體手機觸控、螢幕閱讀器、Firefox／Safari、Linux — NOT_RUN
- [ ] 人工視覺與教學品質驗收 — 待使用者

## Phase 6 最終驗收（2026-11-24）
- 證據：workflow/evidence/phase6/（browser-results.json、12 張截圖、workflow-graph-v3.png）。Phase 5 證據保留未覆蓋。
- [x] validate 五腳本、unittest 41 項、JS 21 項 — PASS
- [x] 瀏覽器 35 項中 34 項 — PASS
- [ ] Workflow 圖形重疊回歸檢查 — FAIL，已 BLOCKED（V1／V2 既有標籤重疊，ERR-007）
- [x] GitHub Pages 子路徑模擬（/CHROMA/，123 個請求，0 個超出前綴）— PASS
- [ ] 實際 GitHub Pages 部署 — NOT_RUN（Phase 7）
