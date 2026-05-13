/**
 * useMiniNav — 单角色（设计师），4 个 tab + 子页栈
 */
import { useState, useCallback } from 'react'
import { PAGE_META } from './pageMeta'

const INITIAL_STATE = {
  page: 'b-editor',
  history: [],
  // 携带的导航参数（如订单详情需要 orderId）
  params: {},
}

export default function useMiniNav() {
  const [state, setState] = useState(INITIAL_STATE)

  const navigate = useCallback((pageKey, params = {}) => {
    if (!PAGE_META[pageKey]) return
    setState((prev) => ({
      page: pageKey,
      history: [...prev.history, { page: prev.page, params: prev.params }],
      params,
    }))
  }, [])

  const goBack = useCallback(() => {
    setState((prev) => {
      if (!prev.history.length) return prev
      const history = [...prev.history]
      const last = history.pop()
      return { page: last.page, params: last.params, history }
    })
  }, [])

  return {
    page: state.page,
    params: state.params,
    canGoBack: state.history.length > 0,
    navigate,
    goBack,
  }
}
