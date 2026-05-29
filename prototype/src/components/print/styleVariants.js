// 款式衍生（AI 图生图 mock）— 基于当前完整设计（印花 + 各部位颜色 + 调节参数）
// 生成 N 套 "换花型 + 换配色 + 微调" 的整套变体，每套都包含离屏渲染好的完整袜版预览。

import { PATTERN_LIST } from '../patternConstants'
import { patternToImageURL } from '../patternImage'
import { renderSockToDataURL } from './sockRenderer'

// 8 套精心调校的配色方案 — 每套都给出完整 4 部位色 + 风格名
const COLOR_SCHEMES = [
  { id: 'classic',   name: '经典米白',   body: '#f6f1e7', welt: '#3f6f5a', heel: '#3f6f5a', toe: '#3f6f5a' },
  { id: 'vintage',   name: '复古驼色',   body: '#c9a982', welt: '#5b4d44', heel: '#5b4d44', toe: '#5b4d44' },
  { id: 'mono',      name: '极简黑灰',   body: '#1a1c20', welt: '#9aa0a8', heel: '#9aa0a8', toe: '#9aa0a8' },
  { id: 'pastel',    name: '糖果柔粉',   body: '#f0b8c4', welt: '#a4d4b9', heel: '#a4d4b9', toe: '#a4d4b9' },
  { id: 'navy',      name: '海军学院',   body: '#2f3a52', welt: '#dfc28a', heel: '#dfc28a', toe: '#dfc28a' },
  { id: 'forest',    name: '森系松绿',   body: '#3f6f5a', welt: '#efe4cc', heel: '#a05a3c', toe: '#a05a3c' },
  { id: 'mustard',   name: '芥末暖意',   body: '#c79b54', welt: '#1a1c20', heel: '#1a1c20', toe: '#1a1c20' },
  { id: 'sky',       name: '云雾天蓝',   body: '#a8c9e3', welt: '#2f3a52', heel: '#2f3a52', toe: '#2f3a52' },
]

// 角度档位 — 不同变体微调旋转
const ROTATION_BUCKET = [0, 12, -18, 28, -30, 45, -45, 90]

// Fisher-Yates 洗牌（确定式：基于 seed） — 让结果可预测又有差异
const shuffle = (arr, seed) => {
  const a = [...arr]
  let rnd = seed || Date.now()
  for (let i = a.length - 1; i > 0; i -= 1) {
    rnd = (rnd * 9301 + 49297) % 233280
    const j = Math.floor((rnd / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 生成 N 套款式变体。
 *
 * @param {Object} baseDesign  { printName, colors, params }
 * @param {number} count       1 | 2 | 4
 * @param {Object} resources   useSockResources 返回值（必须 ready）
 * @returns {Promise<Array<{id,label,scheme,printImage,printName,colors,params,cover}>>}
 */
export async function deriveStyleVariants(baseDesign, count, resources) {
  if (!resources?.ready) return []
  const seed = Date.now() % 9999
  const patterns = shuffle(PATTERN_LIST, seed).slice(0, count)
  const schemes = shuffle(COLOR_SCHEMES, seed + 1).slice(0, count)

  const variants = await Promise.all(patterns.map(async (p, i) => {
    const scheme = schemes[i]
    const colors = {
      bodyHex: scheme.body,
      weltHex: scheme.welt,
      heelHex: scheme.heel,
      toeHex: scheme.toe,
    }
    const baseDensity = baseDesign?.params?.density ?? 100
    const density = Math.max(60, Math.min(260, Math.round(baseDensity * (0.85 + ((i * 17) % 30) / 100))))
    const params = {
      ...(baseDesign?.params || {}),
      density,
      rotation: ROTATION_BUCKET[(i + (seed % 8)) % ROTATION_BUCKET.length],
      // 偶数序号让其切换为平铺，制造款式差异
      singleMode: i % 2 === 0 ? (baseDesign?.params?.singleMode ?? true) : false,
      tileDensity: 2 + (i % 3),
    }
    const printImage = patternToImageURL(p.id, 320)
    const printName = `${p.name}·${scheme.name}`
    const cover = await renderSockToDataURL(resources, printImage, colors, params)
    return {
      id: `${p.id}-${scheme.id}-${i}`,
      label: printName,
      scheme: scheme.name,
      pattern: p.name,
      printImage,
      printName,
      colors,
      params,
      cover,
    }
  }))

  return variants
}

export const STYLE_VARIANT_COUNTS = [1, 2, 4]
