import { useEffect, useState } from 'react'

const ASSET = (name) => `${import.meta.env.BASE_URL}image-tool/${name}`

const loadImage = (src) => new Promise((resolve) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => resolve(img)
  img.onerror = () => resolve(null)
  img.src = src
})

// 二值蒙版 — 白(亮度>128)+不透明(alpha>100) 视为可印
const buildBinaryMask = (img, w, h) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  const mask = new Uint8Array(w * h)
  let count = 0
  let minX = w
  let maxX = 0
  let minY = h
  let maxY = 0
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (brightness > 128 && data[i + 3] > 100) {
      const px = i / 4
      mask[px] = 1
      count += 1
      const x = px % w
      const y = (px - x) / w
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return { mask, count, bounds: { minX, minY, maxX, maxY } }
}

// 把二值 mask 渲染成纯白 RGBA 缓存画布（供 source-in 裁剪使用）
const buildMaskCanvas = (mask, w, h) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  const imgData = ctx.createImageData(w, h)
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i] === 1) {
      const idx = i * 4
      imgData.data[idx] = 255
      imgData.data[idx + 1] = 255
      imgData.data[idx + 2] = 255
      imgData.data[idx + 3] = 255
    }
  }
  ctx.putImageData(imgData, 0, 0)
  return c
}

// 基于 sock.png 的 alpha 通道得到"整个袜版剪影"二值数组 + y 边界。
// 用于切出"袜子最顶端的螺口段"，避免依赖 mask.png（mask 通常只标袜身可印区，
// 顶部 ratio 取的是袜身顶部，不是袜子最顶端）。
const buildShapeMask = (sockPixels, w, h) => {
  const total = w * h
  const mask = new Uint8Array(total)
  let minY = h
  let maxY = 0
  for (let i = 0; i < total; i += 1) {
    if (sockPixels[i * 4 + 3] > 32) {
      mask[i] = 1
      const x = i % w
      const y = (i - x) / w
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return { mask, minY, maxY }
}

// 取 sockShape 的最顶端一段作为 weltMask（螺口）；
// 同时把 weltMask 与 mask（袜身可印区）的交集从 bodyMask 中减掉，
// 这样：印花裁剪到 bodyMask 不会盖到螺口；weltColor 单独画在 weltMask 上。
const splitWeltAndBody = (fullMask, shape, w, ratio = 0.12) => {
  const total = fullMask.length
  const splitY = Math.floor(shape.minY + (shape.maxY - shape.minY) * ratio)
  const weltMask = new Uint8Array(total)
  const bodyMask = new Uint8Array(total)
  for (let i = 0; i < total; i += 1) {
    const x = i % w
    const y = (i - x) / w
    // 螺口 = 袜版剪影 ∩ 顶部段（不限于 mask 区，可能突出到 mask 之外）
    if (shape.mask[i] === 1 && y <= splitY) weltMask[i] = 1
    // 袜身 = mask 减去(螺口在 mask 内的交集)
    if (fullMask[i] === 1 && !(shape.mask[i] === 1 && y <= splitY)) bodyMask[i] = 1
  }
  return { weltMask, bodyMask, splitY }
}

// 4 邻域 BFS 连通域 — 用 typed array 存 label，避免 JS 数组性能开销
const splitConnectedComponents = (mask, w, h) => {
  const total = w * h
  const labels = new Int16Array(total)
  const queue = new Int32Array(total)
  const comps = []
  let nextLabel = 0

  for (let start = 0; start < total; start += 1) {
    if (mask[start] !== 1 || labels[start] !== 0) continue
    nextLabel += 1
    let head = 0
    let tail = 0
    queue[tail] = start
    tail += 1
    labels[start] = nextLabel
    let area = 0
    let sumY = 0
    while (head < tail) {
      const idx = queue[head]
      head += 1
      area += 1
      const x = idx % w
      const y = (idx - x) / w
      sumY += y
      if (x > 0) {
        const ni = idx - 1
        if (mask[ni] === 1 && labels[ni] === 0) { labels[ni] = nextLabel; queue[tail] = ni; tail += 1 }
      }
      if (x < w - 1) {
        const ni = idx + 1
        if (mask[ni] === 1 && labels[ni] === 0) { labels[ni] = nextLabel; queue[tail] = ni; tail += 1 }
      }
      if (idx >= w) {
        const ni = idx - w
        if (mask[ni] === 1 && labels[ni] === 0) { labels[ni] = nextLabel; queue[tail] = ni; tail += 1 }
      }
      if (idx + w < total) {
        const ni = idx + w
        if (mask[ni] === 1 && labels[ni] === 0) { labels[ni] = nextLabel; queue[tail] = ni; tail += 1 }
      }
    }
    comps.push({ label: nextLabel, area, avgY: sumY / area })
  }
  return { labels, comps }
}

// 把 othermask 拆为 heelMask / toeMask；不可拆时回退为单整体
const buildHeelToeMasks = (otherMask, w, h) => {
  const { labels, comps } = splitConnectedComponents(otherMask, w, h)
  if (comps.length < 2) return { heelMask: otherMask, toeMask: null, separable: false }
  // 取面积最大两块 → 按 avgY 排序，y 较小（更靠上）= 袜跟，y 较大 = 袜头
  const topTwo = [...comps].sort((a, b) => b.area - a.area).slice(0, 2)
  topTwo.sort((a, b) => a.avgY - b.avgY)
  const heelLabel = topTwo[0].label
  const toeLabel = topTwo[1].label
  const total = w * h
  const heelMask = new Uint8Array(total)
  const toeMask = new Uint8Array(total)
  for (let i = 0; i < total; i += 1) {
    const lab = labels[i]
    if (lab === heelLabel) heelMask[i] = 1
    else if (lab === toeLabel) toeMask[i] = 1
  }
  return { heelMask, toeMask, separable: true }
}

/**
 * 一次性加载袜版资源并把蒙版预处理好。
 *
 * 字段说明（供 sockRenderer 消费）：
 *   - mask        — 完整袜身可印区（含螺口），含 bounds，供印花居中/缩放定位
 *   - bodyMask    — 袜身（去掉顶部螺口段），供"袜身底色 + 印花裁剪"
 *   - weltMask    — 螺口段（顶部一段），供"螺口底色"独立上色
 *   - heelMask/toeMask — 袜跟/袜头（来自 othermask 连通域拆分）
 *   - bodyMaskCanvas   — bodyMask 的 RGBA 画布缓存，给印花做 source-in 裁剪
 */
export default function useSockResources() {
  const [state, setState] = useState({
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
  })

  useEffect(() => {
    let cancelled = false
    Promise.all([
      loadImage(ASSET('sock.png')),
      loadImage(ASSET('mask.png')),
      loadImage(ASSET('othermask.png')),
      loadImage(ASSET('lineart.png')),
    ]).then(([sock, maskImg, otherMaskImg, lineart]) => {
      if (cancelled) return
      if (!sock) {
        setState((s) => ({ ...s, error: '袜版底图加载失败' }))
        return
      }
      const w = sock.width
      const h = sock.height

      const tmp = document.createElement('canvas')
      tmp.width = w
      tmp.height = h
      const tctx = tmp.getContext('2d')
      tctx.drawImage(sock, 0, 0)
      const sockPixels = tctx.getImageData(0, 0, w, h).data

      const fallbackMask = maskImg || sock
      const built = buildBinaryMask(fallbackMask, w, h)
      // 螺口段必须基于"整个袜版剪影"的最顶端来切，否则会落到袜身可印区顶部
      const shape = buildShapeMask(sockPixels, w, h)
      const { weltMask, bodyMask } = splitWeltAndBody(built.mask, shape, w, 0.12)
      const bodyMaskCanvas = buildMaskCanvas(bodyMask, w, h)

      let heelMask = null
      let toeMask = null
      let separable = false
      if (otherMaskImg) {
        const otherBuilt = buildBinaryMask(otherMaskImg, w, h)
        const split = buildHeelToeMasks(otherBuilt.mask, w, h)
        heelMask = split.heelMask
        toeMask = split.toeMask
        separable = split.separable
      }

      setState({
        ready: true,
        error: null,
        sockImage: sock,
        lineart,
        mask: built,
        bodyMask,
        weltMask,
        bodyMaskCanvas,
        heelMask,
        toeMask,
        sockPixels,
        separable,
        meta: { count: built.count, width: w, height: h },
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
