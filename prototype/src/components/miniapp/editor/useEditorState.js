/**
 * useEditorState — 编辑器状态管理 hook
 * 把所有袜版编辑相关的状态集中起来，便于 BEditor 复用 + tab 切换持久化
 *
 * 注意：这里有意将状态外置；若要在 tab 之间持久化，由调用方决定是否 lift。
 * 当前 BEditor 内部使用 useState 即可（详情页已用 portal 不会卸载父）。
 */
import { useEffect, useMemo, useState } from 'react'
import { applyPaletteMapping } from '../../print/colorMapping'
import { PALETTE_MAP } from '../../print/colorPalettes'
import { DEFAULT_SOCK_TYPE_ID } from '../../print/sockTypes'

export const DEFAULT_PARAMS = {
  density: 100, tileDensity: 3, rotation: 0, singleMode: true, debugMode: false,
}
export const DEFAULT_COLORS = {
  bodyHex: null, weltHex: null, heelHex: null, toeHex: null,
}
export const DEFAULT_PALETTE_STRENGTH = 80

export default function useEditorState() {
  const [printImage, setPrintImage] = useState(null)
  const [printName, setPrintName] = useState('')
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [colors, setColors] = useState(DEFAULT_COLORS)
  const [paletteId, setPaletteId] = useState(null)
  const [paletteStrength, setPaletteStrength] = useState(DEFAULT_PALETTE_STRENGTH)
  const [paletteResult, setPaletteResult] = useState({ key: '', url: null })
  const [sockTypeId, setSockTypeId] = useState(DEFAULT_SOCK_TYPE_ID)
  // AI 生成历史 — 与 web AssetPanel 行为一致，最多保留 24 条
  const [aiHistory, setAiHistory] = useState([])
  const addAiHistory = (item) => {
    setAiHistory((prev) => [item, ...prev].slice(0, 24))
  }

  const mappingKey = useMemo(() => {
    if (!printImage || !paletteId || paletteStrength <= 0) return ''
    return `${printImage.slice(0, 60)}|${paletteId}|${paletteStrength}`
  }, [printImage, paletteId, paletteStrength])

  useEffect(() => {
    if (!mappingKey) return undefined
    const palette = PALETTE_MAP[paletteId]
    if (!palette) return undefined
    let alive = true
    applyPaletteMapping(printImage, palette, paletteStrength / 100).then((url) => {
      if (alive) setPaletteResult({ key: mappingKey, url })
    })
    return () => { alive = false }
  }, [mappingKey, paletteId, paletteStrength, printImage])

  const finalPrintImage = useMemo(() => {
    if (!printImage) return null
    if (!mappingKey) return printImage
    if (paletteResult.key === mappingKey && paletteResult.url) return paletteResult.url
    return printImage
  }, [printImage, mappingKey, paletteResult])

  const applyImage = (url, name) => {
    setPrintImage(url || null)
    setPrintName(name || '')
  }

  const clearPrint = () => {
    applyImage(null, '')
    setPaletteId(null)
  }

  const resetParams = () => setParams(DEFAULT_PARAMS)

  const applyDerivedDesign = (design) => {
    setPrintImage(design.printImage)
    setPrintName(design.printName || '')
    setColors({ ...DEFAULT_COLORS, ...design.colors })
    setParams({ ...DEFAULT_PARAMS, ...design.params })
    setPaletteId(null)
  }

  return {
    // values
    printImage, printName, params, colors, paletteId, paletteStrength,
    finalPrintImage, aiHistory, sockTypeId,
    // setters
    setPrintImage, setPrintName, setParams, setColors,
    setPaletteId, setPaletteStrength, setSockTypeId,
    // helpers
    applyImage, clearPrint, resetParams, applyDerivedDesign, addAiHistory,
  }
}
