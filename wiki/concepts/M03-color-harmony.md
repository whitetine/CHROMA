---
id: "M03"
title: "色彩搭配"
title_en: "Color Harmony"
status: "verified"
version: "1.0.0"
created_at: "2026-11-24"
updated_at: "2026-11-24"
sources: ["S001", "S003"]
prerequisites: ["M01", "M02"]
related: ["M06", "M07", "M08"]
---

# 色彩搭配（Color Harmony）

## 學習目標

區分傳統與數位色輪，理解六種配色設定。

## 核心定義

傳統 RYB 對向組合為紅綠、藍橙、黃紫；類似色相鄰，三角色均分色輪。[S001]

## 基礎理論

數位 HSL 的 0° 為紅、180° 為青、360° 回紅。[S003] 專案設定（PROJECT_SPEC.md）：單色固定 H 改 S/L；類似色 H±30°；互補 H+180°；分裂互補 H+150°、H+210°；三角色 H+120°、H+240°；Square 四色 H+90°、H+180°、H+270°。均以 H 為基準且角度取模 360。這些是工具設定，不宣稱全部由來源直接給出。

## 初學者解釋

原創類比：把色輪當成時鐘，依規則轉動指針；單色配色不轉指針。

## 視覺範例

原創推導：H=350° 的類似色為 320°、350°、20°；H=0° 的互補為 180°。[S003]

## 設計應用

原創練習：選三角色製作海報候選色票，再選其中一色為主色。

## 常見錯誤

不可將 RYB 紅綠對向套入 HSL；Square 僅為四色的一種設定。[S001][S003]

## 適用限制

HSL 角度不是感知均勻距離；色相對比不保證可讀性。[S001][S003]

## 相關知識

- [M01](M01-color-fundamentals.md)
- [M02](M02-color-models.md)
- [M06](M06-visual-design.md)
- [M07](M07-accessibility.md)
- [M08](M08-design-application.md)

## 參考來源

- [S001](../../raw/articles/S001.md) — Colour Wheel Combinations
- [S003](../../raw/articles/S003.md) — CSS color values

## 驗證紀錄

2026-11-24：LLM 對照 Phase 2 保存摘要，區分原創示例與專案設定。verified 指摘要層語意審查及結構驗證，不代表獨立學術審查或人工驗收。
