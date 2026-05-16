// 印花/订单相关的全局常量。集中放这里，避免散落在多个组件。

export const MATERIALS = [
  { value: 'cotton', label: '棉', desc: '舒适亲肤，日常款首选' },
  { value: 'nylon',  label: '尼龙', desc: '弹性强韧，运动/通勤' },
]

export const CRAFTS = [
  { value: 'uv',     label: 'UV 印花',   desc: '色彩鲜艳，纹理细腻' },
  { value: '3d',     label: '3D 印花',   desc: '立体浮雕感，触感丰富' },
  { value: 'jacquard', label: '针织提花', desc: '织线成花，质感传统' },
]

// 颜色类别 — 用于 BaseColorPicker 的筛选 chips
export const COLOR_CATEGORIES = [
  { key: 'all',     label: '全部' },
  { key: 'neutral', label: '中性' },
  { key: 'warm',    label: '暖色' },
  { key: 'cool',    label: '冷色' },
  { key: 'trend',   label: '流行色' },
]

// 底色/袜跟/袜头的预设色板（含"自动"= 取印花主色调）
// 每个色加 category 字段，便于在 BaseColorPicker 里筛选
export const BASE_COLOR_PRESETS = [
  { value: 'auto',         label: '跟印花',   hex: null,        category: 'auto' },

  // 中性 8
  { value: 'white',        label: '米白',     hex: '#f6f1e7',   category: 'neutral' },
  { value: 'cream',        label: '奶油',     hex: '#efe4cc',   category: 'neutral' },
  { value: 'beige',        label: '驼色',     hex: '#c9a982',   category: 'neutral' },
  { value: 'silver',       label: '银灰',     hex: '#c0c4cc',   category: 'neutral' },
  { value: 'gray',         label: '雾灰',     hex: '#9aa0a8',   category: 'neutral' },
  { value: 'charcoal',     label: '炭灰',     hex: '#3a3d44',   category: 'neutral' },
  { value: 'navy',         label: '藏青',     hex: '#2f3a52',   category: 'neutral' },
  { value: 'black',        label: '黑色',     hex: '#1a1c20',   category: 'neutral' },

  // 暖色 6
  { value: 'pink',         label: '樱粉',     hex: '#f0b8c4',   category: 'warm' },
  { value: 'blush',        label: '腮红',     hex: '#d56f7d',   category: 'warm' },
  { value: 'coral',        label: '珊瑚',     hex: '#e98a7a',   category: 'warm' },
  { value: 'apricot',      label: '杏橘',     hex: '#e7a479',   category: 'warm' },
  { value: 'crimson',      label: '绯红',     hex: '#b23a48',   category: 'warm' },
  { value: 'mustard',      label: '芥末',     hex: '#c79b54',   category: 'warm' },

  // 冷色 6
  { value: 'mint',         label: '薄荷',     hex: '#a4d4b9',   category: 'cool' },
  { value: 'sage',         label: '鼠尾草',   hex: '#9caf88',   category: 'cool' },
  { value: 'forest',       label: '松绿',     hex: '#3f6f5a',   category: 'cool' },
  { value: 'sky',          label: '天蓝',     hex: '#a8c9e3',   category: 'cool' },
  { value: 'indigo',       label: '靛青',     hex: '#3a5a8a',   category: 'cool' },
  { value: 'lavender',     label: '丁香',     hex: '#c2b3d6',   category: 'cool' },

  // 流行色 6（参考 Pantone 2024-2026 趋势 + 经典）
  { value: 'olive',        label: '橄榄',     hex: '#7e7d4a',   category: 'trend' },
  { value: 'peach-fuzz',   label: '蜜桃绒',   hex: '#fcb4a3',   category: 'trend' },
  { value: 'mocha-mousse', label: '可可慕斯', hex: '#a08570',   category: 'trend' },
  { value: 'butter',       label: '黄油黄',   hex: '#f5e1a4',   category: 'trend' },
  { value: 'lilac',        label: '丁香紫',   hex: '#a890b8',   category: 'trend' },
  { value: 'jade',         label: '翡翠绿',   hex: '#3a8a7d',   category: 'trend' },
]
