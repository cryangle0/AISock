// 集中常量定义 — 与 PatternDefs 组件分离，便于 fast refresh。

export const PATTERN_LIST = [
  { id: 'p-floral',     name: '碎花',     swatch: '#fff7fa', fg: '#d4376b' },
  { id: 'p-stripe',     name: '条纹',     swatch: '#ffffff', fg: '#d4376b' },
  { id: 'p-dots',       name: '圆点',     swatch: '#fdf3f8', fg: '#d4376b' },
  { id: 'p-checker',    name: '方格',     swatch: '#ffffff', fg: '#d4376b' },
  { id: 'p-flower-big', name: '大花',     swatch: '#fff7fa', fg: '#e85a8a' },
  { id: 'p-blue',       name: '蓝花',     swatch: '#eef4fb', fg: '#3a6fb0' },
  { id: 'p-mono',       name: '单色',     swatch: '#23262d', fg: '#aab1bd' },
  { id: 'p-gold',       name: '金色',     swatch: '#fff8e7', fg: '#b8893a' },
  { id: 'p-mint',       name: '薄荷',     swatch: '#eaf6f0', fg: '#5fb18a' },
]

export const PATTERN_MAP = Object.fromEntries(PATTERN_LIST.map(p => [p.id, p]))

export const REGION_LABELS = {
  welt: '袜口',
  cuff: '螺口',
  body: '主体（含袜跟）',
  toe:  '袜头',
}

export const REGION_ORDER = ['welt', 'cuff', 'body', 'toe']
