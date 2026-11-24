# 測試計畫與實際狀態

狀態只使用 NOT_RUN／PASS／FAIL／BLOCKED／SKIPPED；PASS 僅代表本機實際執行（Windows 11，Python 3.11.9，Node v22.17.0，2026-11-24）。Linux 結果未執行，分開標示。

| ID | 測試 | 預期 | 狀態（Windows） | 位置 |
|---|---|---|---|---|
| TC001 | HSL 互補 | 0→180 | PASS | tests/js/color-utils.test.js |
| TC002 | 色相正規化 | 390→30、-30→330 | PASS | tests/js、瀏覽器 HSL 輸入 |
| TC003 | 三色 | 0,120,240 | PASS | tests/js、瀏覽器 Harmony |
| TC004 | 黑白對比 | 21:1 | PASS | tests/js、瀏覽器 Contrast |
| TC005 | 相同色 | 1:1 | PASS | tests/js、瀏覽器 Contrast |
| TC006 | 無效 HEX | 拒絕且不顯示合格 | PASS | tests/js、瀏覽器 Contrast |
| TC007 | 無效引用 | 拒絕 | PASS | test_content、test_wiki |
| TC008 | 重複 ID | 拒絕 | PASS | test_sources |
| TC009 | 未驗證 Wiki | 禁止正式生成 | PASS | test_wiki；build_site_data 拒絕非 verified |
| TC010 | 手機 | 無非預期溢出 | PASS | 瀏覽器 360／768／1024／1440 |
| TC011 | 鍵盤 | 可導航 | PASS | 瀏覽器（方向鍵、Home、End、PageDown、輸入欄不攔截） |
| TC012 | Pages | 資源正常 | NOT_RUN（實際部署）；子路徑模擬 PASS | 未部署（Phase 7）；pages-subpath-test.js 於 /CHROMA/ 模擬 PASS |
| TC013 | 配色 JSON 匯出格式 | chroma-palette v1 | PASS | tests/js、瀏覽器下載 |
| TC014 | 測驗計分 | 8/8、7/8、0、無效答案 | PASS | tests/js、瀏覽器 |
| TC015 | 前端靜態驗證反例 | 17 項反例皆被拒絕 | PASS | tests/test_frontend.py |
| TC016 | Linux 重跑全部 | 同 Windows | NOT_RUN | — |
| TC017 | 實體手機觸控滑動 | 左右滑動翻頁 | NOT_RUN | 程式已實作，未以實機或觸控模擬測試 |
| TC018 | 螢幕閱讀器 | 朗讀頁碼與狀態 | NOT_RUN | 僅靜態 ARIA 屬性 |
| TC019 | Firefox／Safari | 功能一致 | NOT_RUN | 僅測 Chrome |
| TC020 | GitHub Pages 子路徑模擬 | 所有請求留在 /CHROMA/ | PASS | tests/browser/pages-subpath-test.js（Phase 6） |
| TC021 | Workflow 圖形重疊回歸 | 標籤不重疊、連線不穿過節點 | FAIL → BLOCKED | V3 通過；V1／V2 殘留 3 處（ERR-007） |
| TC022 | 隱私掃描 | 無本機路徑、帳號、金鑰 | PASS | Phase 6 掃描；WIN-001 以遮蔽版公開 |
