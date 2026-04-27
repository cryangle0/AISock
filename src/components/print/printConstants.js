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

// 底色/袜跟/袜头的预设色板（含"自动"= 取印花主色调）
export const BASE_COLOR_PRESETS = [
  { value: 'auto',     label: '跟印花', hex: null },
  { value: 'white',    label: '米白',   hex: '#f6f1e7' },
  { value: 'cream',    label: '奶油',   hex: '#efe4cc' },
  { value: 'beige',    label: '驼色',   hex: '#c9a982' },
  { value: 'gray',     label: '雾灰',   hex: '#9aa0a8' },
  { value: 'navy',     label: '藏青',   hex: '#2f3a52' },
  { value: 'black',    label: '黑色',   hex: '#1a1c20' },
  { value: 'pink',     label: '樱粉',   hex: '#f0b8c4' },
  { value: 'blush',    label: '腮红',   hex: '#d56f7d' },
  { value: 'apricot',  label: '杏橘',   hex: '#e7a479' },
  { value: 'mustard',  label: '芥末',   hex: '#c79b54' },
  { value: 'olive',    label: '橄榄',   hex: '#7e7d4a' },
  { value: 'mint',     label: '薄荷',   hex: '#a4d4b9' },
  { value: 'forest',   label: '松绿',   hex: '#3f6f5a' },
  { value: 'sky',      label: '天蓝',   hex: '#a8c9e3' },
  { value: 'indigo',   label: '靛青',   hex: '#3a5a8a' },
  { value: 'lavender', label: '丁香',   hex: '#c2b3d6' },
]
