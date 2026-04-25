import './SockCanvas.css'
import { PatternDefs } from './patterns'
import { REGION_LABELS } from './patternConstants'

// 把袜版"展开"成正面剪影 — 上 welt(袜口)、cuff(螺口)，中 body(主体含袜跟)，前端 toe(袜头)
// 用绝对坐标 SVG path 描绘四个区域，每个区域可以独立点选 + 独立填花型。
export default function SockCanvas({ regions, activeRegion, onSelectRegion, params }) {
  const fillFor = (id) => `url(#${id})`

  // 旋转 + 密度 + 间距 通过 patternTransform 实现 — 这里只做视觉提示，
  // 真正的 SVG patternTransform 需要属性级 prop，暂保留计算供未来接入。
  // (当前花型 transform 仅用于反映参数变化的视觉感觉)
  void params

  return (
    <div className="sock-canvas">
      <div className="canvas-header">
        <span className="canvas-label">袜版预览</span>
        <span className="canvas-tag">点击区域切换填花</span>
      </div>

      <div className="canvas-stage">
        <svg viewBox="0 0 480 640" className="sock-svg" xmlns="http://www.w3.org/2000/svg">
          <PatternDefs/>

          <defs>
            <clipPath id="clip-welt"><rect x="100" y="60" width="280" height="44" rx="22"/></clipPath>
            <clipPath id="clip-cuff"><rect x="100" y="104" width="280" height="56"/></clipPath>
            <clipPath id="clip-body">
              <path d="M100 160 L380 160 L380 380 Q380 420 360 442 L228 574 Q210 592 188 592 L120 592 Q100 592 100 572 Z"/>
            </clipPath>
            <clipPath id="clip-toe">
              <path d="M100 572 Q100 592 120 592 L188 592 Q210 592 228 574 L268 534 Q280 522 280 506 L280 492 Q280 478 266 478 L130 478 Q100 478 100 506 Z"/>
            </clipPath>
            <filter id="canvas-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.12"/>
            </filter>
          </defs>

          {/* 袜版整体浅灰底 */}
          <g filter="url(#canvas-shadow)">
            <rect x="100" y="60" width="280" height="44" rx="22" fill="#f4f5f7" stroke="rgba(16,18,24,0.08)"/>
            <path
              d="M100 60 L380 60 L380 380 Q380 420 360 442 L228 574 Q210 592 188 592 L120 592 Q100 592 100 572 Z"
              fill="#fafbfc"
              stroke="rgba(16,18,24,0.08)"
            />
          </g>

          {/* 袜口 welt */}
          <g
            className={`region region-welt ${activeRegion === 'welt' ? 'active' : ''}`}
            onClick={() => onSelectRegion('welt')}
            clipPath="url(#clip-welt)"
          >
            <rect x="100" y="60" width="280" height="44" fill={fillFor(regions.welt)}/>
          </g>

          {/* 螺口 cuff */}
          <g
            className={`region region-cuff ${activeRegion === 'cuff' ? 'active' : ''}`}
            onClick={() => onSelectRegion('cuff')}
            clipPath="url(#clip-cuff)"
          >
            <rect x="100" y="104" width="280" height="56" fill={fillFor(regions.cuff)}/>
          </g>

          {/* 主体（含袜跟） */}
          <g
            className={`region region-body ${activeRegion === 'body' ? 'active' : ''}`}
            onClick={() => onSelectRegion('body')}
            clipPath="url(#clip-body)"
          >
            <rect x="100" y="160" width="280" height="320" fill={fillFor(regions.body)}/>
            {/* 袜跟标记线 */}
            <path d="M100 380 Q140 410 180 412" stroke="rgba(16,18,24,0.18)" fill="none" strokeWidth="1" strokeDasharray="3 3"/>
          </g>

          {/* 袜头 toe */}
          <g
            className={`region region-toe ${activeRegion === 'toe' ? 'active' : ''}`}
            onClick={() => onSelectRegion('toe')}
            clipPath="url(#clip-toe)"
          >
            <rect x="100" y="478" width="200" height="120" fill={fillFor(regions.toe)}/>
          </g>

          {/* 区域选中描边 */}
          {activeRegion === 'welt' && (
            <rect x="99" y="59" width="282" height="46" rx="23" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="6 4" pointerEvents="none"/>
          )}
          {activeRegion === 'cuff' && (
            <rect x="99" y="104" width="282" height="56" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="6 4" pointerEvents="none"/>
          )}
          {activeRegion === 'body' && (
            <path
              d="M100 160 L380 160 L380 380 Q380 420 360 442 L228 574 Q210 592 188 592 L120 592 Q100 592 100 572 Z"
              fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="6 4" pointerEvents="none"
            />
          )}
          {activeRegion === 'toe' && (
            <path
              d="M100 572 Q100 592 120 592 L188 592 Q210 592 228 574 L268 534 Q280 522 280 506 L280 492 Q280 478 266 478 L130 478 Q100 478 100 506 Z"
              fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="6 4" pointerEvents="none"
            />
          )}

          {/* 标尺标签 */}
          <g className="region-labels" pointerEvents="none">
            <RegionTag x={392} y={84} label="袜口"  active={activeRegion === 'welt'}/>
            <RegionTag x={392} y={132} label="螺口" active={activeRegion === 'cuff'}/>
            <RegionTag x={392} y={282} label="主体" active={activeRegion === 'body'}/>
            <RegionTag x={120} y={418} label="袜跟" active={activeRegion === 'body'} subtle/>
            <RegionTag x={300} y={528} label="袜头" active={activeRegion === 'toe'}/>
          </g>
        </svg>
      </div>

      <div className="canvas-footer">
        <div className="canvas-meta">
          <span className="meta-dot"/>
          当前选中：<b>{REGION_LABELS[activeRegion]}</b>
        </div>
        <div className="canvas-zoom">
          <span>填充策略：</span>
          <code>{params.fillStrategy === 'tile' ? '平铺' : params.fillStrategy === 'stretch' ? '拉伸' : '智能分块'}</code>
        </div>
      </div>
    </div>
  )
}

function RegionTag({ x, y, label, active, subtle }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-30" y="-12" width="60" height="22" rx="11"
            fill={active ? 'var(--accent)' : 'rgba(255,255,255,0.95)'}
            stroke={active ? 'var(--accent)' : 'rgba(16,18,24,0.12)'}
            opacity={subtle ? 0.85 : 1}/>
      <text x="0" y="3" fontSize="11" textAnchor="middle"
            fill={active ? '#fff' : '#1a1d24'}>{label}</text>
    </g>
  )
}
