<p align="center"><a href="README.md">简体中文</a> · <a href="README_EN.md">English</a> · <a href="README_JA.md">日本語</a> · <a href="README_KO.md">한국어</a> · <a href="README_ES.md">Español</a></p>

<div align="center">

# 小红书账号诊断 xhs-account-diagnosis

**给一个小红书主页链接，拿到一份约 30 页的诊断报告和 90 天优化方案 PDF**

能读文件、能跑命令的 AI 命令行工具都能用：Claude Code、Codex CLI、Gemini CLI

[报告样例](https://xhs.addsum.top/samples) · [出品：增和科技](https://addsum.top/cn/)

</div>

---

它不是又一个数据面板。它回答的是账号主理人最想问的问题：

> 我的账号卡在哪一步？先改什么，后改什么？接下来 90 天每周做什么？

它会自动抓取主页和最近 30 篇笔记（正文、点赞收藏评论、全部封面和配图），按「六环节断点诊断」找出漏斗断得最狠的一节，再按固定的修复顺序给出方案，最后排版成一份可以直接交给客户的 PDF。

## 报告里有什么

十个部分，全文约 1.5 万到 2.5 万字：

1. 执行摘要：诊断结论、核心问题清单、优先修复项、90 天保守预测
2. 账号现状：基础数据盘点、内容路线复盘、九维健康度评估、用户画像
3. 六环节断点诊断：曝光到点击、点击到关注、关注到私信、私信到转化、转化到复购，每一节都写现状、问题、原因、优化方向
4. 赛道与竞品：竞争格局、对标拆解、差异化机会（环境能联网时会查平台规则和赛道趋势）
5. IP 定位方案：定位公式、账号名与简介备选、人设、视觉规范
6. 内容策略：内容矩阵、选题库、30 天逐日排期、内容生产 SOP
7. 变现路径：产品层级、转化路径、私信话术、定价原则
8. 90 天执行计划：三个阶段各自的动作清单和判断标准，加里程碑验收表
9. 风险预警：平台、运营、心态三类风险和四种应急预案
10. 附录：数据监控表、工具推荐、标题库、常见问题

可以先看三份真实账号的[报告样例](https://xhs.addsum.top/samples)（同一套方法论生成，节选结论部分）。

## 方法论

- **先找断点**：不罗列所有毛病，只找漏斗断得最狠的一节，资源往那里倾斜。
- **修复有顺序**：定位统一 → 产品内容化 → 主页承接 → 视觉统一 → 搜索布局 → 商业化测试。承接没建好之前先改封面、先放大曝光，流量进来也接不住。
- **每个问题四件套**：表现、原因、影响、解决方向，缺一件就只是吐槽。
- **只用看得到的数据**：报告里的每个数字都取自脚本生成的数据事实表。后台曝光、主页访问、私信和转化数据拿不到，报告会写明缺失，预测一律给保守区间。
- **不承诺结果**：报告里有一条坦白回答「不能保证涨粉和收入」，并列出 90 天里自己能控制的事。

完整规则写在 [`RUN.md`](RUN.md)，报告骨架在 [`references/report-template.md`](references/report-template.md)。

## 使用前准备

1. 一台电脑（Mac、Windows 或 Linux），装有 Chrome
2. 在日常用的 Chrome 里登录过小红书网页版（xiaohongshu.com）
3. Node.js 22 或以上（终端输入 `node -v` 查看）
4. 任意一款 AI 命令行工具：Claude Code、Codex CLI、Gemini CLI 等

不需要 API key，也不需要装别的依赖。

## 安装

Claude Code：

```bash
git clone https://github.com/ai-martin-lau/xhs-account-diagnosis ~/.claude/skills/xhs-account-diagnosis
```

其他 AI 命令行工具：克隆到任意目录，记住路径即可。

```bash
git clone https://github.com/ai-martin-lau/xhs-account-diagnosis
```

## 使用

先拿到目标账号的主页链接：在小红书 App 里打开主页，点右上角分享，选「复制链接」；或者在电脑浏览器打开主页，复制地址栏，形如 `https://www.xiaohongshu.com/user/profile/xxxx`。

Claude Code 里直接说：

```text
诊断这个小红书账号 https://www.xiaohongshu.com/user/profile/xxxx
```

Codex CLI、Gemini CLI 或其他工具里说：

```text
请读取 <克隆目录>/RUN.md 并严格按它执行，目标账号：https://www.xiaohongshu.com/user/profile/xxxx
```

然后等着就行。抓数据约 5 分钟，写报告约 10 到 20 分钟，全程自动。

## 你会得到什么

当前工作目录下会生成 `账号诊断/<账号名>/`：

- `<账号名>_小红书账号诊断报告与优化方案.pdf`：交付用的 PDF
- 同名 `.md`：报告源文件，方便再改
- `证据/`：主页截图、全部封面和内页配图、原始数据 `data.json`、数据事实表

## 过程中可能遇到的提示

- **Chrome 弹出「允许远程调试」**：点允许。脚本要连上你的 Chrome 才能用你的登录态浏览。
- **提示「请完全退出 Chrome 后重试」**：Mac 按 Cmd+Q，Windows 关掉所有 Chrome 窗口，再把刚才那句话说一遍，它会自己重新打开 Chrome。
- **提示登录墙**：在 Chrome 里登录一次小红书网页版，再让它继续。
- **抓得有点慢**：访问节奏是刻意放慢的，模拟正常浏览。

## 常见问题

**会动我的小红书账号吗？**
不会。整个过程只读：不点赞、不关注、不评论、不发私信，只是像人一样浏览公开主页。访问节奏做了控制，但任何自动化访问都有极小的概率触发平台风控，介意的话请不要用。

**可以诊断别人的账号吗？**
可以，只要对方主页是公开的。请只用于自己的账号或经过授权的客户账号。

**报告能保证涨粉吗？**
不能，报告自己也不做这种承诺。它给的是断点、修复顺序和 90 天执行计划，结果取决于执行。

**一次能诊断几个账号？**
一次一个。诊断完一个，把下一个链接发给它就行。

## 文件结构

```text
RUN.md                       执行手册（唯一真源，所有 CLI 通用）
SKILL.md / AGENTS.md / GEMINI.md   Claude Code / Codex / Gemini 的入口，都指向 RUN.md
references/report-template.md      报告十部分骨架
scripts/xhs_fetch.mjs        连接本机 Chrome 抓取主页和笔记
scripts/facts.mjs            生成数据事实表和内容路线统计
scripts/build_pdf.mjs        Markdown 转出版级 PDF（无头 Chrome 打印）
```

## 免责声明

报告属于运营咨询建议，不构成收益承诺。请遵守小红书平台规则，不要用于骚扰、抄袭或其他违规用途，使用产生的后果由使用者自行承担。

## 许可

[MIT](LICENSE)

由[增和科技 Addsum](https://addsum.top/cn/) 出品。我们的其他开源项目：[slide-maker](https://github.com/addsumtech/slides_maker)（AI 生成原生可编辑的 PPT）、[x-account-teardown](https://github.com/ai-martin-lau/x-account-teardown)（拆解 X 账号的起号过程）。

## Star 趋势

[![Star History Chart](https://api.star-history.com/svg?repos=ai-martin-lau/xhs-account-diagnosis&type=Date)](https://star-history.com/#ai-martin-lau/xhs-account-diagnosis&Date)
