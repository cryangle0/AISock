/** 设计器静态数据（与 web/原型 对齐） */

export interface SockType { id: string; name: string; desc: string }
export const SOCK_TYPES: SockType[] = [
  { id: 'crew', name: '中筒袜', desc: '标准长度 · 25cm' },
  { id: 'ankle', name: '船袜', desc: '低帮浅口 · 12cm' },
  { id: 'tube', name: '长筒袜', desc: '过膝长版 · 50cm' },
  { id: 'short', name: '短袜', desc: '常规短款 · 18cm' },
]
export const DEFAULT_SOCK_TYPE_ID = 'crew'

export interface PatternDef { id: string; name: string; bg: string; fg: string }
export const PATTERN_LIST: PatternDef[] = [
  { id: 'p-floral', name: '碎花', bg: '#fff7fa', fg: '#d4376b' },
  { id: 'p-stripe', name: '条纹', bg: '#ffffff', fg: '#d4376b' },
  { id: 'p-dots', name: '圆点', bg: '#fdf3f8', fg: '#d4376b' },
  { id: 'p-checker', name: '方格', bg: '#ffffff', fg: '#d4376b' },
  { id: 'p-flower-big', name: '大花', bg: '#fff7fa', fg: '#e85a8a' },
  { id: 'p-blue', name: '蓝花', bg: '#eef4fb', fg: '#3a6fb0' },
  { id: 'p-mono', name: '单色', bg: '#23262d', fg: '#aab1bd' },
  { id: 'p-gold', name: '金色', bg: '#fff8e7', fg: '#b8893a' },
  { id: 'p-mint', name: '薄荷', bg: '#eaf6f0', fg: '#5fb18a' },
]

export interface Palette { id: string; name: string; desc: string; colors: string[] }
export const COLOR_PALETTES: Palette[] = [
  { id: 'fuchun', name: '富春山居', desc: '黄公望笔下的烟雨青绿', colors: ['#3d4452', '#586477', '#909d9b', '#c8c1ad', '#dfc28a', '#a05a3c', '#c5483c', '#f0ece1'] },
  { id: 'morandi', name: '莫兰迪', desc: '低饱和的静物美学', colors: ['#dab8b1', '#bcb0c0', '#9aa9b3', '#a3b3a4', '#dfc7a7', '#dad1c4', '#8a7e75', '#f3ede4'] },
  { id: 'dunhuang', name: '敦煌·壁画', desc: '朱砂石青 · 矿物质感', colors: ['#c5483c', '#a05a3c', '#c79b54', '#dec38a', '#5a8a7d', '#3a6fa3', '#5b4d44', '#efe6d3'] },
  { id: 'macaron', name: '马卡龙', desc: '少女系 · 高甜糖果', colors: ['#fbcbcb', '#fcd1ad', '#f8e3a3', '#bce0c2', '#bfd5e8', '#d6c8e1', '#fbe9d7', '#fffdf6'] },
  { id: 'guochao', name: '当代国潮', desc: '帝王红 + 螺青 + 月白', colors: ['#c5482b', '#dc6058', '#a07f53', '#5e9b8b', '#3c5b6e', '#8e587c', '#2e3946', '#dde6e5'] },
  { id: 'ocean', name: '海岸', desc: '潮汐与白沙', colors: ['#9ec4d4', '#5a91b0', '#2f6286', '#1f3c52', '#dfb98a', '#a5b9a9', '#cfe1ea', '#f5f5f0'] },
]

export interface ColorPreset { value: string; label: string; hex: string | null; category: string }
export const COLOR_CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'neutral', label: '中性' },
  { key: 'warm', label: '暖色' },
  { key: 'cool', label: '冷色' },
  { key: 'trend', label: '流行色' },
]
export const BASE_COLOR_PRESETS: ColorPreset[] = [
  { value: 'auto', label: '跟印花', hex: null, category: 'auto' },
  { value: 'white', label: '米白', hex: '#f6f1e7', category: 'neutral' },
  { value: 'cream', label: '奶油', hex: '#efe4cc', category: 'neutral' },
  { value: 'beige', label: '驼色', hex: '#c9a982', category: 'neutral' },
  { value: 'silver', label: '银灰', hex: '#c0c4cc', category: 'neutral' },
  { value: 'gray', label: '雾灰', hex: '#9aa0a8', category: 'neutral' },
  { value: 'charcoal', label: '炭灰', hex: '#3a3d44', category: 'neutral' },
  { value: 'navy', label: '藏青', hex: '#2f3a52', category: 'neutral' },
  { value: 'black', label: '黑色', hex: '#1a1c20', category: 'neutral' },
  { value: 'pink', label: '樱粉', hex: '#f0b8c4', category: 'warm' },
  { value: 'blush', label: '腮红', hex: '#d56f7d', category: 'warm' },
  { value: 'coral', label: '珊瑚', hex: '#e98a7a', category: 'warm' },
  { value: 'apricot', label: '杏橘', hex: '#e7a479', category: 'warm' },
  { value: 'crimson', label: '绯红', hex: '#b23a48', category: 'warm' },
  { value: 'mustard', label: '芥末', hex: '#c79b54', category: 'warm' },
  { value: 'mint', label: '薄荷', hex: '#a4d4b9', category: 'cool' },
  { value: 'sage', label: '鼠尾草', hex: '#9caf88', category: 'cool' },
  { value: 'forest', label: '松绿', hex: '#3f6f5a', category: 'cool' },
  { value: 'sky', label: '天蓝', hex: '#a8c9e3', category: 'cool' },
  { value: 'indigo', label: '靛青', hex: '#3a5a8a', category: 'cool' },
  { value: 'lavender', label: '丁香', hex: '#c2b3d6', category: 'cool' },
  { value: 'olive', label: '橄榄', hex: '#7e7d4a', category: 'trend' },
  { value: 'peach-fuzz', label: '蜜桃绒', hex: '#fcb4a3', category: 'trend' },
  { value: 'mocha-mousse', label: '可可慕斯', hex: '#a08570', category: 'trend' },
  { value: 'butter', label: '黄油黄', hex: '#f5e1a4', category: 'trend' },
  { value: 'lilac', label: '丁香紫', hex: '#a890b8', category: 'trend' },
  { value: 'jade', label: '翡翠绿', hex: '#3a8a7d', category: 'trend' },
]

export const AI_PRESETS = ['春日樱花', '海蓝清爽', '复古条纹', '简约几何', '金色奢华', '薄荷清新']

// ── 下单：材质 / 工艺 / 单价 ──
export interface MaterialOpt { value: string; label: string; desc: string }
export const MATERIALS: MaterialOpt[] = [
  { value: 'cotton', label: '棉', desc: '舒适亲肤，日常款首选' },
  { value: 'nylon', label: '尼龙', desc: '弹性强韧，运动/通勤' },
]
export const CRAFTS: MaterialOpt[] = [
  { value: 'uv', label: 'UV 印花', desc: '色彩鲜艳，纹理细腻' },
  { value: '3d', label: '3D 印花', desc: '立体浮雕感，触感丰富' },
  { value: 'jacquard', label: '针织提花', desc: '织线成花，质感传统' },
]
/** 材质单价（元/双） */
export const UNIT_PRICE: Record<string, number> = { cotton: 28, nylon: 32 }
/** 工艺加价（元/双） */
export const CRAFT_FEE: Record<string, number> = { uv: 0, '3d': 6, jacquard: 12 }

export const PAY_METHODS = [
  { value: 'wechat', label: '微信支付', tip: '推荐 · 免手续费', accent: '#1aad19' },
  { value: 'alipay', label: '支付宝', tip: '快捷支付', accent: '#1677ff' },
  { value: 'bank', label: '银行卡', tip: '储蓄卡 / 信用卡', accent: '#7e6cf2' },
]

export const SIZE_LIST = ['S', 'M', 'L', 'XL']
