/**
 * Toast — 轻量提示组件（受控）
 * 用法：<Toast message={toast} /> + useToast hook
 */
export default function Toast({ message }) {
  if (!message) return null
  return <div className="mp-toast">{message}</div>
}
