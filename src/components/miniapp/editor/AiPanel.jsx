/**
 * AiPanel —— AI 生成面板（提示词 + 参考图延申）
 *
 * 从 PrintSheet 内部抽出来的独立 view，受控状态由调用方维护：
 *   - prompt / refImage / refName / generating
 *   - onPromptChange / onPickRefFile / onPickRefMine / onClearRef
 *   - onGenerate / quota / mineAssets
 *
 * 用在 AiGenerateSheet 底部抽屉里。
 */
import { Sparkles, Image as ImageIcon, X } from 'lucide-react'
import ImageUploadButton from './ImageUploadButton'

const PRESETS = ['春日樱花', '海蓝清爽', '复古条纹', '简约几何', '金色奢华', '薄荷清新']

export default function AiPanel({
  prompt, onPromptChange,
  generating, onGenerate,
  refImage, refName,
  onPickRefFile, onPickRefMine, onClearRef,
  mineAssets = [],
  quota,
}) {
  const exhausted = quota && !quota.canUse

  return (
    <div className="mp-ai-view">
      {quota && (
        <div className={`mp-ai-quota ${exhausted ? 'exhausted' : ''} ${quota.isNewUser ? 'new-user' : ''}`}>
          <Sparkles size={11} strokeWidth={1.8}/>
          {quota.isNewUser && <span className="mp-ai-quota-tag">新用户</span>}
          <span className="mp-ai-quota-text">
            今日免费 AI 生图剩余 <b>{quota.remaining}</b> / {quota.perDay} 次
          </span>
        </div>
      )}

      <div className="mp-ai-hint">
        <Sparkles size={11} /> 提示词或图片延申
      </div>

      <div className="mp-ai-ref">
        <div className="mp-ai-ref-label">参考图（可选）</div>
        {refImage ? (
          <div className="mp-ai-ref-card">
            <img src={refImage} alt="参考"/>
            <div className="mp-ai-ref-meta">
              <div className="mp-ai-ref-name">{refName}</div>
              <div className="mp-ai-ref-tip">基于此图生成</div>
            </div>
            <button type="button" className="mp-ai-ref-clear" onClick={onClearRef}>
              <X size={10} strokeWidth={2}/>
            </button>
          </div>
        ) : (
          <div className="mp-ai-ref-empty">
            <ImageUploadButton
              onPick={onPickRefFile}
              label="拍照 / 相册"
              variant="mini"
            />
            <button
              className="mp-mini-btn"
              onClick={onPickRefMine}
              disabled={mineAssets.length === 0}
              title={mineAssets.length === 0 ? '个人库为空' : '从个人库选取'}
            >
              <ImageIcon size={10}/> 个人库选取
            </button>
          </div>
        )}
      </div>

      <textarea
        className="mp-input mp-textarea"
        placeholder={refImage ? '描述希望的延申方向（可选）' : '描述想要的花型'}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
      />

      <button
        className="mp-cta-primary"
        disabled={(!prompt.trim() && !refImage) || generating || exhausted}
        onClick={onGenerate}
      >
        <Sparkles size={12}/>
        {exhausted
          ? '今日免费次数用完'
          : generating ? '生成中…' : refImage ? '基于参考图生成' : '生成花型'}
      </button>

      {exhausted && (
        <div className="mp-ai-quota-tip">
          明天 0 点重置；分享给好友邀请注册可解锁更多生图次数
        </div>
      )}

      <div className="mp-ai-presets">
        {PRESETS.map((p) => (
          <button key={p} className="mp-mini-btn" onClick={() => onPromptChange(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
