# 腳本

| 腳本 | 階段 | 用途 |
|---|---|---|
| validate_init.py | 1 | 僅適用空白初始化版本（歷史保留） |
| validate_encoding.py | 3 起 | UTF-8 檔案與 Python 明確 encoding 靜態檢查（先於測試） |
| validate_sources.py | 2 起 | 來源登錄、雜湊、索引、模組覆蓋；docs 只允許六個核准 HTML 入口 |
| validate_wiki.py | 3 起 | 八模組結構、引用、連結、前置關係無環 |
| validate_content.py | 4 起 | 14 頁與八題的 Wiki 章節及 Source ID 可追溯性 |
| build_site_data.py | 5 | 將 verified Wiki、教材、來源與 workflow 紀錄確定性轉為 docs/assets/data/chroma-data.js；含私人路徑／金鑰攔截 |
| validate_frontend.py | 5 | 六入口、UTF-8、相對資源與連結、資料同步、引用、11+1 功能、無 innerHTML／網路請求／私人資料、色票對比、減少動態 |

Phase 5 執行順序：
```bash
python scripts/validate_encoding.py
python scripts/validate_sources.py
python scripts/validate_wiki.py
python scripts/validate_content.py
python scripts/build_site_data.py      # 僅在 wiki/content/workflow 變更後
python scripts/validate_frontend.py
python -m unittest discover -s tests -v
node --test tests/js/color-utils.test.js
NODE_PATH=<playwright-core 安裝目錄>/node_modules node tests/browser/browser-test.js
```
結構檢查不等於語意證明；瀏覽器測試需本機 Chrome 與 playwright-core（不列為專案相依）。
