/**
 * 小程序款式衍生 / 亲子袜 — 生成"完整设计"变体（印花花型 + 四区颜色 + 调节参数），
 * 并用离屏 canvas 渲染出预览图。应用时可一次性回填，行为与 web/原型一致。
 */
import { PATTERN_LIST } from '@aisock/common'
import { drawSock, type SockColors, type SockParams } from './sockShape'
import { drawPatternTexture } from './patternDraw'

export interface MiniVariant {
  id: string
  pattern: string
  scheme: string
  patternId: string
  colors: SockColors
  params: SockParams
  cover: string
  tag?: string
}

interface BaseDesign {
  printName?: string
  patternId?: string | null
  colors?: Partial<SockColors>
  params?: Partial<SockParams>
}

const COLOR_SCHEMES = [
  { id: 'classic', name: '经典米白', body: '#f6f1e7', welt: '#3f6f5a', heel: '#3f6f5a', toe: '#3f6f5a' },
  { id: 'vintage', name: '复古驼色', body: '#c9a982', welt: '#5b4d44', heel: '#5b4d44', toe: '#5b4d44' },
  { id: 'mono', name: '极简黑灰', body: '#1a1c20', welt: '#9aa0a8', heel: '#9aa0a8', toe: '#9aa0a8' },
  { id: 'pastel', name: '糖果柔粉', body: '#f0b8c4', welt: '#a4d4b9', heel: '#a4d4b9', toe: '#a4d4b9' },
  { id: 'navy', name: '海军学院', body: '#2f3a52', welt: '#dfc28a', heel: '#dfc28a', toe: '#dfc28a' },
  { id: 'forest', name: '森系松绿', body: '#3f6f5a', welt: '#efe4cc', heel: '#a05a3c', toe: '#a05a3c' },
]
const ROTATION_BUCKET = [0, 12, -18, 28, -30, 45]

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let rnd = seed || Date.now()
  for (let i = a.length - 1; i > 0; i -= 1) {
    rnd = (rnd * 9301 + 49297) % 233280
    const j = Math.floor((rnd / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const W = 150
const H = 200

/** 渲染单个变体的预览图（离屏 canvas → 临时文件路径） */
function renderCover(patternId: string, colors: SockColors, params: SockParams): Promise<string> {
  return new Promise((resolve) => {
    try {
      const off = (uni as any).createOffscreenCanvas?.({ type: '2d', width: W * 2, height: H * 2 })
      if (!off) return resolve('')
      const ctx = off.getContext('2d')
      ctx.scale(2, 2)
      // 内置花型纹理
      const pat = (uni as any).createOffscreenCanvas?.({ type: '2d', width: 200, height: 200 })
      let img: any = null
      if (pat) {
        const pctx = pat.getContext('2d')
        drawPatternTexture(pat, pctx, 200, patternId)
        img = pat
      }
      drawSock(ctx, W, H, colors, params, img)
      ;(uni.canvasToTempFilePath as any)({
        canvas: off,
        success: (r: any) => resolve(r.tempFilePath || ''),
        fail: () => resolve(''),
      })
    } catch {
      resolve('')
    }
  })
}

export async function deriveVariants(base: BaseDesign, count: number): Promise<MiniVariant[]> {
  const seed = Date.now() % 9999
  const patterns = shuffle(PATTERN_LIST, seed).slice(0, count)
  const schemes = shuffle(COLOR_SCHEMES, seed + 1).slice(0, count)

  const out: MiniVariant[] = []
  for (let i = 0; i < patterns.length; i += 1) {
    const p = patterns[i]
    const s = schemes[i]
    const colors: SockColors = { bodyHex: s.body, weltHex: s.welt, heelHex: s.heel, toeHex: s.toe }
    const params: SockParams = {
      density: 100,
      rotation: ROTATION_BUCKET[(i + (seed % 6)) % ROTATION_BUCKET.length],
      singleMode: i % 2 === 0,
      tileDensity: 2 + (i % 3),
    }
    const cover = await renderCover(p.id, colors, params)
    out.push({
      id: `${p.id}-${s.id}-${i}`,
      pattern: `${p.name}·${s.name}`,
      scheme: s.name,
      patternId: p.id,
      colors,
      params,
      cover,
    })
  }
  return out
}

export async function deriveFamily(base: BaseDesign): Promise<MiniVariant[]> {
  const patternId = base.patternId || 'p-flower-big'
  const adultColors: SockColors = {
    bodyHex: base.colors?.bodyHex ?? '#2f3a52',
    weltHex: base.colors?.weltHex ?? '#dfc28a',
    heelHex: base.colors?.heelHex ?? '#dfc28a',
    toeHex: base.colors?.toeHex ?? '#dfc28a',
  }
  const kidColors: SockColors = { bodyHex: '#f0b8c4', weltHex: '#a4d4b9', heelHex: '#a4d4b9', toeHex: '#a4d4b9' }
  const adultParams: SockParams = { density: 100, rotation: 0, singleMode: true, tileDensity: 3 }
  const kidParams: SockParams = { density: 80, rotation: 0, singleMode: false, tileDensity: 4 }
  const name = base.printName || '亲子款'

  const [adultCover, kidCover] = await Promise.all([
    renderCover(patternId, adultColors, adultParams),
    renderCover(patternId, kidColors, kidParams),
  ])
  return [
    { id: 'adult', pattern: `${name} 成人款`, scheme: '成人款', patternId, colors: adultColors, params: adultParams, cover: adultCover, tag: 'adult' },
    { id: 'kid', pattern: `${name} 儿童款`, scheme: '儿童款', patternId, colors: kidColors, params: kidParams, cover: kidCover, tag: 'kid' },
  ]
}
