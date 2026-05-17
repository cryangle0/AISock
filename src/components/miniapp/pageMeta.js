/**
 * pageMeta —— 小程序页面注册表
 *
 * 重构后底部 tab 简化为 3 个：首页 / 设计 / 我的
 *   - 首页：欢迎区 + 功能入口（订单/素材/我的设计）+ 袜版设计预设
 *   - 设计：袜版编辑器，含我的设计入口
 *   - 我的：账户/设计/订单/素材入口 + 退出
 *
 * 子页（订单管理 / 素材库 / 我的设计 / 订单详情）通过 nav.navigate 进入。
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
  'b-editor': {
    key: 'b-editor',
    no: '01',
    title: '设计',
    isTab: true,
    tabLabel: '设计',
    parentTab: 'b-editor',
  },
  'b-mine': {
    key: 'b-mine',
    no: '02',
    title: '我的',
    isTab: true,
    tabLabel: '我的',
    parentTab: 'b-mine',
  },
  // —— 子页（不在 tab bar） ——
  'b-designs': {
    key: 'b-designs',
    no: '01a',
    title: '我的设计',
    isTab: false,
    parentTab: 'b-mine',
  },
  'b-orders': {
    key: 'b-orders',
    no: '02a',
    title: '订单管理',
    isTab: false,
    parentTab: 'b-mine',
  },
  'b-assets': {
    key: 'b-assets',
    no: '02b',
    title: '素材库',
    isTab: false,
    parentTab: 'b-mine',
  },
  'b-order-detail': {
    key: 'b-order-detail',
    no: '02c',
    title: '订单详情',
    isTab: false,
    parentTab: 'b-mine',
  },
}

export const TAB_KEYS = ['b-home', 'b-editor', 'b-mine']

export function getTabs() {
  return TAB_KEYS.map((k) => PAGE_META[k])
}
