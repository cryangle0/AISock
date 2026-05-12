/**
 * 页面注册表 — 将 pageKey 映射到具体组件
 * 扩展新页面：在对应目录添加组件，再在此处注册
 */
import CHome from './consumer/CHome'
import CCategory from './consumer/CCategory'
import CDetail from './consumer/CDetail'
import CCustomize from './consumer/CCustomize'
import CCart from './consumer/CCart'
import COrder from './consumer/COrder'
import CPaySuccess from './consumer/CPaySuccess'
import CMine from './consumer/CMine'
import COrderDetail from './consumer/COrderDetail'
import CMyOrders from './consumer/CMyOrders'
import CFavorites from './consumer/CFavorites'
import CAddresses from './consumer/CAddresses'
import CCoupons from './consumer/CCoupons'
import CSupport from './consumer/CSupport'
import CSettings from './consumer/CSettings'

import BWorkspace from './designer/BWorkspace'
import BEditor from './designer/BEditor'
import BAiExtend from './designer/BAiExtend'
import BFamily from './designer/BFamily'
import BAssets from './designer/BAssets'
import BDesigns from './designer/BDesigns'
import BSubmit from './designer/BSubmit'
import BOrders from './designer/BOrders'
import BOrderDetail from './designer/BOrderDetail'

export const PAGE_COMPONENTS = {
  'c-home': CHome,
  'c-category': CCategory,
  'c-detail': CDetail,
  'c-customize': CCustomize,
  'c-cart': CCart,
  'c-order': COrder,
  'c-pay-success': CPaySuccess,
  'c-mine': CMine,
  'c-order-detail': COrderDetail,
  'c-my-orders': CMyOrders,
  'c-favorites': CFavorites,
  'c-addresses': CAddresses,
  'c-coupons': CCoupons,
  'c-support': CSupport,
  'c-settings': CSettings,

  'b-workspace': BWorkspace,
  'b-editor': BEditor,
  'b-ai-extend': BAiExtend,
  'b-family': BFamily,
  'b-assets': BAssets,
  'b-designs': BDesigns,
  'b-submit': BSubmit,
  'b-orders': BOrders,
  'b-order-detail': BOrderDetail,
}
