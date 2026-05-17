/**
 * 页面注册表 —— 重构后小程序结构
 *   tab：首页 / 设计 / 我的
 *   子页：我的设计 / 订单管理 / 素材库 / 订单详情
 */
import BHome from './designer/BHome'
import BEditor from './designer/BEditor'
import BMine from './designer/BMine'
import BDesigns from './designer/BDesigns'
import BAssets from './designer/BAssets'
import BOrders from './designer/BOrders'
import BOrderDetail from './designer/BOrderDetail'

export const PAGE_COMPONENTS = {
  'b-home':         BHome,
  'b-editor':       BEditor,
  'b-mine':         BMine,
  'b-designs':      BDesigns,
  'b-assets':       BAssets,
  'b-orders':       BOrders,
  'b-order-detail': BOrderDetail,
}
