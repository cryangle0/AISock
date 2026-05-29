// 色卡数据 — 每个色卡 6~8 个主色，覆盖暗/中/亮三档，便于"最近色映射"。
// 设计原则：尽量留一个浅 + 一个深锚定整体明度，否则映射后会偏色块。

export const COLOR_PALETTES = [
  {
    id: 'fuchun',
    name: '富春山居',
    desc: '黄公望笔下的烟雨青绿',
    colors: ['#f0ece1', '#c8c1ad', '#909d9b', '#586477', '#3d4452', '#a05a3c', '#c5483c', '#dfc28a'],
    swatchOrder: ['#3d4452', '#586477', '#909d9b', '#c8c1ad', '#dfc28a', '#a05a3c', '#c5483c', '#f0ece1'],
  },
  {
    id: 'morandi',
    name: '莫兰迪',
    desc: '低饱和的静物美学',
    colors: ['#f3ede4', '#dad1c4', '#dab8b1', '#bcb0c0', '#9aa9b3', '#a3b3a4', '#dfc7a7', '#8a7e75'],
    swatchOrder: ['#dab8b1', '#bcb0c0', '#9aa9b3', '#a3b3a4', '#dfc7a7', '#dad1c4', '#8a7e75', '#f3ede4'],
  },
  {
    id: 'dunhuang',
    name: '敦煌·壁画',
    desc: '朱砂石青 · 矿物质感',
    colors: ['#efe6d3', '#dec38a', '#c79b54', '#a05a3c', '#5a8a7d', '#3a6fa3', '#c5483c', '#5b4d44'],
    swatchOrder: ['#c5483c', '#a05a3c', '#c79b54', '#dec38a', '#5a8a7d', '#3a6fa3', '#5b4d44', '#efe6d3'],
  },
  {
    id: 'macaron',
    name: '马卡龙',
    desc: '少女系 · 高甜糖果',
    colors: ['#fbe9d7', '#fbcbcb', '#fcd1ad', '#f8e3a3', '#bce0c2', '#bfd5e8', '#d6c8e1', '#fffdf6'],
    swatchOrder: ['#fbcbcb', '#fcd1ad', '#f8e3a3', '#bce0c2', '#bfd5e8', '#d6c8e1', '#fbe9d7', '#fffdf6'],
  },
  {
    id: 'guochao',
    name: '当代国潮',
    desc: '帝王红 + 螺青 + 月白',
    colors: ['#dde6e5', '#a07f53', '#5e9b8b', '#3c5b6e', '#2e3946', '#dc6058', '#c5482b', '#8e587c'],
    swatchOrder: ['#c5482b', '#dc6058', '#a07f53', '#5e9b8b', '#3c5b6e', '#8e587c', '#2e3946', '#dde6e5'],
  },
  {
    id: 'ocean',
    name: '海岸',
    desc: '潮汐与白沙',
    colors: ['#f5f5f0', '#cfe1ea', '#9ec4d4', '#5a91b0', '#2f6286', '#1f3c52', '#dfb98a', '#a5b9a9'],
    swatchOrder: ['#9ec4d4', '#5a91b0', '#2f6286', '#1f3c52', '#dfb98a', '#a5b9a9', '#cfe1ea', '#f5f5f0'],
  },
]

export const PALETTE_MAP = Object.fromEntries(COLOR_PALETTES.map(p => [p.id, p]))
