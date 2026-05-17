/**
 * PhoneShellContext —— 把 .phone-shell 的 DOM 节点暴露给子页面
 * 子页面可借此 createPortal 把"右侧悬浮 dock"渲染到 phone-shell 上，
 * 避免被 .phone-shell-screen 的滚动影响。
 */
import { createContext, useContext } from 'react'

export const PhoneShellContext = createContext({ shellRef: { current: null } })

export function usePhoneShellRef() {
  return useContext(PhoneShellContext).shellRef
}
