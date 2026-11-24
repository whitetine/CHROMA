---
id: "M02"
title: "色彩模型"
title_en: "Color Models"
status: "verified"
version: "1.0.0"
created_at: "2026-11-24"
updated_at: "2026-11-24"
sources: ["S002", "S003", "S009", "S010"]
prerequisites: ["M01"]
related: ["M03", "M07"]
---

# 色彩模型（Color Models）

## 學習目標

區分螢幕與印刷色彩，理解數位色碼。

## 核心定義

RGB 是紅綠藍光通道的加法混色模型（Additive Mixing）；CMYK 是印刷油墨的減法混色模型（Subtractive Mixing）。[S002]

## 基礎理論

RGB 全強度合成白；CMYK 油墨吸光，黑墨改善暗部。Lab 可作色彩管理轉換參照。HSB 與 HSL 第三分量不同。CSS 支援 HEX、rgb()、hsl()。[S002][S003]

## 初學者解釋

原創類比：螢幕像調整三盞燈，印刷像調整紙面油墨。

## 視覺範例

原創推導：#FF0000、rgb(255,0,0)、hsl(0,100%,50%) 表示同一數位紅色。[S003]

## 設計應用

原創練習：使用 HEX 儲存網站色票，HSL 用於互動調色。

## 常見錯誤

不可用 HSL 明度直接計算 WCAG 相對亮度及對比率。[S003][S009][S010]

## 適用限制

印刷受設備與色彩管理影響，不承諾精準 RGB/CMYK 轉換。[S002]

## 相關知識

- [M01](M01-color-fundamentals.md)
- [M03](M03-color-harmony.md)
- [M07](M07-accessibility.md)

## 參考來源

- [S002](../../raw/articles/S002.md) — Color models and color spaces: RGB, CMYK, HSB, Lab
- [S003](../../raw/articles/S003.md) — CSS color values
- [S009](../../raw/articles/S009.md) — Web Content Accessibility Guidelines (WCAG) 2.2
- [S010](../../raw/articles/S010.md) — Understanding Success Criterion 1.4.3: Contrast (Minimum)

## 驗證紀錄

2026-11-24：LLM 對照 Phase 2 保存摘要，區分原創示例與專案設定。verified 指摘要層語意審查及結構驗證，不代表獨立學術審查或人工驗收。
