/**
 * 袜型几何配置 —— 按袜型（中筒/船袜/长筒/短袜）描述各自的轮廓与分区比例。
 *
 * 设计：所有坐标基于 480×640 基准画布，渲染时等比映射到实际画布。
 * 新增袜型只需在 SOCK_GEOMETRIES 增加一条配置，drawSock 自动适配，无需改渲染逻辑。
 */

/** 轮廓锚点（480×640 基准坐标） */
export interface SockGeometry {
  /** 袜口顶边 y */
  topY: number
  /** 袜筒左右边 x */
  leftX: number
  rightX: number
  /** 脚踝转折起点 y（袜筒到脚掌的过渡） */
  ankleY: number
  /** 脚掌前端（袜头）最远点 */
  toeX: number
  toeY: number
  /** 脚跟底点 */
  heelX: number
  heelY: number
  /** 螺口段底边 y（袜口罗纹高度） */
  weltBottomY: number
  /** 脚掌段起始 y（印花区下边界 / 脚掌上边界） */
  footTopY: number
  /** 袜跟占脚掌宽度比例（0~1，其余为袜头） */
  heelRatio: number
}

/** 基准画布尺寸 */
export const BASE_W = 480
export const BASE_H = 640

/**
 * 各袜型几何。比例参考真实袜型：
 * - crew 中筒：标准筒长
 * - ankle 船袜：筒极短，几乎只有脚掌
 * - tube 长筒：筒很长，脚掌占比小
 * - short 短袜：筒较短
 */
export const SOCK_GEOMETRIES: Record<string, SockGeometry> = {
  crew: {
    topY: 40, leftX: 140, rightX: 340, ankleY: 360,
    toeX: 150, toeY: 568, heelX: 210, heelY: 560,
    weltBottomY: 150, footTopY: 452, heelRatio: 0.42,
  },
  ankle: {
    // 船袜：筒极短，袜口接近脚踝，脚掌占主体
    topY: 250, leftX: 140, rightX: 340, ankleY: 360,
    toeX: 150, toeY: 568, heelX: 210, heelY: 560,
    weltBottomY: 300, footTopY: 452, heelRatio: 0.42,
  },
  tube: {
    // 长筒：筒很长，脚掌段相对压缩
    topY: 20, leftX: 150, rightX: 330, ankleY: 470,
    toeX: 160, toeY: 596, heelX: 214, heelY: 588,
    weltBottomY: 120, footTopY: 540, heelRatio: 0.42,
  },
  short: {
    // 短袜：筒较短
    topY: 160, leftX: 140, rightX: 340, ankleY: 380,
    toeX: 150, toeY: 572, heelX: 210, heelY: 564,
    weltBottomY: 240, footTopY: 468, heelRatio: 0.42,
  },
}

export const DEFAULT_GEOMETRY_ID = 'crew'

export function getSockGeometry(sockTypeId?: string | null): SockGeometry {
  return SOCK_GEOMETRIES[sockTypeId || DEFAULT_GEOMETRY_ID] || SOCK_GEOMETRIES[DEFAULT_GEOMETRY_ID]
}
