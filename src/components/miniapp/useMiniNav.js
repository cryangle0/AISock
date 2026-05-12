/**
 * useMiniNav — 小程序导航状态管理 hook
 * 管理 role / page / history，支持前进、后退、角色切换
 */
import { useState, useCallback, useMemo } from 'react'
import { PAGE_META } from './pageMeta'

const INITIAL_STATE = {
  role: 'consumer',   // 'consumer' | 'designer'
  page: 'c-home',     // 当前页面 key
  history: [],        // 历史栈
}

export default function useMiniNav() {
  const [state, setState] = useState(INITIAL_STATE)

  const currentMeta = useMemo(() => PAGE_META[state.page] || {}, [state.page])

  const navigate = useCallback((pageKey) => {
    if (!PAGE_META[pageKey]) return
    setState(prev => ({
      ...prev,
      page: pageKey,
      history: [...prev.history, prev.page],
    }))
  }, [])

  const goBack = useCallback(() => {
    setState(prev => {
      if (!prev.history.length) return prev
      const history = [...prev.history]
      const page = history.pop()
      return { ...prev, page, history }
    })
  }, [])

  const switchRole = useCallback((role) => {
    const firstPage = role === 'consumer' ? 'c-home' : 'b-workspace'
    setState({
      role,
      page: firstPage,
      history: [],
    })
  }, [])

  const canGoBack = state.history.length > 0

  return {
    role: state.role,
    page: state.page,
    currentMeta,
    canGoBack,
    navigate,
    goBack,
    switchRole,
  }
}
