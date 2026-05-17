/**
 * 袜版设计预设 —— 在首页展示的"案例 / 模板"，用户点击后可一键进入编辑器
 * 并应用该预设的 regions / 名称作为起点。
 *
 * web 与小程序共用，保持视觉一致。
 */

export const PRESET_TEMPLATES = [
  {
    id: 'preset-spring-girl',
    name: '春日少女款',
    tag: '甜美',
    desc: '碎花点缀，配条纹袜口与圆点袜头',
    regions: { welt: 'p-stripe', cuff: 'p-floral', body: 'p-floral', toe: 'p-dots' },
  },
  {
    id: 'preset-business',
    name: '商务通勤款',
    tag: '正装',
    desc: '单色主体配条纹袜头，质感稳重',
    regions: { welt: 'p-mono', cuff: 'p-mono', body: 'p-mono', toe: 'p-stripe' },
  },
  {
    id: 'preset-dream-flower',
    name: '梦幻大花款',
    tag: '艺术',
    desc: '大花图案 + 方格袜头，张力十足',
    regions: { welt: 'p-stripe', cuff: 'p-flower-big', body: 'p-flower-big', toe: 'p-checker' },
  },
  {
    id: 'preset-ocean',
    name: '海蓝度假款',
    tag: '清爽',
    desc: '蓝调小花 + 圆点袜头，海岛风',
    regions: { welt: 'p-blue', cuff: 'p-blue', body: 'p-blue', toe: 'p-dots' },
  },
  {
    id: 'preset-mint',
    name: '薄荷清新款',
    tag: '日常',
    desc: '薄荷绿主调 + 条纹袜头，轻松百搭',
    regions: { welt: 'p-mint', cuff: 'p-mint', body: 'p-mint', toe: 'p-stripe' },
  },
  {
    id: 'preset-gold',
    name: '金色奢华款',
    tag: '高级',
    desc: '金底大花，节日 / 礼盒首选',
    regions: { welt: 'p-gold', cuff: 'p-gold', body: 'p-flower-big', toe: 'p-gold' },
  },
]

// 行业资讯 / 教程占位（aihuaxing 风格的资讯条）
export const INSIGHT_LIST = [
  { id: 'i-1', title: 'AI 同款延展：3 步把单款变 4 款', tag: '教程' },
  { id: 'i-2', title: '亲子袜流行趋势：成人款 + 儿童款一起出', tag: '趋势' },
  { id: 'i-3', title: '色卡映射怎么用？一键换季配色', tag: '色彩' },
]
