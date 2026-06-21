// 袜版导入 - Phase 1：解析 22 个袜版的 3 层 SVG → 归一化分区矢量几何
//   v1 (name.svg)   = 展示底图（取描边细节做 outline）
//   v2 (name2.svg)  = 螺口 + 脚部(跟/头) 区域（白色填充形状）
//   v3 (name3.svg)  = 袜身主区域（白色填充形状）
// 输出 tools/sock-import/out/geometry.json，供校验拼版图 / 生成 SQL 使用。
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSync } from 'svgson'
import svgpath from 'svgpath'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(__dir, '../../docs/袜板')
const OUT = path.join(__dir, 'out')
mkdirSync(OUT, { recursive: true })

const FAMILY_EN = { 直板: 'straight', 弯板: 'curved' }
const GROUP_EN = { 成人: 'adult', 大童: 'big', 小童: 'small' }

// ── 工具：解析 <style> 里的 .className{fill:...} ─────────────────
function buildClassFill(node, map = {}) {
  if (node.name === 'style' && node.children?.length) {
    const css = node.children.map((c) => c.value || '').join('')
    // 匹配「选择器列表 { 声明 }」，选择器可逗号分隔（如 .st2, .st3 { fill:#fff }）
    const re = /([^{}]+)\{([^}]*)\}/g
    let m
    while ((m = re.exec(css))) {
      const fillM = /fill\s*:\s*([^;]+)/.exec(m[2])
      if (!fillM) continue
      const fill = fillM[1].trim()
      for (const sel of m[1].split(',')) {
        const cm = /\.([\w-]+)/.exec(sel.trim())
        if (cm) (map[cm[1]] ||= {}).fill = fill
      }
    }
  }
  for (const ch of node.children || []) buildClassFill(ch, map)
  return map
}

function resolveFill(node, classMap) {
  if (node.attributes?.fill) return node.attributes.fill.trim()
  const cls = node.attributes?.class
  if (cls) for (const c of cls.split(/\s+/)) if (classMap[c]?.fill) return classMap[c].fill
  // 内联 style="fill:..."
  const st = node.attributes?.style
  if (st) { const m = /fill\s*:\s*([^;]+)/.exec(st); if (m) return m[1].trim() }
  return null
}

function hasStroke(node, classMap) {
  if (node.attributes?.stroke && node.attributes.stroke !== 'none') return true
  const cls = node.attributes?.class
  if (cls) for (const c of cls.split(/\s+/)) {
    // 类里有 stroke 定义即视为描边（简化：只要 fill 为 none 且出现在描边形状）
  }
  return false
}

function isLight(fill) {
  if (!fill || fill === 'none' || fill.startsWith('url')) return false
  const m = /^#([0-9a-f]{6})$/i.exec(fill) || /^#([0-9a-f]{3})$/i.exec(fill)
  if (!m) return false
  let hex = m[1]
  if (hex.length === 3) hex = hex.split('').map((x) => x + x).join('')
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16)
  return (r + g + b) / 3 > 220
}
function isDark(fill) {
  if (!fill || fill === 'none' || fill.startsWith('url')) return false
  const m = /^#([0-9a-f]{6})$/i.exec(fill) || /^#([0-9a-f]{3})$/i.exec(fill)
  if (!m) return false
  let hex = m[1]; if (hex.length === 3) hex = hex.split('').map((x) => x + x).join('')
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16)
  return (r + g + b) / 3 < 170
}
function isPattern(fill) {
  return !!fill && fill.startsWith('url')
}
function isMidTone(fill) {
  if (!fill || fill === 'none' || fill.startsWith('url')) return false
  const m = /^#([0-9a-f]{6})$/i.exec(fill) || /^#([0-9a-f]{3})$/i.exec(fill)
  if (!m) return false
  let hex = m[1]; if (hex.length === 3) hex = hex.split('').map((x) => x + x).join('')
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16)
  const avg = (r + g + b) / 3
  return avg >= 80 && avg <= 230
}

function isFilled(fill) {
  return !!fill && fill !== 'none'
}

// 形状 → path d 字符串（path 原样；rect/polygon 转 path；line 跳过）
function shapeToD(node) {
  const a = node.attributes || {}
  if (node.name === 'path') return a.d || null
  if (node.name === 'rect') {
    const x = +a.x || 0, y = +a.y || 0, w = +a.width || 0, h = +a.height || 0
    if (!w || !h) return null
    return `M${x},${y} h${w} v${h} h${-w} Z`
  }
  if (node.name === 'polygon' && a.points) {
    const pts = a.points.trim().split(/\s+/)
    return 'M' + pts.join(' L') + ' Z'
  }
  return null
}

function normalize(d) {
  return svgpath(d).abs().unshort().round(2).toString()
}

function bbox(dAbs) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  let cx = 0, cy = 0
  const ext = (x, y) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
  }
  // 归一化后命令为 M/L/H/V/C/Q/Z（绝对）；按命令语义跟踪当前点
  svgpath(dAbs).abs().unshort().iterate((seg) => {
    const c = seg[0]
    if (c === 'M' || c === 'L' || c === 'T') { cx = seg[1]; cy = seg[2]; ext(cx, cy) }
    else if (c === 'H') { cx = seg[1]; ext(cx, cy) }
    else if (c === 'V') { cy = seg[1]; ext(cx, cy) }
    else if (c === 'C') { ext(seg[1], seg[2]); ext(seg[3], seg[4]); cx = seg[5]; cy = seg[6]; ext(cx, cy) }
    else if (c === 'Q') { ext(seg[1], seg[2]); cx = seg[3]; cy = seg[4]; ext(cx, cy) }
  })
  return { minX, minY, maxX, maxY, cy: (minY + maxY) / 2, area: (maxX - minX) * (maxY - minY) }
}

// 收集某棵 SVG 树里所有「光色填充」形状的归一化 path（区域）
function collectRegions(root, classMap) {
  const out = []
  ;(function walk(n) {
    const d = shapeToD(n)
    if (d) {
      const fill = resolveFill(n, classMap)
      if (isLight(fill)) {
        try { const nd = normalize(d); out.push({ d: nd, bb: bbox(nd) }) } catch { /* skip bad path */ }
      }
    }
    for (const ch of n.children || []) walk(ch)
  })(root)
  return out
}

function collectFilledShapes(root, classMap) {
  const out = []
  ;(function walk(n) {
    const d = shapeToD(n)
    if (d) {
      const fill = resolveFill(n, classMap)
      if (isFilled(fill)) {
        try { const nd = normalize(d); out.push({ d: nd, fill, bb: bbox(nd) }) } catch { /* skip bad path */ }
      }
    }
    for (const ch of n.children || []) walk(ch)
  })(root)
  return out
}

function translateD(d, dx, dy) {
  if (!dx && !dy) return d
  return svgpath(d).translate(dx, dy).round(2).toString()
}

function translateShape(shape, dx, dy) {
  if (!dx && !dy) return shape
  const d = translateD(shape.d, dx, dy)
  return { d, bb: bbox(d) }
}

function unionBox(shapes) {
  return shapes.reduce(
    (a, s) => a
      ? [Math.min(a[0], s.bb.minX), Math.min(a[1], s.bb.minY), Math.max(a[2], s.bb.maxX), Math.max(a[3], s.bb.maxY)]
      : [s.bb.minX, s.bb.minY, s.bb.maxX, s.bb.maxY],
    null,
  )
}

function boxArea(bb) {
  return Math.max(0, bb.maxX - bb.minX) * Math.max(0, bb.maxY - bb.minY)
}

function findSilhouette(root, classMap, viewBox) {
  const [vw, vh] = viewBox
  return collectFilledShapes(root, classMap)
    .filter((s) => isLight(s.fill) && boxArea(s.bb) < vw * vh * 0.75)
    .sort((a, b) => boxArea(b.bb) - boxArea(a.bb))[0] || null
}

function collectSingleSvgRegions(root, classMap, viewBox) {
  const silhouette = findSilhouette(root, classMap, viewBox)
  if (!silhouette) return null
  const [vw, vh] = viewBox
  const bodyH = silhouette.bb.maxY - silhouette.bb.minY
  const topLimit = silhouette.bb.minY + bodyH * 0.35
  const minArea = vw * vh * 0.0003

  const shapes = collectFilledShapes(root, classMap)
    .filter((s) => s.d !== silhouette.d && boxArea(s.bb) > minArea)

  const weltShapes = shapes
    .filter((s) => {
      const nearTop = s.bb.minY <= topLimit
      return nearTop && (isPattern(s.fill) || isMidTone(s.fill))
    })
    .sort((a, b) => boxArea(b.bb) - boxArea(a.bb))
    .slice(0, 1)

  const weltSet = new Set(weltShapes.map((s) => s.d))
  const foot = shapes
    .filter((s) => !weltSet.has(s.d) && isLight(s.fill))
    .map((s) => s.d)

  const welt = weltShapes
    .map((s) => s.d)

  return { body: [silhouette.d], welt, foot, bodyBox: [silhouette.bb.minX, silhouette.bb.minY, silhouette.bb.maxX, silhouette.bb.maxY] }
}

function matchGuideOffset(root, classMap, targets, viewBox, silhouette) {
  targets = targets.filter(Boolean)
  if (!targets.length) return { dx: 0, dy: 0 }
  const [vw, vh] = viewBox

  const candidates = collectFilledShapes(root, classMap)
    .filter((s) => {
      const area = boxArea(s.bb)
      if (area <= 1 || area > vw * vh * 0.75) return false
      if (silhouette && s.d === silhouette.d) return false
      if (!isLight(s.fill)) return false
      const w = s.bb.maxX - s.bb.minX
      const h = s.bb.maxY - s.bb.minY
      return w > 2 && h > 2
    })

  const pairs = []
  for (const target of targets) {
    const targetW = target.maxX - target.minX
    const targetH = target.maxY - target.minY
    if (targetW <= 0 || targetH <= 0) continue
    for (const shape of candidates) {
      const w = shape.bb.maxX - shape.bb.minX
      const h = shape.bb.maxY - shape.bb.minY
      const sizeScore = Math.abs(Math.log(w / targetW)) + Math.abs(Math.log(h / targetH))
      const posScore = (Math.abs((shape.bb.minX + shape.bb.maxX - target.minX - target.maxX) / 2) + Math.abs((shape.bb.minY + shape.bb.maxY - target.minY - target.maxY) / 2)) / 1200
      pairs.push({ shape, target, score: sizeScore * 5 + posScore })
    }
  }

  const best = pairs.sort((a, b) => a.score - b.score)[0]
  if (!best || best.score > 2.8) return { dx: 0, dy: 0 }
  return {
    dx: best.shape.bb.minX - best.target.minX,
    dy: best.shape.bb.minY - best.target.minY,
  }
}

function matchWeltOffset(root, classMap, target, viewBox) {
  if (!target) return { dx: 0, dy: 0 }
  const [vw, vh] = viewBox
  const targetW = target.maxX - target.minX
  const targetH = target.maxY - target.minY
  if (targetW <= 0 || targetH <= 0) return { dx: 0, dy: 0 }

  const candidates = collectFilledShapes(root, classMap)
    .filter((s) => {
      const area = boxArea(s.bb)
      if (area <= 1 || area > vw * vh * 0.3) return false
      if (!isPattern(s.fill) && !isMidTone(s.fill)) return false
      const w = s.bb.maxX - s.bb.minX
      const h = s.bb.maxY - s.bb.minY
      return w > h * 1.4
    })
    .map((shape) => {
      const w = shape.bb.maxX - shape.bb.minX
      const h = shape.bb.maxY - shape.bb.minY
      const sizeScore = Math.abs(Math.log(w / targetW)) + Math.abs(Math.log(h / targetH))
      const posScore = (Math.abs((shape.bb.minX + shape.bb.maxX - target.minX - target.maxX) / 2) + Math.abs((shape.bb.minY + shape.bb.maxY - target.minY - target.maxY) / 2)) / 1200
      return { shape, score: sizeScore * 5 + posScore }
    })
    .sort((a, b) => a.score - b.score)

  const best = candidates[0]
  if (!best || best.score > 2.8) return { dx: 0, dy: 0 }
  return {
    dx: best.shape.bb.minX - target.minX,
    dy: best.shape.bb.minY - target.minY,
  }
}

// 收集 v1 里的描边细节（fill:none 的 path），作为 outline
function collectOutline(root, classMap) {
  const out = []
  ;(function walk(n) {
    if (n.name === 'path' && n.attributes?.d) {
      const fill = resolveFill(n, classMap)
      if (fill === 'none') {
        try { out.push(normalize(n.attributes.d)) } catch { /* skip */ }
      }
    }
    for (const ch of n.children || []) walk(ch)
  })(root)
  return out
}

function getViewBox(root) {
  const vb = root.attributes?.viewBox
  if (vb) { const p = vb.trim().split(/[\s,]+/).map(Number); return [p[2], p[3]] }
  return [+root.attributes?.width || 647.12, +root.attributes?.height || 840.99]
}

function parseName(baseName) {
  // e.g. 成人男女160mm / 成人男女70-90mm / 大童男女130-100mm
  const group = ['成人', '大童', '小童'].find((g) => baseName.startsWith(g)) || '成人'
  const sizeM = baseName.match(/([\d-]+)mm/)
  const sizeLabel = sizeM ? sizeM[1] + 'mm' : baseName
  const nums = (sizeM ? sizeM[1] : '').split('-').map(Number).filter((n) => !isNaN(n))
  const primary = nums.length ? Math.max(...nums) : null
  return { group, sizeLabel, primary }
}

// ── 主流程 ───────────────────────────────────────────────────────
const socks = []
for (const family of ['直板', '弯板']) {
  const dir = path.join(SRC, family)
  const bases = [...new Set(readdirSync(dir).filter((f) => f.endsWith('.svg')).map((f) => f.replace(/[23]?\.svg$/, '')))]
  for (const base of bases.sort()) {
    const read = (suffix) => parseSync(readFileSync(path.join(dir, `${base}${suffix}.svg`), 'utf8'))
    const v1 = read(''), v2 = read('2'), v3 = read('3')
    const cm1 = buildClassFill(v1), cm2 = buildClassFill(v2), cm3 = buildClassFill(v3)
    const viewBox = getViewBox(v3)

    const bodyShapes = collectRegions(v3, cm3)
    const regionShapes = collectRegions(v2, cm2)
    const outline = collectOutline(v1, cm1)
    const silhouette = findSilhouette(v1, cm1, viewBox)

    let offset = { dx: 0, dy: 0 }
    let body, welt, foot, bodyBox
    const { group, sizeLabel, primary } = parseName(base)
    const isShortStraight = family === '直板' && sizeLabel.includes('-')
    const singleSvg = (family === '弯板' || isShortStraight) ? collectSingleSvgRegions(v1, cm1, viewBox) : null
    if (singleSvg) {
      ;({ body, welt, foot, bodyBox } = singleSvg)
    } else {
      // v2 区域分类：最顶部(minY 最小)的为螺口，其余为脚部(跟/头)
      regionShapes.sort((a, b) => a.bb.minY - b.bb.minY)
      if (family === '直板') {
        offset = matchWeltOffset(v1, cm1, regionShapes[0]?.bb, viewBox)
      } else {
        const alignTargets = regionShapes.length > 1 ? regionShapes.slice(1).map((r) => r.bb) : regionShapes.map((r) => r.bb)
        offset = matchGuideOffset(v1, cm1, alignTargets, viewBox, silhouette)
      }
      const alignedRegions = regionShapes.map((r) => translateShape(r, offset.dx, offset.dy))
      welt = alignedRegions.length ? [alignedRegions[0].d] : []
      foot = alignedRegions.slice(1).map((r) => r.d)
      body = silhouette ? [silhouette.d] : bodyShapes.map((b) => b.d)
      // body 区域并集包围盒 [minX,minY,maxX,maxY]（供印花居中/缩放，避免端上解析路径）
      bodyBox = unionBox(bodyShapes)
    }

    const code = `${FAMILY_EN[family]}-${GROUP_EN[group]}-${(sizeLabel.replace('mm', ''))}`
    socks.push({
      code,
      family,
      group,
      name: `${family}·${group}${sizeLabel}`,
      sizeLabel,
      phys_height_mm: primary,
      viewBox,
      geometry: { viewBox, bodyBox, body, welt, foot, outline },
      _align: { dx: +offset.dx.toFixed(2), dy: +offset.dy.toFixed(2), silhouette: !!silhouette },
      _counts: { body: body.length, welt: welt.length, foot: foot.length, outline: outline.length },
    })
  }
}

writeFileSync(path.join(OUT, 'geometry.json'), JSON.stringify(socks, null, 1))
writeFileSync(path.join(OUT, 'geometry.js'), 'window.SOCKS=' + JSON.stringify(socks))
console.log(`解析完成：${socks.length} 个袜版`)
console.log('code'.padEnd(26), 'body welt foot outline  viewBox')
for (const s of socks) {
  const c = s._counts
  console.log(s.code.padEnd(26), String(c.body).padStart(4), String(c.welt).padStart(4), String(c.foot).padStart(4), String(c.outline).padStart(6), '  ', s.viewBox.map((n) => Math.round(n)).join('×'))
}
// 异常告警
const bad = socks.filter((s) => s._counts.body === 0 || s._counts.welt === 0)
if (bad.length) console.log('\n⚠ 缺少 body/welt 的袜版：', bad.map((s) => s.code).join(', '))
