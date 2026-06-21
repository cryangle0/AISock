/**
 * 从 .tmp-feishu-export.json（chrome-devtools evaluate 输出）生成待处理需求 Markdown + 图片
 * Usage: node scripts/feishu-export-from-json.js [jsonPath] [outDir]
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const jsonPath = process.argv[2] || path.join(root, '.tmp-feishu-export.json');
const outDir =
  process.argv[3] || path.join(root, '需求', '2026-06-20-待处理');
const imgDir = path.join(outDir, 'images');

const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const data = raw.result || raw;

fs.mkdirSync(imgDir, { recursive: true });

function safeName(s, max = 40) {
  return String(s || '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '')
    .slice(0, max);
}

let md = '# 待处理需求清单（飞书表格导出）\n\n';
md += '> 来源：飞书多维表格《袜子小程序web的问题维护》\n';
md += '> 链接：https://my.feishu.cn/wiki/IOX4wOPWpiM0e7klQcscw7f9njd?table=tblt71WCcW4LUngs&view=vewWHFaE6p\n';
md += '> 筛选条件：BUG状态 或 BUG状态1 = 待处理\n\n';
md += `共 ${data.rows.length} 项待处理。\n\n---\n\n`;

for (let i = 0; i < data.rows.length; i++) {
  const r = data.rows[i];
  md += `## ${i + 1}. ${r.name}\n\n`;
  md += `- 状态：${r.status} / ${r.status1}\n`;
  md += `- 模块：${r.module || '（无）'}\n`;
  md += `- 表格行号：第 ${r.row} 行（记录ID ${r.recordId}）\n`;
  if (r.remark) md += `- 备注：${r.remark}\n`;
  md += '\n';

  const imgs = data.images[r.recordId] || [];
  for (const img of imgs) {
    const ext =
      img.name && img.name.includes('.')
        ? path.extname(img.name)
        : img.mime && img.mime.includes('png')
          ? '.png'
          : '.jpg';
    const fname = `${r.row}_${img.idx}_${safeName(r.name)}${ext}`;
    fs.writeFileSync(path.join(imgDir, fname), Buffer.from(img.b64, 'base64'));
    md += `![img](images/${fname})\n\n`;
  }
  md += '---\n\n';
}

if (data.errors?.length) {
  md += '## 图片下载失败\n\n';
  for (const e of data.errors) {
    md += `- ${e.recordId} ${e.name}\n`;
  }
}

fs.writeFileSync(path.join(outDir, '待处理需求清单.md'), md, 'utf8');
console.log(
  JSON.stringify({
    outDir,
    rows: data.rows.length,
    images: data.imgCount || 0,
    errors: data.errors?.length || 0,
  }),
);
