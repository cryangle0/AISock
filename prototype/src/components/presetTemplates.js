/**
 * 袜版设计预设 —— 在首页展示的"案例 / 模板"，用户点击后可一键进入编辑器
 * 并应用该预设的 regions / 名称作为起点。
 *
 * web 与小程序共用，保持视觉一致。
 */

export const PRESET_TEMPLATES = [
  {
    id: 'preset-spring-girl',
    name: '经典条纹袜',
    tag: '甜美',
    desc: '碎花点缀，配条纹袜口与圆点袜头',
    regions: { welt: 'p-stripe', cuff: 'p-floral', body: 'p-floral', toe: 'p-dots' },
  },
  {
    id: 'preset-business',
    name: '简约几何袜',
    tag: '正装',
    desc: '单色主体配条纹袜头，质感稳重',
    regions: { welt: 'p-mono', cuff: 'p-mono', body: 'p-mono', toe: 'p-stripe' },
  },
  {
    id: 'preset-dream-flower',
    name: '少女心花朵袜',
    tag: '艺术',
    desc: '大花图案 + 方格袜头，张力十足',
    regions: { welt: 'p-stripe', cuff: 'p-flower-big', body: 'p-flower-big', toe: 'p-checker' },
  },
  {
    id: 'preset-ocean',
    name: '清新波点袜',
    tag: '清爽',
    desc: '蓝调小花 + 圆点袜头，海岛风',
    regions: { welt: 'p-blue', cuff: 'p-blue', body: 'p-blue', toe: 'p-dots' },
  },
  {
    id: 'preset-mint',
    name: '极简小点袜',
    tag: '日常',
    desc: '薄荷绿主调 + 条纹袜头，轻松百搭',
    regions: { welt: 'p-mint', cuff: 'p-mint', body: 'p-mint', toe: 'p-stripe' },
  },
  {
    id: 'preset-gold',
    name: '多彩混搭袜',
    tag: '高级',
    desc: '金底大花，节日 / 礼盒首选',
    regions: { welt: 'p-gold', cuff: 'p-gold', body: 'p-flower-big', toe: 'p-gold' },
  },
  {
    id: 'preset-checker-pop',
    name: '棋盘格潮袜',
    tag: '潮酷',
    desc: '黑白方格 + 条纹袜口，街头感',
    regions: { welt: 'p-stripe', cuff: 'p-checker', body: 'p-checker', toe: 'p-mono' },
  },
  {
    id: 'preset-blue-wave',
    name: '蓝调海浪袜',
    tag: '运动',
    desc: '蓝花主体 + 薄荷袜头，清凉透气',
    regions: { welt: 'p-blue', cuff: 'p-blue', body: 'p-blue', toe: 'p-mint' },
  },
  {
    id: 'preset-dot-party',
    name: '圆点派对袜',
    tag: '可爱',
    desc: '满版圆点 + 碎花袜口，少女心',
    regions: { welt: 'p-floral', cuff: 'p-dots', body: 'p-dots', toe: 'p-floral' },
  },
  {
    id: 'preset-mono-elite',
    name: '商务精英袜',
    tag: '商务',
    desc: '纯色主体 + 金色袜口，低调奢华',
    regions: { welt: 'p-gold', cuff: 'p-mono', body: 'p-mono', toe: 'p-mono' },
  },
  {
    id: 'preset-floral-garden',
    name: '花园漫步袜',
    tag: '田园',
    desc: '大花 + 碎花混搭，春日花园感',
    regions: { welt: 'p-floral', cuff: 'p-flower-big', body: 'p-flower-big', toe: 'p-floral' },
  },
  {
    id: 'preset-mint-stripe',
    name: '薄荷条纹袜',
    tag: '清新',
    desc: '薄荷绿条纹 + 圆点袜头，夏日必备',
    regions: { welt: 'p-stripe', cuff: 'p-mint', body: 'p-mint', toe: 'p-dots' },
  },
]

// 行业资讯 / 教程占位（aihuaxing 风格的资讯条）
export const INSIGHT_LIST = [
  { id: 'i-1', title: 'AI 同款延展：3 步把单款变 4 款', tag: '教程' },
  { id: 'i-2', title: '亲子袜流行趋势：成人款 + 儿童款一起出', tag: '趋势' },
  { id: 'i-3', title: '色卡映射怎么用？一键换季配色', tag: '色彩' },
]
