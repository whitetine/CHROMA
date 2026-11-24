# 錯誤紀錄

僅記錄實際發生的錯誤；不預填。執行環境：ERR-001 雲端擷取、ERR-002 使用者 Windows、ERR-003 起為 Phase 5 Windows 11 本機（Python 3.11.9、Node v22.17.0、Chrome headless）。

## ERR-001 — 2026-11-24 / ING-001
- 節點：Source Retrieval（S006）
- 實際：初次頁面取得後，再次定位內容時回傳 403 Forbidden；無法直接重讀。
- 修正：搜尋同一作者及章名，找到校方 pressbooks.umn.edu 入口；搜尋結果提供章節正文與 CC BY 4.0，開啟入口取得內容（仍重導原網址）。
- 結果：摘要可由取得文本支持；原網址直接存取穩定性未解決。未宣稱伺服器已修復。
- 建議前移：來源登錄前檢查正文可讀性，不只檢查標題或網址。保留 Graph V1，V2 留待後續實際驗收。

## ERR-002 — 2026-11-24 / WIN-001
- 使用者提供 Windows Python 3.11 traceback：read_text() 依 CP950 解碼 UTF-8，1 項成功、5 項 ERROR。
- 使用者重新執行原指令，截圖顯示 Ran 6 tests in 1.513s / OK；本機結果由使用者提供，未取得本機修改檔。
- 本次從 Phase 2 ZIP 修正 Python 文字 I/O，新增靜態檢查，先於測試。
- 狀態：使用者本機原問題已排除；Phase 3 新版本 Windows 重測待使用者執行。

## ERR-003 — 2026-11-24 / FE-001（Phase 5）
- 節點：前端靜態驗證（validate_frontend.py 首次執行）
- 分類：程式錯誤（驗證器本身）
- 實際：94/96。FAIL「glossary and sources present」：hash_targets 直接引用 sources 集合，加入 references.html 的頁面 id 後汙染來源集合。FAIL「no raster or font assets」：docs/.gitkeep 等佔位檔被誤判為二進位資產。
- 修正 1：hash_targets 改用 set(sources) 副本；允許空佔位檔。重跑 95/96（佔位檔實際含 1 個換行位元組，st_size 為 1）。
- 修正 2：改以 read_bytes().strip() 判定空白佔位檔。重跑 96/96。
- 重試次數：2／3。狀態：RESOLVED。網站檔案未因此修改。

## ERR-004 — 2026-11-24 / FE-001（Phase 5）
- 節點：瀏覽器測試（響應式）
- 分類：程式／樣式錯誤
- 實際：首次瀏覽器測試 29/33。水平溢出：lab.html 360px +196px（匯出預覽 pre 撐開 grid 欄）；workflow.html 360px +205px（Graph SVG min-width 撐開 .two-col）；slides SL07／SL12／SL13 各寬度 +28px（進場動畫 translateX 溢出）；index.html 768px +15px（統計數字「11+1」字級超出欄寬，屬文字溢出、元素框未超出）。
- 修正：grid 子項 min-width: 0；.deck-stage overflow-x: clip；統計數字字級改為 --step-3，900px 以下改兩欄。
- 重測：33/33。重試次數：1／3。狀態：RESOLVED。

## ERR-005 — 2026-11-24 / FE-001（Phase 5）
- 節點：瀏覽器測試後的截圖視覺審查（LLM 檢視實際截圖）
- 分類：程式／樣式錯誤；自動檢查未涵蓋
- 實際：(a) 1440px 首頁與封面「CHROMA.」字級過大，被右欄藝術圖覆蓋（句點不可見）；(b) 裝飾 SVG 以 slice 縮放時文字被裁切；(c) slides.html 首次載入 scrollY=58：腳本在 load 前以 replaceState 寫入 #SL01，Chrome 依網址片段捲動至同 id 的 section，頁碼被工具列遮住；(d) HSL 色輪 90°／270° 標籤被畫布邊緣裁切；(e) Graph 連線標籤框寬度過大；(f) 證據截圖拍在 520ms 淡入動畫中途。
- 修正：--step-5 改為 clamp(3.4rem, 0.5rem + 8.2vw, 10rem)；移除裝飾 SVG 內文字；投影片 DOM id 改為 slide-SLxx（Hash 仍為 #SLxx，由腳本處理），並新增回歸檢查「fresh load and #SL06 load are not scrolled」；色輪外徑內縮；標籤寬度依字元計算；截圖前等待 650ms。
- 重測：34/34（新增回歸檢查後）。各項重試 1／3。狀態：RESOLVED。

## ERR-006 — 2026-11-24 / FE-001（Phase 5 最終執行）
- 節點：前端靜態驗證（最終完整執行）
- 分類：程式錯誤（驗證器誤判）
- 實際：validate_frontend 95/96、unittest 40 項中 test_baseline FAIL。新增的決策紀錄 D008 以文字提及「document.write」，該文字經建置進入 chroma-data.js；驗證器以字串比對掃描所有 .js，將資料字串誤判為程式呼叫。
- 修正：資料檔改為結構驗證（僅允許一段註解＋一個 window.CHROMA_DATA = JSON 指派，且 JSON 可解析），不再對字串內容做 API 名稱比對；其他 .js 照舊掃描。新增反例 test_code_in_data_file（在資料檔後附加程式碼必須 FAIL）。
- 重試次數：1／3。狀態：見 FE-001 最終結果。

## ERR-007 — 2026-11-24 / FIN-001（Phase 6）
- 節點：V3「截圖視覺審查」（LLM 檢視 Graph V3 實際截圖）
- 分類：程式／SVG 繪製錯誤；既有自動檢查未涵蓋
- 實際：Graph V3 中「溢出」標籤壓在「實際瀏覽器截圖」節點上；跨多列的 R→X 連線穿過中間節點；「版面或圖形問題」與「通過」標籤互相重疊；T→S 回饋線水平段穿過「人工確認及發布」節點。
- 修正 1：跨多列前進線改走左側通道；同源多條標籤改置於接近目標處；同列右側有節點時回饋線改由節點底部離開。另新增自動回歸檢查（標籤不得與節點或其他標籤重疊、連線不得穿過非端點節點）。以 Phase 5 的舊繪製程式對照，檢查確實 FAIL（列出 label∩P、N→E 穿過 P 等），證明檢查有效。
- 新發現：同一檢查揭露 V1／V2 的既有缺陷（同一節點多條回饋標籤畫在同一位置，Phase 5 已存在）。
- 修正 2：同源回饋標籤堆疊；修正 3：側出標籤向上堆疊、底出標籤置於節點右側。
- 結果：V3 與 Phase 4 子流程無重疊；V1 剩 2 處、V2 剩 1 處標籤重疊（label9∩label11、label10∩Q、label10∩M）。瀏覽器測試 34/35。
- 重試次數：3／3，已達上限。狀態：**BLOCKED（V1／V2 殘留標籤重疊）**，待人工決定；回歸檢查維持嚴格，未為通過而放寬。V3 部分 RESOLVED。

## ERR-008 — 2026-11-24 / FIN-001（Phase 6）
- 節點：GitHub Pages 子路徑測試（新測試腳本）
- 分類：測試腳本錯誤
- 實際：pages-subpath-test.js 以 `e.href` 取網址，Wiki 前置關係圖的 SVG `<a>` 回傳 SVGAnimatedString，`u.startsWith is not a function` 中止。
- 修正：改用 getAttribute 並以 URL 解析。重跑 PASS（123 個請求，0 個在 /CHROMA/ 之外）。重試 1／3。狀態：RESOLVED；網站未修改。

## 非錯誤紀錄 — 指令用法
- `node --test tests/js/` 在 Node v22.17.0 將目錄當成模組解析而失敗；改用 `node --test tests/js/color-utils.test.js` 後 21/21 通過。屬指令用法修正，未修改程式。

