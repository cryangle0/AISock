/** 设计器引擎共享类型 */

export interface SockParams {
  /** 印花缩放 % (50~300) */
  density: number
  /** 平铺密度（平铺模式下每行瓦片数基准） */
  tileDensity: number
  /** 旋转角度 0~360 */
  rotation: number
  /** true=单张居中；false=平铺 */
  singleMode: boolean
  /** 开发态：显示蒙版 */
  debugMode?: boolean
}

export interface SockColors {
  bodyHex: string | null
  weltHex: string | null
  heelHex: string | null
  toeHex: string | null
}

export interface MaskBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface BinaryMask {
  mask: Uint8Array
  count: number
  bounds: MaskBounds
}

/** 一次性加载并预处理好的袜版资源，供 sockRenderer 消费 */
export interface SockResources {
  ready: boolean
  error: string | null
  sockImage: HTMLImageElement | null
  lineart: HTMLImageElement | null
  mask: BinaryMask | null
  bodyMask: Uint8Array | null
  weltMask: Uint8Array | null
  bodyMaskCanvas: HTMLCanvasElement | null
  heelMask: Uint8Array | null
  toeMask: Uint8Array | null
  sockPixels: Uint8ClampedArray | null
  separable: boolean
  meta: { count: number; width: number; height: number }
}

export const EMPTY_RESOURCES: SockResources = {
  ready: false,
  error: null,
  sockImage: null,
  lineart: null,
  mask: null,
  bodyMask: null,
  weltMask: null,
  bodyMaskCanvas: null,
  heelMask: null,
  toeMask: null,
  sockPixels: null,
  separable: false,
  meta: { count: 0, width: 0, height: 0 },
}

export const DEFAULT_PARAMS: SockParams = {
  density: 100,
  tileDensity: 3,
  rotation: 0,
  singleMode: true,
  debugMode: false,
}

export const DEFAULT_COLORS: SockColors = {
  bodyHex: null,
  weltHex: null,
  heelHex: null,
  toeHex: null,
}
