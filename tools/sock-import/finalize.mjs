// 袜版导入 - Phase 3：根据 out/geometry.json 生成 server/migrations/008_sock_data.sql
//   - thumb_url 指向 web 静态站 https://onnsa.cn/aisock/socks/<code>.png（随 web 部署上线）
//   - INSERT ... ON DUPLICATE KEY UPDATE：重复执行只刷新 几何/缩略图/名称/板型/尺寸/排序，
//     不覆盖 价格/起订量/状态（保留后台手工调整）。
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const socks = JSON.parse(readFileSync(path.join(__dir, 'out/geometry.json'), 'utf8'))
const THUMB_BASE = 'https://onnsa.cn/aisock/socks'
const THUMB_VERSION = '20260618sockfix2'

const q = (v) => {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
}

const rows = socks.map((s, i) => {
  const geo = JSON.stringify(s.geometry)
  const thumb = `${THUMB_BASE}/${s.code}.png?v=${THUMB_VERSION}`
  return '(' + [
    q(s.code), q(s.name), q(s.family), q(geo), q(thumb),
    q(s.phys_height_mm), 150, 50, 0, i + 1, 1,
  ].join(', ') + ')'
})

const sql = `-- 008-data: 导入 docs/袜板 的 22 个真实袜版（几何 + 缩略图）
-- 由 tools/sock-import 生成；幂等：ON DUPLICATE KEY 只刷新几何/缩略图/名称/板型/尺寸/排序。
-- 注意：unit_price 默认 0、min_order 默认 50，请在「后台 · 袜型管理」按实际定价调整。
INSERT INTO \`sock_model\`
  (\`code\`, \`name\`, \`family\`, \`geometry_json\`, \`thumb_url\`, \`phys_height_mm\`, \`recommend_dpi\`, \`min_order\`, \`unit_price\`, \`sort\`, \`status\`)
VALUES
${rows.join(',\n')}
ON DUPLICATE KEY UPDATE
  \`name\` = VALUES(\`name\`),
  \`family\` = VALUES(\`family\`),
  \`geometry_json\` = VALUES(\`geometry_json\`),
  \`thumb_url\` = VALUES(\`thumb_url\`),
  \`phys_height_mm\` = VALUES(\`phys_height_mm\`),
  \`sort\` = VALUES(\`sort\`);

-- 退役所有无矢量几何的历史袜型（含 demo-*、long-tube 等占位），袜版库即这 22 个真实袜版。
UPDATE \`sock_model\` SET \`status\` = 0 WHERE \`geometry_json\` IS NULL;
`

const outPath = path.resolve(__dir, '../../server/migrations/008_sock_data.sql')
writeFileSync(outPath, sql)
console.log(`生成 ${outPath}`)
console.log(`${socks.length} 行；SQL 大小 ${(sql.length / 1024).toFixed(1)} KB`)
