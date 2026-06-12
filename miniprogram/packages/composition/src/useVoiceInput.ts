/**
 * 语音输入（按住说话）—— 录音 → 上传 → 千问 ASR 转写为文本。
 *
 * 放在 composition 包（随 vendor 打包、模块稳定可达），供小程序各页/组件复用：
 *   const { recording, start, stop, cancel } = useVoiceInput((text) => { ... })
 * 在按钮上绑定 @touchstart=start @touchend=stop @touchcancel=cancel 实现「按住说话、松开识别」。
 */
import { ref } from 'vue'
import { aiApi, uploadApi } from '@aisock/service'

export function useVoiceInput(onText: (text: string) => void) {
  const recording = ref(false)
  const recorder = uni.getRecorderManager()
  let canceled = false

  recorder.onStop(async (res: { tempFilePath?: string; duration?: number }) => {
    recording.value = false
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
    uni.showToast({ title: '录音失败，请检查麦克风权限', icon: 'none' })
  })

  /** 按下开始录音（mp3，最长 60s） */
  function start() {
    canceled = false
    recording.value = true
    recorder.start({ format: 'mp3', duration: 60000, sampleRate: 16000 })
  }

  /** 松开结束并识别 */
  function stop() {
    if (!recording.value) return
    recorder.stop()
  }

  /** 取消（上滑取消等场景） */
  function cancel() {
    if (!recording.value) return
    canceled = true
    recorder.stop()
    recording.value = false
  }

  return { recording, start, stop, cancel }
}
