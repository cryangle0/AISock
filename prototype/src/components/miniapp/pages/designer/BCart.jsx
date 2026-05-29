/**
 * BCart —— 购物车 tab
 * 直接渲染订单管理，与原 BOrders 行为一致
 */
import BOrders from './BOrders'

export default function BCart(props) {
  return <BOrders {...props}/>
}
