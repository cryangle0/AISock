/**
 * pageMeta —— 小程序页面注册表
 *
 * 底部 tab 5 个：首页 / 推荐 / AI 设计（凸起）/ 购物车 / 我的
 *   - 首页 b-home：敦煌主题主页
 *   - 推荐 b-feed：推荐内容流
 *   - AI 设计 b-editor：袜版编辑器（中间凸起）
 *   - 购物车 b-cart：购物车 / 订单（沿用 b-orders 子页）
 *   - 我的 b-mine：账户中心
 */

export const PAGE_META = {
  // —— Tab 主页 ——
  'b-home': {
    key: 'b-home',
    no: '00',
    title: '首页',
    isTab: true,
    tabLabel: '首页',
    parentTab: 'b-home',
  },
  'b-feed': {
    key: 'b-feed',
    no: '01',
    title: '推荐',
    isTab: true,
    tabLabel: '推荐',
    parentTab: 'b-feed',
  },
  'b-editor': {
    key: 'b-editor',
    no: '02',
    title: 'AI 设计',
    isTab: true,
    tabLabel: 'AI 设计',
    parentTab: 'b-editor',
  },
  'b-cart': {
    key: 'b-cart',
    no: '03',
    title: '购物车',
    isTab: true,
    tabLabel: '购物车',
    parentTab: 'b-cart',
  },
  'b-mine': {
    key: 'b-mine',
    no: '04',
    title: '我的',
    isTab: true,
    tabLabel: '我的',
    parentTab: 'b-mine',
  },
  // —— 子页（不在 tab bar） ——
  'b-designs': {
    key: 'b-designs',
    no: '04a',
    title: '我的设计',
    isTab: false,
    parentTab: 'b-mine',
  },
  'b-orders': {
    key: 'b-orders',
    no: '03a',
    title: '订单管理',
    isTab: false,
    parentTab: 'b-cart',
  },
  'b-assets': {
    key: 'b-assets',
    no: '04b',
    title: '素材库',
    isTab: false,
    parentTab: 'b-mine',
  },
  'b-order-detail': {
    key: 'b-order-detail',
    no: '03b',
    title: '订单详情',
    isTab: false,
    parentTab: 'b-cart',
  },
}

export const TAB_KEYS = ['b-home', 'b-feed', 'b-editor', 'b-cart', 'b-mine']

export function getTabs() {
  return TAB_KEYS.map((k) => PAGE_META[k])
}
