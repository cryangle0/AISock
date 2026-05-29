/**
 * AiGenerateSheet —— 由 dock 上的 AI 主按钮拉起的底部抽屉
 *
 * 内含完整 AI 生成流程：
 *   - 配额徽章
 *   - 提示词 / 参考图选择
 *   - 生成按钮 + 预设
 *   - 生成完毕后自动应用到画布并关闭抽屉
 *
 * 状态由 BEditor 提供，避免在抽屉关闭后丢失正在输入的提示词。
 */
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import BottomSheet from './BottomSheet'
import AiPanel from './AiPanel'
import { aiGenerateImage } from '../../patternImage'

export default function AiGenerateSheet({
  onClose,
  onApplyImage,
  onHistoryAdd,
  userAssets,
  quota,
}) {
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [refImage, setRefImage] = useState(null)
  const [refName, setRefName] = useState('')
  const [showMinePicker, setShowMinePicker] = useState(false)

  const fileToDataURL = (file) => new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = (e) => resolve(e.target.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })

  const handlePickRef = async (file) => {
    if (!file?.type?.startsWith('image/')) return
    const url = await fileToDataURL(file)
    setRefImage(url)
    setRefName(file.name?.replace(/\.[^/.]+$/, '') || '参考图')
  }

  const handleGenerate = async () => {
    if (!prompt.trim() && !refImage) return
    if (generating) return
    if (quota && !quota.canUse) return

    setGenerating(true)
    const result = await aiGenerateImage(prompt)
    const promptLabel = refImage ? `${prompt.trim()} · 延申` : prompt.trim()
    const item = {
      id: Date.now(),
      prompt: promptLabel,
      basePid: result.basePid,
      url: result.url,
      refUrl: refImage,
    }
    onHistoryAdd?.(item)
    onApplyImage?.(item.url, item.prompt)
    quota?.consume?.()
    setGenerating(false)
    onClose?.()
  }

  return (
    <>
      <BottomSheet
        title={
          <span className="mp-pay-title-row">
            <Sparkles size={13}/> AI 生成
          </span>
        }
        subtitle="用提示词或参考图，让 AI 帮你创作专属花型"
        onClose={generating ? undefined : onClose}
        closable={!generating}
        size="tall"
      >
        <AiPanel
          prompt={prompt}
          onPromptChange={setPrompt}
          generating={generating}
          onGenerate={handleGenerate}
          refImage={refImage}
          refName={refName}
          onPickRefFile={handlePickRef}
          onPickRefMine={() => setShowMinePicker(true)}
          onClearRef={() => { setRefImage(null); setRefName('') }}
          mineAssets={userAssets || []}
          quota={quota}
        />
      </BottomSheet>

      {showMinePicker && (
        <MinePicker
          items={userAssets || []}
          onPick={(asset) => {
            setRefImage(asset.url)
            setRefName(asset.name)
            setShowMinePicker(false)
          }}
          onClose={() => setShowMinePicker(false)}
        />
      )}
    </>
  )
}

function MinePicker({ items, onPick, onClose }) {
  return (
    <BottomSheet
      title="从个人库选取参考图"
      onClose={onClose}
      size="tall"
    >
      {items.length === 0 ? (
        <div className="mp-empty-state">
          <p>个人库为空，先到 印花 → 我的 上传</p>
        </div>
      ) : (
        <div className="mp-mine-grid">
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              className="mp-mine-tile"
              onClick={() => onPick(m)}
            >
              <img src={m.url} alt={m.name} className="mp-mine-tile-img"/>
              <span className="mp-mine-tile-name">{m.name}</span>
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  )
}
