import { useEffect, useState } from 'react'
import { resolveAssetKey } from './sockTypes'

const ASSET = (assetKey, name) => {
  // assetKey === 'default' 时回退到原路径，新袜型可以放到 image-tool/<assetKey>/<name>
  const prefix = assetKey === 'default'
    ? `${import.meta.env.BASE_URL}image-tool/`
    : `${import.meta.env.BASE_URL}image-tool/${assetKey}/`
  return `${prefix}${name}`
}

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

// 基于 lineart.png 的螺口竖纹位置定位真正的袜口区域。
// 这是最稳定的：竖纹本身就画在袜版最顶端，不受 sock.png 白底或 mask.png 可印区影响。
const buildWeltMaskFromLineart = (lineartImg, w, h, fallbackBounds) => {
  const total = w * h
  const mask = new Uint8Array(total)
  if (!lineartImg) return null

  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  ctx.drawImage(lineartImg, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  const rowCounts = new Uint16Array(h)
  const maskWidth = fallbackBounds.maxX - fallbackBounds.minX
  const searchTop = Math.max(0, fallbackBounds.minY - Math.round(maskWidth * 0.36))
  const searchBottom = Math.min(h - 1, fallbackBounds.minY + Math.round(maskWidth * 0.32))
  const searchLeft = Math.max(0, fallbackBounds.minX - Math.round(maskWidth * 0.08))
  const searchRight = Math.min(w - 1, fallbackBounds.maxX + Math.round(maskWidth * 0.08))

  for (let y = searchTop; y <= searchBottom; y += 1) {
    let count = 0
    for (let x = searchLeft; x <= searchRight; x += 1) {
      const idx = (y * w + x) * 4
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      // 竖纹有浅灰和白两种层次，阈值不能太高，否则高度会截短。
      if (data[idx + 3] > 20 && brightness > 35) count += 1
    }
    rowCounts[y] = count
  }

  // 找到 mask 顶边附近第一个连续的竖纹行块。只在 search window 内找，
  // 避免脚部线稿或其他高亮点干扰。
  const minRowPixels = Math.max(8, Math.floor(maskWidth * 0.035))
  let top = -1
  let bottom = -1
  let gap = 0
  for (let y = searchTop; y <= searchBottom; y += 1) {
    if (rowCounts[y] >= minRowPixels) {
      if (top < 0) top = y
      bottom = y
      gap = 0
    } else if (top >= 0) {
      gap += 1
      if (gap > 3) break
    }
  }
  if (top < 0 || bottom < 0) return null

  let left = w
  let right = 0
  for (let y = top; y <= bottom; y += 1) {
    for (let x = searchLeft; x <= searchRight; x += 1) {
      const idx = (y * w + x) * 4
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      if (data[idx + 3] > 20 && brightness > 35) {
        if (x < left) left = x
        if (x > right) right = x
      }
    }
  }

  // 竖纹只覆盖螺口内部线条，向下扩一点形成可上色的完整螺口区域。
  const padX = 5
  const padTop = 2
  const padBottom = Math.round((right - left) * 0.035)
  left = Math.max(0, left - padX)
  right = Math.min(w - 1, right + padX)
  top = Math.max(0, top - padTop)
  bottom = Math.min(h - 1, bottom + padBottom)

  const radius = Math.max(8, Math.round((right - left) * 0.05))
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      let include = true
      if (y < top + radius && x < left + radius) {
        const dx = left + radius - x
        const dy = top + radius - y
        include = dx * dx + dy * dy <= radius * radius
      } else if (y < top + radius && x > right - radius) {
        const dx = x - (right - radius)
        const dy = top + radius - y
        include = dx * dx + dy * dy <= radius * radius
      }
      if (include) mask[y * w + x] = 1
    }
  }
  return mask
}

// bodyMask = 可印区 fullMask 去掉 weltMask 与 fullMask 的交集；
// weltMask 用 lineart 定位，表示真正的袜版顶端螺口。
const splitWeltAndBody = (fullMask, weltMask) => {
  const total = fullMask.length
  const bodyMask = new Uint8Array(total)
  for (let i = 0; i < total; i += 1) {
    if (fullMask[i] === 1 && (!weltMask || weltMask[i] !== 1)) bodyMask[i] = 1
  }
  return bodyMask
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
export default function useSockResources(sockTypeId = 'crew') {
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
    const assetKey = resolveAssetKey(sockTypeId)
    Promise.all([
      loadImage(ASSET(assetKey, 'sock.png')),
      loadImage(ASSET(assetKey, 'mask.png')),
      loadImage(ASSET(assetKey, 'othermask.png')),
      loadImage(ASSET(assetKey, 'lineart.png')),
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
      // 螺口段直接用 lineart 里的顶部竖纹定位，这是袜版视觉上的真实顶端
      const weltMask = buildWeltMaskFromLineart(lineart, w, h, built.bounds)
      const bodyMask = splitWeltAndBody(built.mask, weltMask)
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
  }, [sockTypeId])

  return state
}
