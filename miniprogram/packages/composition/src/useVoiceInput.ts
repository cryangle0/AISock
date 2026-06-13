/**
 * 语音输入（按住说话）—— 录音 → 上传 → 千问 ASR 转写为文本。
 *
 * 放在 composition 包（随 vendor 打包、模块稳定可达），供小程序各页/组件复用：
 *   const { recording, elapsed, willCancel, start, move, stop, cancel } = useVoiceInput((text) => { ... })
 * 在按钮上绑定 @touchstart=start @touchmove=move @touchend=stop @touchcancel=cancel
 * 实现「按住说话、上滑取消、松开识别」，配合 VoiceRecordOverlay 呈现录音浮层。
 */
import { ref } from 'vue'
import { aiApi, uploadApi } from '@aisock/service'

/** 上滑超过该位移（px）判定为「取消」 */
const CANCEL_THRESHOLD = 90
/** 录音上限（与 recorder duration 一致，秒） */
const MAX_SECONDS = 60

export function useVoiceInput(onText: (text: string) => void) {
  const recording = ref(false)
  /** 已录制秒数（整数，驱动浮层计时显示） */
  const elapsed = ref(0)
  /** 当前手指是否在「取消区」（上滑足够），松开即取消 */
  const willCancel = ref(false)
  const recorder = uni.getRecorderManager()
  let canceled = false
  let startY = 0
  let timer: ReturnType<typeof setInterval> | null = null

  function startTimer() {
    elapsed.value = 0
    stopTimer()
    timer = setInterval(() => {
      elapsed.value += 1
      if (elapsed.value >= MAX_SECONDS) stopTimer() // recorder 到点自停，停表即可
    }, 1000)
  }
  function stopTimer() {
    if (timer) { clearInterval(timer); timer = null }
  }

  recorder.onStop(async (res: { tempFilePath?: string; duration?: number }) => {
    recording.value = false
    willCancel.value = false
    stopTimer()
    if (canceled) return
    const path = res.tempFilePath
    if (!path || (res.duration ?? 0) < 500) {
      uni.showToast({ title: '说话时间太短', icon: 'none' })
      return
    }
    uni.showLoading({ title: '识别中…', mask: true })
    try {
      // 录音先上传换取可访问 URL，再交给 ASR（DashScope 需公网可达音频地址）
      const up = await uploadApi.uploadFile(path)
      const r = await aiApi.asr(up.url)
      const text = (r.data.text || '').trim()
      if (text) onText(text)
      else uni.showToast({ title: '没听清，请重试', icon: 'none' })
    } catch {
      /* 拦截器已提示（未登录/网络等） */
    } finally {
      uni.hideLoading()
    }
  })

  recorder.onError(() => {
    recording.value = false
    willCancel.value = false
    stopTimer()
    uni.showToast({ title: '录音失败，请检查麦克风权限', icon: 'none' })
  })

  /** 按下开始录音（mp3，最长 60s）。记录起点 Y 以支持上滑取消 */
  function start(e?: any) {
    startY = e?.touches?.[0]?.clientY ?? e?.changedTouches?.[0]?.clientY ?? 0
    canceled = false
    willCancel.value = false
    recording.value = true
    startTimer()
    recorder.start({ format: 'mp3', duration: MAX_SECONDS * 1000, sampleRate: 16000 })
  }

  /** 手指移动：上滑越过阈值进入取消区 */
  function move(e?: any) {
    if (!recording.value) return
    const y = e?.touches?.[0]?.clientY ?? e?.changedTouches?.[0]?.clientY ?? startY
    willCancel.value = startY - y > CANCEL_THRESHOLD
  }

  /** 松开：在取消区则放弃，否则结束并识别 */
  function stop() {
    if (!recording.value) return
    stopTimer()
    if (willCancel.value) { cancel(); return }
    recorder.stop()
  }

  /** 取消（上滑取消 / touchcancel） */
  function cancel() {
    if (!recording.value) return
    canceled = true
    stopTimer()
    recorder.stop()
    recording.value = false
    willCancel.value = false
  }

  return { recording, elapsed, willCancel, start, move, stop, cancel }
}
