/**
 * useToast — 轻量 toast 提示 hook
 * const { toast, show } = useToast()
 * show('已保存', 1400)
 */
import { useState, useCallback, useRef, useEffect } from 'react'

export default function useToast(defaultDuration = 1400) {
  const [toast, setToast] = useState('')
  const timerRef = useRef(null)

  const show = useCallback((msg, duration) => {
    setToast(msg)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToast(''), duration ?? defaultDuration)
  }, [defaultDuration])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { toast, show }
}
