/**
 * AnimatedCharacters —— Web 登录页左面板的卡通几何角色
 *
 * 移植自参考组件 animated-characters-login-page（shadcn + Tailwind 版本）。
 * 4 个角色：紫高、黑高、橙半圆、黄高
 *   - 眼睛跟随鼠标移动（每帧采样位置 / 鼠标位置）
 *   - 随机眨眼
 *   - 表单聚焦时（isTyping）互相对望
 *   - 验证码可见时（codeVisible）紫角色"窥视"
 *   - 验证码隐藏时（codeMasked）紫黑两个高个子向左侧避让
 *
 * 实现备注：React 19 不允许在 render 期访问 ref.current，
 *   因此用 ref callback + state 持有 rect 缓存。
 */
import { useState, useEffect, useCallback } from 'react'
import './AnimatedCharacters.css'

/* ------------------------------------------------------------------ */
/* 工具：把鼠标位置转换为指定圆心的偏移量                            */
/* ------------------------------------------------------------------ */
function lookOffset(rect, mouseX, mouseY, maxDistance) {
  if (!rect) return { x: 0, y: 0 }
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = mouseX - cx
  const dy = mouseY - cy
  const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance)
  const angle = Math.atan2(dy, dx)
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
  }
}

function bodyPos(rect, mouseX, mouseY) {
  if (!rect) return { faceX: 0, faceY: 0, bodySkew: 0 }
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 3
  const dx = mouseX - cx
  const dy = mouseY - cy
  return {
    faceX: Math.max(-15, Math.min(15, dx / 20)),
    faceY: Math.max(-10, Math.min(10, dy / 30)),
    bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
  }
}

/* ------------------------------------------------------------------ */
/* Pupil —— 仅瞳孔（橙、黄角色）                                      */
/* ------------------------------------------------------------------ */
function Pupil({
  size = 12,
  maxDistance = 5,
  pupilColor = '#2D2D2D',
  forceLookX,
  forceLookY,
  mouseX,
  mouseY,
}) {
  const [rect, setRect] = useState(null)
  const setRef = useCallback((el) => {
    if (el) setRect(el.getBoundingClientRect())
  }, [])

  let x = 0, y = 0
  if (forceLookX !== undefined && forceLookY !== undefined) {
    x = forceLookX; y = forceLookY
  } else {
    const off = lookOffset(rect, mouseX, mouseY, maxDistance)
    x = off.x; y = off.y
  }

  return (
    <div
      ref={setRef}
      className="ac-pupil"
      style={{
        width: size, height: size,
        background: pupilColor,
        transform: `translate(${x}px, ${y}px)`,
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* EyeBall —— 完整眼球（白底 + 瞳孔）                                  */
/* ------------------------------------------------------------------ */
function EyeBall({
  size = 18, pupilSize = 7, maxDistance = 5,
  eyeColor = '#fff', pupilColor = '#2D2D2D',
  isBlinking = false,
  forceLookX, forceLookY,
  mouseX, mouseY,
}) {
  const [rect, setRect] = useState(null)
  const setRef = useCallback((el) => {
    if (el) setRect(el.getBoundingClientRect())
  }, [])

  let x = 0, y = 0
  if (forceLookX !== undefined && forceLookY !== undefined) {
    x = forceLookX; y = forceLookY
  } else {
    const off = lookOffset(rect, mouseX, mouseY, maxDistance)
    x = off.x; y = off.y
  }

  return (
    <div
      ref={setRef}
      className="ac-eye"
      style={{
        width: size,
        height: isBlinking ? 2 : size,
        background: eyeColor,
      }}
    >
      {!isBlinking && (
        <div
          className="ac-pupil"
          style={{
            width: pupilSize, height: pupilSize,
            background: pupilColor,
            transform: `translate(${x}px, ${y}px)`,
          }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* AnimatedCharacters                                                  */
/* ------------------------------------------------------------------ */
export default function AnimatedCharacters({
  isTyping = false,
  codeMasked = false,
  codeVisible = false,
}) {
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [purpleBlink, setPurpleBlink] = useState(false)
  const [blackBlink, setBlackBlink] = useState(false)
  const [lookEachOther, setLookEachOther] = useState(false)
  const [purplePeek, setPurplePeek] = useState(false)

  // 4 个角色身体 rect（用 state 缓存而非 ref，避免 render 期读取 ref）
  const [purpleRect, setPurpleRect] = useState(null)
  const [blackRect, setBlackRect] = useState(null)
  const [yellowRect, setYellowRect] = useState(null)
  const [orangeRect, setOrangeRect] = useState(null)

  const setPurpleRef = useCallback((el) => {
    if (el) setPurpleRect(el.getBoundingClientRect())
  }, [])
  const setBlackRef = useCallback((el) => {
    if (el) setBlackRect(el.getBoundingClientRect())
  }, [])
  const setYellowRef = useCallback((el) => {
    if (el) setYellowRect(el.getBoundingClientRect())
  }, [])
  const setOrangeRef = useCallback((el) => {
    if (el) setOrangeRect(el.getBoundingClientRect())
  }, [])

  // 全局鼠标 + 窗口尺寸变化时刷新 rect
  useEffect(() => {
    const onMove = (e) => { setMouseX(e.clientX); setMouseY(e.clientY) }
    const onResize = () => {
      // 强制下一帧让 ref callback 重新计算（通过修改某个 dummy state 可达成；
      // 这里直接监听并不主动 setRect —— 角色用 transform，rect 不会高频变化，
      // 在常见情况下足够，登录页基本不滚动）
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // 紫色随机眨眼
  useEffect(() => {
    let timeoutId
    const schedule = () => {
      timeoutId = setTimeout(() => {
        setPurpleBlink(true)
        setTimeout(() => { setPurpleBlink(false); schedule() }, 150)
      }, Math.random() * 4000 + 3000)
    }
    schedule()
    return () => clearTimeout(timeoutId)
  }, [])

  // 黑色随机眨眼
  useEffect(() => {
    let timeoutId
    const schedule = () => {
      timeoutId = setTimeout(() => {
        setBlackBlink(true)
        setTimeout(() => { setBlackBlink(false); schedule() }, 150)
      }, Math.random() * 4000 + 3000)
    }
    schedule()
    return () => clearTimeout(timeoutId)
  }, [])

  // 输入开始时互相对望一下
  useEffect(() => {
    if (!isTyping) return undefined
    const t1 = setTimeout(() => setLookEachOther(true), 0)
    const t2 = setTimeout(() => setLookEachOther(false), 800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [isTyping])

  // 验证码可见时紫色随机偷瞄（每 2~5 秒一次，每次 800ms）
  useEffect(() => {
    if (!codeVisible) return undefined
    let peekT, releaseT
    const schedule = () => {
      peekT = setTimeout(() => {
        setPurplePeek(true)
        releaseT = setTimeout(() => { setPurplePeek(false); schedule() }, 800)
      }, Math.random() * 3000 + 2000)
    }
    schedule()
    return () => { clearTimeout(peekT); clearTimeout(releaseT) }
  }, [codeVisible])

  const purplePos = bodyPos(purpleRect, mouseX, mouseY)
  const blackPos  = bodyPos(blackRect, mouseX, mouseY)
  const yellowPos = bodyPos(yellowRect, mouseX, mouseY)
  const orangePos = bodyPos(orangeRect, mouseX, mouseY)

  const purpleTransform = codeVisible
    ? 'skewX(0deg)'
    : (isTyping || codeMasked)
      ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
      : `skewX(${purplePos.bodySkew || 0}deg)`

  const blackTransform = codeVisible
    ? 'skewX(0deg)'
    : lookEachOther
      ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
      : (isTyping || codeMasked)
        ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
        : `skewX(${blackPos.bodySkew || 0}deg)`

  return (
    <div className="ac-stage">
      <div className="ac-troupe">
        {/* 紫色高个子（最后排） */}
        <div
          ref={setPurpleRef}
          className="ac-char ac-char-purple"
          style={{
            left: '70px',
            width: '180px',
            height: (isTyping || codeMasked) ? '440px' : '400px',
            transform: purpleTransform,
          }}
        >
          <div
            className="ac-eyes ac-eyes-purple"
            style={{
              left: codeVisible ? 20 : lookEachOther ? 55 : 45 + purplePos.faceX,
              top:  codeVisible ? 35 : lookEachOther ? 65 : 40 + purplePos.faceY,
            }}
          >
            <EyeBall
              size={18} pupilSize={7} maxDistance={5}
              isBlinking={purpleBlink}
              mouseX={mouseX} mouseY={mouseY}
              forceLookX={codeVisible ? (purplePeek ? 4 : -4) : lookEachOther ? 3 : undefined}
              forceLookY={codeVisible ? (purplePeek ? 5 : -4) : lookEachOther ? 4 : undefined}
            />
            <EyeBall
              size={18} pupilSize={7} maxDistance={5}
              isBlinking={purpleBlink}
              mouseX={mouseX} mouseY={mouseY}
              forceLookX={codeVisible ? (purplePeek ? 4 : -4) : lookEachOther ? 3 : undefined}
              forceLookY={codeVisible ? (purplePeek ? 5 : -4) : lookEachOther ? 4 : undefined}
            />
          </div>
        </div>

        {/* 黑色高个子（中层） */}
        <div
          ref={setBlackRef}
          className="ac-char ac-char-black"
          style={{
            left: '240px',
            width: '120px',
            height: '310px',
            transform: blackTransform,
          }}
        >
          <div
            className="ac-eyes ac-eyes-black"
            style={{
              left: codeVisible ? 10 : lookEachOther ? 32 : 26 + blackPos.faceX,
              top:  codeVisible ? 28 : lookEachOther ? 12 : 32 + blackPos.faceY,
            }}
          >
            <EyeBall
              size={16} pupilSize={6} maxDistance={4}
              isBlinking={blackBlink}
              mouseX={mouseX} mouseY={mouseY}
              forceLookX={codeVisible ? -4 : lookEachOther ? 0 : undefined}
              forceLookY={codeVisible ? -4 : lookEachOther ? -4 : undefined}
            />
            <EyeBall
              size={16} pupilSize={6} maxDistance={4}
              isBlinking={blackBlink}
              mouseX={mouseX} mouseY={mouseY}
              forceLookX={codeVisible ? -4 : lookEachOther ? 0 : undefined}
              forceLookY={codeVisible ? -4 : lookEachOther ? -4 : undefined}
            />
          </div>
        </div>

        {/* 橙色半圆（前左） */}
        <div
          ref={setOrangeRef}
          className="ac-char ac-char-orange"
          style={{
            left: '0px',
            width: '240px',
            height: '200px',
            transform: codeVisible ? 'skewX(0deg)' : `skewX(${orangePos.bodySkew || 0}deg)`,
          }}
        >
          <div
            className="ac-eyes ac-eyes-orange"
            style={{
              left: codeVisible ? 50 : 82 + (orangePos.faceX || 0),
              top:  codeVisible ? 85 : 90 + (orangePos.faceY || 0),
            }}
          >
            <Pupil size={12} maxDistance={5}
              mouseX={mouseX} mouseY={mouseY}
              forceLookX={codeVisible ? -5 : undefined}
              forceLookY={codeVisible ? -4 : undefined}/>
            <Pupil size={12} maxDistance={5}
              mouseX={mouseX} mouseY={mouseY}
              forceLookX={codeVisible ? -5 : undefined}
              forceLookY={codeVisible ? -4 : undefined}/>
          </div>
        </div>

        {/* 黄色高个子（前右），多一根嘴巴线条 */}
        <div
          ref={setYellowRef}
          className="ac-char ac-char-yellow"
          style={{
            left: '310px',
            width: '140px',
            height: '230px',
            transform: codeVisible ? 'skewX(0deg)' : `skewX(${yellowPos.bodySkew || 0}deg)`,
          }}
        >
          <div
            className="ac-eyes ac-eyes-yellow"
            style={{
              left: codeVisible ? 20 : 52 + (yellowPos.faceX || 0),
              top:  codeVisible ? 35 : 40 + (yellowPos.faceY || 0),
            }}
          >
            <Pupil size={12} maxDistance={5}
              mouseX={mouseX} mouseY={mouseY}
              forceLookX={codeVisible ? -5 : undefined}
              forceLookY={codeVisible ? -4 : undefined}/>
            <Pupil size={12} maxDistance={5}
              mouseX={mouseX} mouseY={mouseY}
              forceLookX={codeVisible ? -5 : undefined}
              forceLookY={codeVisible ? -4 : undefined}/>
          </div>
          <div
            className="ac-mouth"
            style={{
              left: codeVisible ? 10 : 40 + (yellowPos.faceX || 0),
              top:  codeVisible ? 88 : 88 + (yellowPos.faceY || 0),
            }}
          />
        </div>
      </div>
    </div>
  )
}
