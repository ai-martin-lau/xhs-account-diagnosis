# 小红书账号诊断（Gemini CLI 入口）

当用户要求诊断小红书账号（给出主页链接，或说"小红书账号诊断/分析/优化方案/为什么不涨粉"）时：

立即读取本目录 `RUN.md` 并严格按其步骤执行。RUN.md 是唯一执行真源，包含：零配置数据采集命令（scripts/xhs_fetch.mjs）、报告写作模板（references/report-template.md）、方法论铁律、PDF 构建命令（scripts/build_pdf.mjs）和出厂质检清单。

脚本为纯 Node（需 Node 22+），不依赖任何特定 CLI。
