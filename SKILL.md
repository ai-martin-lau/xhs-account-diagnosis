---
name: xhs-account-diagnosis
description: 小红书账号诊断与90天优化方案生成器。用户只需提供一个小红书主页链接（或账号名），自动抓取主页与笔记数据（含正文和全部配图），套用「六环节断点诊断」方法论，产出一份约30页的出版级诊断报告 PDF。触发词：小红书账号诊断、诊断这个小红书账号、小红书账号分析、帮我看看这个小红书号、小红书优化方案、账号陪跑方案、小红书号为什么不涨粉、xhs account diagnosis。适用于给客户做付费诊断，也适用于诊断自己的账号。
---

# 小红书账号诊断

本 skill 的执行手册在本目录 `RUN.md`（唯一真源，CLI 通用）。立即读取 `RUN.md` 并严格按其步骤执行：

1. Step 1 用 `scripts/xhs_fetch.mjs` 零配置抓取主页与全部笔记（含正文、封面、内页多图）；
2. Step 2 至 4 按 `references/report-template.md` 十部分骨架写报告，逐条对照方法论铁律与写作硬规则；
3. Step 5 用 `scripts/build_pdf.mjs` 构建出版级 PDF 交付。

