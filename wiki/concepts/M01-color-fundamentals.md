---
id: "M01"
title: "色彩基礎"
title_en: "Color Fundamentals"
status: "verified"
version: "1.0.0"
created_at: "2026-11-24"
updated_at: "2026-11-24"
sources: ["S001", "S003"]
prerequisites: []
related: ["M02", "M03", "M05"]
---

# 色彩基礎（Color Fundamentals）

## 學習目標

辨識色相、飽和度與明度。

## 核心定義

HSL 以角度描述色相（Hue），以百分比表示飽和度（Saturation）及明度（Lightness）。[S003]

## 基礎理論

飽和度為零時是灰階，明度兩端為黑與白。傳統 RYB 以紅黃藍為教學原色，不能與 HSL 混用。[S001][S003]

## 初學者解釋

原創類比：色相像選擇顏色種類，另外兩個控制鈕調整鮮明程度及偏黑或偏白的程度。

## 視覺範例

原創示例：比較 hsl(0,100%,50%)、hsl(0,0%,50%)、hsl(0,100%,80%)。[S003]

## 設計應用

原創練習：固定色相，調整 S/L 為海報建立背景與強調色。

## 常見錯誤

相同 HSL 明度不等於相同感知亮度。[S003]

## 適用限制

現有摘要不足以完整教授光譜、生理視覺及冷暖色分類。

## 相關知識

- [M02](M02-color-models.md)
- [M03](M03-color-harmony.md)
- [M05](M05-color-perception.md)

## 參考來源

- [S001](../../raw/articles/S001.md) — Colour Wheel Combinations
- [S003](../../raw/articles/S003.md) — CSS color values

## 驗證紀錄

2026-11-24：LLM 對照 Phase 2 保存摘要，區分原創示例與專案設定。verified 指摘要層語意審查及結構驗證，不代表獨立學術審查或人工驗收。
