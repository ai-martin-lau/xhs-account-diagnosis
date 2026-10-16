#!/usr/bin/env node
// 数据事实表：把 xhs_fetch.mjs 抓到的 data.json 整理成报告唯一的数字来源（派生数、转化信号、路线统计都由代码算好）。
// 用法: node facts.mjs <证据目录> [--routes=<routes.json>]
//   不带 --routes：输出笔记明细、派生指标和转化信号，用来归内容路线；
//   带 --routes（格式 {"routes":[{"name":"","description":"","note_indexes":[1,2]}]}）：再加上路线统计。
// 结果写到 <证据目录>/数据事实表.md 并打印到终端。
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function parseCount(raw) {
  const s = String(raw ?? '').trim();
  if (!s || /^[赞点收藏评论]+$/.test(s)) return 0; // 互动为 0 时页面显示「赞/收藏/评论」字样
  const m = s.match(/([\d.]+)\s*(万|w|W|千|k|K)?/);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  if (m[2] === '万' || m[2] === 'w' || m[2] === 'W') n *= 10000;
  else if (m[2]) n *= 1000;
  return Math.round(n);
}

const pick = (arr, re) => {
  const hit = (arr || []).find((x) => re.test(x));
  return hit ? parseCount(hit.replace(re, '')) : null;
};

const avg = (xs) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);
const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// 联系方式不进报告：简介里的邮箱、手机号、微信号先隐去，模型从源头就拿不到
export function redactContacts(text) {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '（联系方式已隐去）')
    .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, '（联系方式已隐去）')
    .replace(/((?:微信|vx|VX|wx|WX|v信|V信|威信|薇信|商务|合作)[^\n，。；]{0,6}?[:：]?\s*)[A-Za-z][\w-]{5,19}/g, '$1（联系方式已隐去）');
}

export function buildFacts(data) {
  const p = data.profile || {};
  const account = {
    name: (p.name || '').trim(),
    redId: (p.redId || '').replace(/^\s*小红书号[：:]\s*/, '').trim(),
    desc: redactContacts((p.desc || '').trim()),
    ip: (p.ip || '').replace(/^\s*IP属地[：:]\s*/, '').trim(),
    tags: [...new Set((p.tags || []).map((t) => t.trim()).filter(Boolean))],
    following: pick(p.interactions, /关注$/),
    followers: pick(p.interactions, /粉丝$/),
    likesAndCollects: pick(p.interactions, /获赞与收藏$/),
    visibleNoteCount: data.noteCount ?? (data.notes || []).length,
    fetchedAt: data.fetchedAt || null,
  };

  const notes = (data.notes || []).map((n, i) => {
    const d = n.detail || {};
    const like = parseCount(d.like ?? n.like);
    const collect = parseCount(d.collect);
    const comment = parseCount(d.comment);
    return {
      idx: i + 1,
      title: (d.title || n.title || '(无标题)').trim(),
      type: n.video ? '视频' : '图文',
      pinned: !!n.pinned,
      like, collect, comment,
      engagement: like + collect + comment,
      hasDetail: !!n.detail,
      imageCount: d.imageCount ?? null,
      // 正文不截断：购买入口、安装命令常写在结尾（小红书正文上限 1000 字，这里留足余量）
      desc: redactContacts((d.desc || '').replace(/\s+/g, ' ').trim().slice(0, 3000)),
      hashtags: [...new Set(((d.desc || '') + ' ' + (d.title || n.title || '')).match(/#[^\s#\[]+/g) || [])].map((t) => t.replace(/\[话题\]$/, '')),
    };
  });

  const detailed = notes.filter((n) => n.hasDetail);
  const eng = detailed.map((n) => n.engagement);
  const stats = {
    listedNotes: notes.length,
    detailedNotes: detailed.length,
    videoCount: notes.filter((n) => n.type === '视频').length,
    pinnedCount: notes.filter((n) => n.pinned).length,
    totalLike: detailed.reduce((a, n) => a + n.like, 0),
    totalCollect: detailed.reduce((a, n) => a + n.collect, 0),
    totalComment: detailed.reduce((a, n) => a + n.comment, 0),
    avgLike: avg(detailed.map((n) => n.like)),
    avgCollect: avg(detailed.map((n) => n.collect)),
    avgComment: avg(detailed.map((n) => n.comment)),
    avgEngagement: avg(eng),
    medianEngagement: median(eng),
    zeroEngagementNotes: detailed.filter((n) => n.engagement === 0).length,
  };
  stats.collectToLikeRatio = stats.totalLike ? Math.round((stats.totalCollect / stats.totalLike) * 100) / 100 : null;
  // 常被引用的派生数：由代码算好写进事实表，模型只能照抄（自己算会算错）
  const totalEng = eng.reduce((a, b) => a + b, 0);
  const sortedDesc = [...detailed].sort((a, b) => b.engagement - a.engagement);
  stats.totalEngagement = totalEng;
  stats.top1SharePct = totalEng ? Math.round((sortedDesc[0].engagement / totalEng) * 1000) / 10 : null;
  stats.top2SharePct = totalEng ? Math.round(((sortedDesc[0].engagement + (sortedDesc[1]?.engagement || 0)) / totalEng) * 1000) / 10 : null;
  stats.zeroCommentIdx = detailed.filter((n) => n.comment === 0).map((n) => n.idx);
  stats.lowCommentIdx = detailed.filter((n) => n.comment <= 1).map((n) => n.idx);
  stats.under10Idx = detailed.filter((n) => n.engagement < 10).map((n) => n.idx);
  const top = sortedDesc.slice(0, 5).map((n) => n.idx);
  return { account, notes, stats, topNoteIdx: top, signals: conversionSignals(notes, account) };
}

// 转化信号：从简介和笔记全文里按规则抽取，给「有没有付费入口 / 承接动作」这类判断当硬依据
const SIGNAL_RULES = [
  ['挂商品/店铺购买', /下方商品|商品卡|拍下|直接拍|小红书店铺|橱窗|店铺|下单/],
  ['早鸟/定价', /早鸟|原价|定价|限时|优惠|[￥¥]\s?\d|\d+\s?元/],
  ['私信/加群', /私信|私聊|加群|群聊|粉丝群|进群/],
  ['站外账号', /公众号|微信|vx|v信|X（推特）|推特|twitter|B站|抖音|知乎|github|GitHub/i],
  ['安装命令/开源', /npx |pip install|brew install|skills add|开源|Star|MIT/],
  ['技能平台/工具入口', /SkillHub|REDSkill|RED Skill|小程序|App Store|官网/],
  ['领取/获取资料', /领取|获取|发你|秒发|免费送|扣1|评论区/],
];
function conversionSignals(notes, account) {
  const out = [];
  for (const [name, re] of SIGNAL_RULES) {
    const hits = [];
    if (re.test(account.desc)) hits.push('简介');
    for (const n of notes) {
      const text = `${n.title} ${n.desc}`;
      const m = text.match(re);
      if (m) {
        const at = text.indexOf(m[0]);
        hits.push(`#${n.idx}「…${text.slice(Math.max(0, at - 18), at + 30).replace(/\|/g, '/')}…」`);
      }
    }
    out.push({ name, hits });
  }
  return out;
}

export function routeStats(facts, routes) {
  const byIdx = new Map(facts.notes.map((n) => [n.idx, n]));
  return routes.map((r) => {
    const ns = (r.note_indexes || []).map((i) => byIdx.get(Number(i))).filter((n) => n && n.hasDetail);
    const sorted = [...ns].sort((a, b) => b.engagement - a.engagement);
    const best = sorted[0];
    const sum = ns.reduce((a, n) => a + n.engagement, 0);
    return {
      median: median(ns.map((n) => n.engagement)),
      avgWithoutBest: sorted.length > 1 ? avg(sorted.slice(1).map((n) => n.engagement)) : null,
      bestSharePct: sum && best ? Math.round((best.engagement / sum) * 1000) / 10 : null,
      name: r.name, description: r.description, count: ns.length,
      avgLike: avg(ns.map((n) => n.like)), avgCollect: avg(ns.map((n) => n.collect)),
      avgComment: avg(ns.map((n) => n.comment)), avgEngagement: avg(ns.map((n) => n.engagement)),
      best: best ? { idx: best.idx, title: best.title, engagement: best.engagement } : null,
      noteIdx: ns.map((n) => n.idx),
      sequence: [...ns].sort((a, b) => a.idx - b.idx).map((n) => `#${n.idx}:${n.engagement}`).join(' '), // 序号越小越新
    };
  });
}

const fmt = (v) => (v === null || v === undefined ? '未采到' : String(v));
// 粉丝、获赞这类大数按主页的写法显示（30.7万），报告照抄时才和客户看到的一致
export const fmtWan = (v) => (v === null || v === undefined ? '未采到' : v >= 10000 ? `${(Math.round(v / 1000) / 10).toString()}万` : String(v));
const chinaTime = (iso) => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));

// 给模型看的数据事实表（Markdown）
export function factsMarkdown(facts, routes = null) {
  const a = facts.account;
  const s = facts.stats;
  const lines = [
    '## 数据事实表（报告中的数字只能取自本表）',
    '',
    '| 项目 | 数值 |',
    '| --- | --- |',
    `| 账号名 | ${a.name} |`,
    `| 数据采集时间 | ${a.fetchedAt ? chinaTime(a.fetchedAt) : '未记录'} |`,
    `| 小红书号 | ${fmt(a.redId)} |`,
    `| IP属地 | ${fmt(a.ip)} |`,
    `| 粉丝数 | ${fmtWan(a.followers)} |`,
    `| 获赞与收藏 | ${fmtWan(a.likesAndCollects)} |`,
    `| 获赞与收藏 ÷ 粉丝 | ${a.followers && a.likesAndCollects ? Math.round((a.likesAndCollects / a.followers) * 10) / 10 : '无法计算'} |`,
    `| 关注数 | ${fmt(a.following)} |`,
    `| 主页标签 | ${a.tags.join('、') || '无'} |`,
    `| 主页可见笔记数（本次加载到的） | ${s.listedNotes} |`,
    `| 进入详情页采集的笔记数 | ${s.detailedNotes} |`,
    `| 其中视频笔记 | ${s.videoCount} |`,
    `| 置顶笔记数 | ${s.pinnedCount} |`,
    `| 篇均点赞 / 收藏 / 评论 | ${s.avgLike} / ${s.avgCollect} / ${s.avgComment} |`,
    `| 篇均总互动（赞+藏+评） | ${s.avgEngagement} |`,
    `| 总互动中位数 | ${s.medianEngagement} |`,
    `| 总互动为 0 的笔记 | ${s.zeroEngagementNotes} 篇 |`,
    `| 收藏/点赞比 | ${fmt(s.collectToLikeRatio)} |`,
    `| 全部笔记总互动 | ${s.totalEngagement} |`,
    `| 互动最高 1 篇 / 前 2 篇占总互动 | ${fmt(s.top1SharePct)}% / ${fmt(s.top2SharePct)}% |`,
    `| 评论为 0 的笔记 | ${s.zeroCommentIdx.length} 篇（#${s.zeroCommentIdx.join('、#') || '无'}） |`,
    `| 评论为 0 或 1 的笔记 | ${s.lowCommentIdx.length} 篇（#${s.lowCommentIdx.join('、#') || '无'}） |`,
    `| 总互动不到 10 的笔记 | ${s.under10Idx.length} 篇（#${s.under10Idx.join('、#') || '无'}） |`,
    '',
    '简介原文：',
    '',
    a.desc || '（空）',
    '',
  ];
  if (routes) {
    lines.push('### 内容路线分组统计（按篇均总互动比较哪类内容在跑赢）', '', '| 内容路线 | 篇数 | 篇均总互动 | 中位数 | 去掉最佳一篇后的均值 | 最佳一篇占该路线互动 | 该路线最佳笔记 | 按发布顺序的互动（新→旧） |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const r of routes) {
      lines.push(`| ${r.name} | ${r.count} | ${r.avgEngagement} | ${r.median} | ${fmt(r.avgWithoutBest)} | ${fmt(r.bestSharePct)}% | ${r.best ? `#${r.best.idx} ${r.best.title.replace(/\|/g, '/')}（${r.best.engagement}）` : '无'} | ${r.sequence} |`);
    }
    lines.push('', '最佳一篇占该路线互动超过 50% 时，说明这条路线靠单篇撑着，不能据此说「这类内容已验证」。');
    lines.push('');
  }
  lines.push('### 笔记明细（序号越小越新）', '', '| 序号 | 标题 | 形式 | 置顶 | 赞 | 藏 | 评 | 总互动 |', '| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const n of facts.notes) {
    lines.push(`| ${n.idx} | ${n.title.replace(/\|/g, '/')} | ${n.type} | ${n.pinned ? '是' : ''} | ${n.hasDetail ? n.like : '未采'} | ${n.hasDetail ? n.collect : '未采'} | ${n.hasDetail ? n.comment : '未采'} | ${n.hasDetail ? n.engagement : '未采'} |`);
  }
  if (facts.signals) {
    lines.push('', '### 转化信号（按规则从简介和笔记全文抽取；判断「有没有付费入口、有没有承接动作」必须以这张表为准）', '', '| 信号 | 出现位置与原文片段 |', '| --- | --- |');
    for (const sg of facts.signals) lines.push(`| ${sg.name} | ${sg.hits.length ? sg.hits.join('；') : '未发现'} |`);
  }
  return lines.join('\n');
}

export function notesDigest(facts) {
  return facts.notes.map((n) => `#${n.idx}【${n.title}】${n.type}${n.pinned ? '·置顶' : ''} 赞${n.like} 藏${n.collect} 评${n.comment}${n.hashtags.length ? ` 话题：${n.hashtags.join(' ')}` : ''}\n正文全文：${n.desc || '（未采到正文）'}`).join('\n\n');
}

// ---- 命令行入口 ----
const [dir, ...rest] = process.argv.slice(2);
if (!dir) { console.error('用法: node facts.mjs <证据目录> [--routes=<routes.json>]'); process.exit(1); }
const data = JSON.parse(readFileSync(join(dir, 'data.json'), 'utf8'));
const facts = buildFacts(data);
const routesArg = rest.find((a) => a.startsWith('--routes='));
const routeTable = routesArg ? routeStats(facts, JSON.parse(readFileSync(routesArg.split('=').slice(1).join('='), 'utf8')).routes || []) : null;
const md = factsMarkdown(facts, routeTable);
writeFileSync(join(dir, '数据事实表.md'), md);
if (data.fetchedAt && Date.now() - Date.parse(data.fetchedAt) > 72 * 3600 * 1000) console.error('提醒：数据是 72 小时前抓的，粉丝和互动可能已经变了，建议重新运行 xhs_fetch.mjs');
console.log(md);
