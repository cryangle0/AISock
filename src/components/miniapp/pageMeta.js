/**
 * pageMeta — 严格对齐 web 端 4 个 tab：
 *   设计 / 我的设计 / 订单管理 / 素材库
 *
 * 小程序原型不再有"消费者商城"，改为完全复刻 web 端的设计师工作流。
 */

export const PAGE_META = {
  'b-editor': {
    key: 'b-editor',
    no: '01',
    title: '设计',
    isTab: true,
    tabLabel: '设计',
    parentTab: 'b-editor',
  },
  'b-designs': {
    key: 'b-designs',
    no: '02',
    title: '我的设计',
    isTab: true,
    tabLabel: '我的设计',
    parentTab: 'b-designs',
  },
  'b-orders': {
    key: 'b-orders',
    no: '03',
    title: '订单管理',
    isTab: true,
    tabLabel: '订单',
    parentTab: 'b-orders',
  },
  'b-assets': {
    key: 'b-assets',
    no: '04',
    title: '素材库',
    isTab: true,
    tabLabel: '素材库',
    parentTab: 'b-assets',
  },
  // 非 tab 子页：订单详情
  'b-order-detail': {
    key: 'b-order-detail',
    no: '03a',
    title: '订单详情',
    isTab: false,
    parentTab: 'b-orders',
  },
}

export const TAB_KEYS = ['b-editor', 'b-designs', 'b-orders', 'b-assets']

export function getTabs() {
  return TAB_KEYS.map((k) => PAGE_META[k])
}
