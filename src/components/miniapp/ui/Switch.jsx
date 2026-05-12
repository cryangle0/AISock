/**
 * Switch — 通用开关组件
 * 可复用于设置、通知、偏好等场景
 */
export default function Switch({ on, onChange, disabled, ariaLabel }) {
  return (
    <button
      type="button"
      className={`mp-switch ${on ? 'on' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onChange?.(!on)}
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <span className="mp-switch-thumb" />
    </button>
  )
}
