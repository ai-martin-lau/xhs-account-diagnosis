#!/usr/bin/env node
// 把诊断报告 Markdown 构建成出版级 PDF(宣纸底、墨色正文、朱砂强调)。零依赖: Node + 本机 Chrome 无头打印。
// 用法: node build_pdf.mjs <input.md> <output.pdf> [--subtitle=副标题] [--brand=出品方] [--seal=印章两字]
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const [input, output] = argv.filter((a) => !a.startsWith('--'));
const opt = (k, d) => (argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split('=').slice(1).join('=');
if (!input || !output) { console.error('用法: node build_pdf.mjs <input.md> <output.pdf> [--subtitle=] [--brand=] [--seal=]'); process.exit(1); }

const subtitle = opt('subtitle', '账号诊断报告与90天优化方案');
const brand = opt('brand', 'AI 账号诊断');
const seal = opt('seal', '诊断');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let title = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^# (.+)/.test(line)) { title = line.replace(/^# /, '').trim(); i++; continue; }
    if (/^## (.+)/.test(line)) { out.push(`<h2>${inline(line.slice(3).trim())}</h2>`); i++; continue; }
    if (/^### (.+)/.test(line)) { out.push(`<h3>${inline(line.slice(4).trim())}</h3>`); i++; continue; }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out.push('<table><thead><tr>' + head.map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>'
        + body.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody></table>');
      continue;
    }
    if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
      out.push('<ul>' + items.map((it) => `<li>${inline(it)}</li>`).join('') + '</ul>');
      continue;
    }
    if (/^\d+[.、] /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+[.、] /.test(lines[i])) { items.push(lines[i].replace(/^\d+[.、] /, '')); i++; }
      out.push('<ol>' + items.map((it) => `<li>${inline(it)}</li>`).join('') + '</ol>');
      continue;
    }
    if (line.trim() === '' || /^---+$/.test(line.trim())) { i++; continue; }
    const para = [];
    // 只有真正的块起点才截断段落：「#13 那篇」「#话题」这类以 # 开头的正文行不是标题，按原逻辑会原地死循环吃光内存
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,3} |\||[-*] |\d+[.、] )/.test(lines[i])) { para.push(lines[i].trim()); i++; }
    if (!para.length) { para.push(lines[i].trim()); i++; } // 兜底：任何分支都没接住的行按正文输出，保证循环前进
    out.push(`<p>${para.map(inline).join('<br>')}</p>`); // 段内换行保留：可直接粘贴的简介、对照写法是一行一条
  }
  return { title, body: out.join('\n') };
}

const md = readFileSync(resolve(input), 'utf8');
const { title, body } = mdToHtml(md);
const today = md.match(/\d{4}年\d{1,2}月\d{1,2}日/) ? md.match(/\d{4}年\d{1,2}月\d{1,2}日/)[0] : '';

const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  @page { size: A4; margin: 17mm 16mm 19mm 16mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", serif;
         color: #262626; background: #ffffff; font-size: 10.5pt; line-height: 1.9; }
  .cover { page-break-after: always; height: 236mm; position: relative;
           border: 3px double #9e2b25; padding: 26mm 18mm; background: #ffffff; }
  .cover .brand { font-size: 11pt; letter-spacing: 0.35em; color: #6b6154; }
  .cover h1 { font-size: 23pt; line-height: 1.6; margin: 42mm 0 8mm; color: #1e1a15; font-weight: 700; text-wrap: balance; }
  .cover .sub { font-size: 13pt; color: #9e2b25; letter-spacing: 0.12em; margin-bottom: 4mm; }
  .cover .date { font-size: 10.5pt; color: #6b6154; }
  .cover .seal { position: absolute; right: 18mm; bottom: 24mm; width: 21mm; height: 21mm;
                 background: #9e2b25; color: #ffffff; display: flex; align-items: center; justify-content: center;
                 font-size: 13pt; letter-spacing: 0.1em; border-radius: 2px; writing-mode: vertical-rl; }
  h2 { page-break-before: ${argv.includes('--compact') ? 'auto' : 'always'}; font-size: 16pt; color: #1e1a15; margin: 8mm 0 5mm;
       padding-left: 10px; border-left: 5px solid #9e2b25; letter-spacing: 0.04em; }
  h2:first-of-type { page-break-before: auto; }
  h2, h3 { page-break-after: avoid; }
  h3 { font-size: 12pt; color: #9e2b25; margin: 7mm 0 2.5mm; }
  p { margin: 0 0 3.2mm; text-align: justify; }
  strong { font-weight: 700; color: #1e1a15; }
  ul, ol { margin: 0 0 3.5mm; padding-left: 2em; }
  li { margin-bottom: 1.2mm; }
  table { width: 100%; border-collapse: collapse; margin: 2.5mm 0 4.5mm; font-size: 9pt; line-height: 1.6;
          page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  th { background: #f2f2f2; color: #1e1a15; font-weight: 700; }
  th, td { border: 1px solid #d9d9d9; padding: 4.5px 7px; text-align: left; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #fafafa; }
</style></head><body>
  <div class="cover">
    <div class="brand">${esc(brand)}</div>
    <h1>${esc(title)}</h1>
    <div class="sub">${esc(subtitle)}</div>
    <div class="date">${esc(today)}</div>
    <div class="seal">${esc(seal)}</div>
  </div>
  ${body}
</body></html>`;

const tmpHtml = join(tmpdir(), `report-${Date.now()}.html`);
writeFileSync(tmpHtml, html);

const chromes = process.platform === 'darwin'
  ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
  : process.platform === 'win32'
    ? [join(process.env['PROGRAMFILES'] || '', 'Google/Chrome/Application/chrome.exe'),
       join(process.env['PROGRAMFILES(X86)'] || '', 'Google/Chrome/Application/chrome.exe')]
    : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
const chrome = chromes.find((p) => existsSync(p));
if (!chrome) { console.error('未找到 Chrome，无法生成 PDF。'); process.exit(1); }

// 无头打印偶发挂死: 限时 + 最多重试 3 次
let ok = false;
for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
  const r = spawnSync(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run',
    `--user-data-dir=${join(tmpdir(), 'pdf-profile-' + Date.now())}`,
    '--no-pdf-header-footer', `--print-to-pdf=${resolve(output)}`, `file://${tmpHtml}`,
  ], { timeout: 90000, stdio: 'ignore' });
  ok = r.status === 0 && existsSync(resolve(output));
  if (!ok) console.error(`打印第 ${attempt} 次失败，重试...`);
}
unlinkSync(tmpHtml);
if (!ok) { console.error('PDF 生成失败。'); process.exit(1); }
console.log(`PDF 已生成: ${resolve(output)}`);
