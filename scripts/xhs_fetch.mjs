#!/usr/bin/env node
// 零配置抓取小红书主页：主页信息 + 全部可见笔记(标题/点赞/封面) + 每篇详情(正文/赞藏评/全部多图) + 截图。
// 用法: node xhs_fetch.mjs <小红书主页URL> [输出目录] [--notes=N] [--no-inner]
//   --notes=N 限制进详情页的笔记数(默认30, 0=只抓主页); --no-inner 不下载笔记内页图(只要封面和截图, 快很多)
// 要求: Node 22+(原生 WebSocket)、本机 Chrome。自动连接用户日常 Chrome(自带登录态), 没开调试端口会自动拉起。
// 兼容 Chrome 134+: /json HTTP 发现端点已被移除(404), 改从用户数据目录 DevToolsActivePort 文件拿浏览器 WS 地址。
// 首次连接如果 Chrome 弹出「允许远程调试」对话框, 请点允许。
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { spawn, execSync } from 'node:child_process';
import { join } from 'node:path';
import { homedir } from 'node:os';

const argv = process.argv.slice(2);
const url = argv[0];
const outDir = argv.find((a, i) => i > 0 && !a.startsWith('--')) || '.';
const noteLimit = Number((argv.find((a) => a.startsWith('--notes=')) || '--notes=30').split('=')[1]);
const skipInner = argv.includes('--no-inner');
if (!url || !/xiaohongshu\.com/.test(url)) {
  console.error('用法: node xhs_fetch.mjs <小红书主页URL> [输出目录] [--notes=N]');
  process.exit(1);
}
const PORT = process.env.CDP_PORT || 9222;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findBrowserWs() {
  for (const host of ['127.0.0.1', 'localhost']) {
    try {
      const r = await fetch(`http://${host}:${PORT}/json/version`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) { const j = await r.json(); if (j.webSocketDebuggerUrl) return j.webSocketDebuggerUrl; }
    } catch { /* Chrome 134+ 此端点 404/无响应, 走文件发现 */ }
  }
  const dirs = process.platform === 'darwin'
    ? [join(homedir(), 'Library/Application Support/Google/Chrome')]
    : process.platform === 'win32'
      ? [join(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data')]
      : [join(homedir(), '.config/google-chrome'), join(homedir(), '.config/chromium')];
  for (const d of dirs) {
    const f = join(d, 'DevToolsActivePort');
    if (existsSync(f)) {
      const [port, path] = readFileSync(f, 'utf8').trim().split('\n');
      try {
        return await new Promise((res, rej) => {
          const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
          ws.onopen = () => { ws.close(); res(`ws://127.0.0.1:${port}${path}`); };
          ws.onerror = rej;
          setTimeout(() => rej(new Error('timeout')), 3000);
        });
      } catch { /* 文件是旧的, 继续 */ }
    }
  }
  return null;
}

async function ensureChrome() {
  let ws = await findBrowserWs();
  if (ws) return ws;
  let running = false;
  try {
    if (process.platform === 'darwin') { execSync('pgrep -x "Google Chrome"', { stdio: 'ignore' }); running = true; }
    else if (process.platform === 'linux') { execSync('pgrep -f chrome', { stdio: 'ignore' }); running = true; }
  } catch { /* not running */ }
  if (running) {
    console.error('Chrome 正在运行但没开调试端口。请完全退出 Chrome(macOS 按 Cmd+Q), 然后重新运行本脚本, 会自动带调试端口启动。');
    process.exit(2);
  }
  if (process.platform === 'darwin') spawn('open', ['-a', 'Google Chrome', '--args', `--remote-debugging-port=${PORT}`], { detached: true, stdio: 'ignore' });
  else if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', 'chrome', `--remote-debugging-port=${PORT}`], { detached: true, stdio: 'ignore' });
  else spawn('sh', ['-c', `(google-chrome || chromium || chromium-browser) --remote-debugging-port=${PORT} >/dev/null 2>&1 &`], { detached: true, stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { await sleep(500); ws = await findBrowserWs(); if (ws) return ws; }
  console.error('连接 Chrome 失败。请手动带 --remote-debugging-port=9222 启动 Chrome 后重试; 若弹出「允许远程调试」对话框请点允许。');
  process.exit(1);
}

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const call = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
    ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  return { call, ready: new Promise((r) => { ws.onopen = r; }), close: () => ws.close() };
}

const sanitize = (s) => (s || 'note').replace(/[^\w一-鿿]/g, '').slice(0, 15) || 'note';

async function download(src, file) {
  try {
    const buf = Buffer.from(await (await fetch(src, { signal: AbortSignal.timeout(30000) })).arrayBuffer());
    if (buf.length > 1000) { writeFileSync(file, buf); return true; }
  } catch { /* 单张失败不中断 */ }
  return false;
}

(async () => {
  const wsUrl = await ensureChrome();
  mkdirSync(outDir, { recursive: true });
  const c = cdp(wsUrl);
  await c.ready;
  const { targetId } = await c.call('Target.createTarget', { url });
  const { sessionId } = await c.call('Target.attachToTarget', { targetId, flatten: true });
  const ev = async (expr) => (await c.call('Runtime.evaluate', { expression: expr, returnByValue: true }, sessionId)).result.value;
  const waitLoad = async () => { for (let i = 0; i < 30; i++) { await sleep(1000); if ((await ev('document.readyState')) === 'complete') break; } };

  await waitLoad();
  await sleep(2000);
  if (await ev("!document.querySelector('.user-name') && !!document.querySelector('.login-container, .reds-modal-mask')")) {
    console.error('警告: 出现登录墙。请在这台 Chrome 里登录小红书后重跑。');
  }

  const profile = await ev(`(() => {
    const q = (s) => document.querySelector(s);
    return {
      name: (q('.user-name') || q('.user-nickname') || {}).textContent || null,
      redId: (q('.user-redId') || {}).textContent || null,
      desc: (q('.user-desc') || {}).textContent || null,
      ip: (q('.user-IP') || {}).textContent || null,
      interactions: [...document.querySelectorAll('.user-interactions div')].map((d) => d.textContent.trim()),
      tags: [...document.querySelectorAll('.user-tags .tag-item, .user-tags div')].map((d) => d.textContent.trim()),
    };
  })()`);
  console.error(`主页: ${profile.name} ${JSON.stringify(profile.interactions)}`);

  // 主页笔记流会边滚动边回收前面的卡片：滚到底再一次性读，只剩后面的旧笔记，置顶和最新几篇全丢。
  // 所以从顶部开始，每次滚约一屏就收集一次，按首次出现的顺序去重（置顶和最新的排在最前）。
  const readCards = () => ev(`[...document.querySelectorAll('section.note-item')].map((el) => {
    const t = el.querySelector('.title');
    const c = el.querySelector('.count');
    const a = el.querySelector('a.cover');
    const img = el.querySelector('a.cover img');
    return {
      title: t ? t.textContent.trim() : '(无标题)',
      like: c ? c.textContent.trim() : '',
      video: !!el.querySelector('.play-icon, [class*=video]'),
      pinned: /置顶/.test(el.textContent),
      href: a ? a.getAttribute('href') : null,
      cover: img ? img.src : null,
    };
  })`);
  const seen = new Map();
  const want = Math.max(noteLimit, 30);
  await ev('window.scrollTo(0, 0)');
  await sleep(800);
  for (let i = 0; i < 40 && seen.size < want; i++) {
    for (const card of await readCards()) {
      const key = (card.href || '').split('?')[0] || card.title;
      if (key && !seen.has(key)) seen.set(key, card);
    }
    const atBottom = await ev('window.innerHeight + window.scrollY >= document.body.scrollHeight - 50');
    if (atBottom && i > 0) { await sleep(1500); if (await ev('window.innerHeight + window.scrollY >= document.body.scrollHeight - 50')) break; }
    await ev('window.scrollBy(0, Math.round(window.innerHeight * 0.8))');
    await sleep(1200);
  }
  const notes = [...seen.values()].slice(0, want);
  console.error(`笔记列表: ${notes.length} 篇（置顶 ${notes.filter((n) => n.pinned).length} 篇）`);

  await ev('window.scrollTo(0, 0)');
  await sleep(800);
  const shot = await c.call('Page.captureScreenshot', { format: 'png' }, sessionId);
  writeFileSync(join(outDir, 'profile.png'), Buffer.from(shot.data, 'base64'));

  const coverDir = join(outDir, '封面');
  mkdirSync(coverDir, { recursive: true });
  for (let i = 0; i < notes.length; i++) {
    if (notes[i].cover) await download(notes[i].cover, join(coverDir, `${String(i + 1).padStart(2, '0')}_${sanitize(notes[i].title)}.jpg`));
  }
  console.error('封面下载完成');

  // 逐篇进详情页: 正文 + 赞藏评 + 全部多图。链接必须用主页卡片自带的 href(含 xsec_token), 手动拼 /explore/<id> 会 404。
  const imgRoot = join(outDir, '笔记图片');
  if (!skipInner) mkdirSync(imgRoot, { recursive: true });
  const n = Math.min(notes.length, noteLimit);
  for (let i = 0; i < n; i++) {
    const note = notes[i];
    if (!note.href) continue;
    const full = new URL(note.href, 'https://www.xiaohongshu.com').href;
    try {
      await c.call('Page.navigate', { url: full }, sessionId);
      await waitLoad();
      await sleep(2500);
      const d = await ev(`(() => {
        const q = (s) => document.querySelector(s);
        const txt = (e) => (e ? e.textContent.trim() : null);
        const imgs = [...document.querySelectorAll('.slider-container img, .media-container img, .swiper-slide img, .img-container img, .note-slider-img')]
          .map((im) => im.src || im.getAttribute('data-src'))
          .filter((s) => s && /xhscdn/.test(s) && !/avatar|emoji|comment/.test(s));
        return {
          title: txt(q('#detail-title')),
          desc: txt(q('#detail-desc')),
          like: txt(q('.engage-bar .like-wrapper .count')) || txt(q('.like-wrapper .count')),
          collect: txt(q('.collect-wrapper .count')),
          comment: txt(q('.chat-wrapper .count')),
          images: [...new Map(imgs.map((s) => [s.split('?')[0], s])).values()],
        };
      })()`);
      note.detail = { desc: d.desc, like: d.like, collect: d.collect, comment: d.comment, imageCount: d.images.length };
      let saved = 0;
      if (!skipInner) {
        const dir = join(imgRoot, `${String(i + 1).padStart(2, '0')}_${sanitize(note.title)}`);
        mkdirSync(dir, { recursive: true });
        for (let k = 0; k < d.images.length; k++) {
          if (await download(d.images[k], join(dir, `${k + 1}.jpg`))) saved++;
        }
      }
      console.error(`[${i + 1}/${n}] ${note.title.slice(0, 18)} 图${saved}/${d.images.length} 赞${d.like || '-'} 藏${d.collect || '-'} 评${d.comment || '-'}`);
    } catch (err) {
      console.error(`[${i + 1}/${n}] 详情抓取失败: ${err.message}`);
    }
    await sleep(2500 + Math.random() * 2500); // 放慢节奏, 避免风控
  }

  const result = { fetchedFrom: url, fetchedAt: new Date().toISOString(), profile, noteCount: notes.length, notes };
  writeFileSync(join(outDir, 'data.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ profile, noteCount: notes.length, detailed: n }, null, 2));

  await c.call('Target.closeTarget', { targetId });
  c.close();
})();
