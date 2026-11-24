# CHROMA — 發布目錄（Phase 5）

原生 HTML／CSS／JavaScript 靜態網站，無後端、無金鑰、無外部執行期資源。所有路徑為相對路徑，可部署至 GitHub Pages 的 Repository 子路徑（Phase 7 才部署）。

## 六大入口

| 檔案 | 入口 | 內容 |
|---|---|---|
| index.html | Home | 主視覺、八大模組、學習／實驗／流程入口、專案知識流程 |
| slides.html | Learn | 14 頁逐頁教材（content/slides.json），鍵盤、Hash、章節選單、全螢幕、手機滑動 |
| wiki.html | Wiki | M01–M08、搜尋、前置知識關係圖、詞彙表、Source ID 與知識限制 |
| lab.html | Lab | P0 4 項＋P1 7 項互動，以及 P2 色票匯出 |
| workflow.html | Workflow | Graph V1／V2／V3（原創 SVG 繪製）、執行紀錄、ERR 紀錄、測試狀態 |
| references.html | Sources | S001–S010 的作者、網址、授權、模組與限制 |

## 結構

- `assets/css/`：tokens（色票與經驗證的文字對比組合）、base、slides、lab
- `assets/js/`：navigation（DOM 工具與導覽）、color-utils（共用色彩計算）、color-wheel、contrast、quiz、lab、lab-page、slides、wiki、workflow、references、home
- `assets/data/chroma-data.js`：由 `python scripts/build_site_data.py` 產生，請勿手改
- `assets/illustrations/mark.svg`：原創標誌

## 本機瀏覽

- 直接開啟 `docs/index.html`（file:// 可用；資料以 script 載入）。
- 或於專案根目錄執行 `python -m http.server 8000 --directory docs`，開啟 http://localhost:8000/ 。剪貼簿複製在 http://localhost 等安全環境最穩定；若瀏覽器拒絕，頁面會提示手動複製。

## 更新流程

修改 wiki/、content/ 或 workflow/ 後：`python scripts/build_site_data.py`，再執行 `python scripts/validate_frontend.py`（會比對資料是否與來源同步）。
