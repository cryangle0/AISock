import { useState } from 'react'
import { ChevronRight, Shield, Bell, Lock, Trash2, Info, LogOut } from 'lucide-react'
import Switch from '../../ui/Switch'
import Toast from '../../ui/Toast'
import useToast from '../../ui/useToast'

export default function CSettings({ onNavigate }) {
  const [notifyOrder, setNotifyOrder] = useState(true)
  const [notifyPromo, setNotifyPromo] = useState(false)
  const [notifyActivity, setNotifyActivity] = useState(true)
  const { toast, show } = useToast()

  return (
    <div className="mp-page mp-page-settings">
      {/* 账户安全 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">
          <Shield size={12} /> 账户安全
        </div>
        <button className="mp-setting-row">
          <span>手机号</span>
          <span className="mp-setting-val">138 ****8888 <ChevronRight size={12} /></span>
        </button>
        <button className="mp-setting-row">
          <span>登录密码</span>
          <span className="mp-setting-val">已设置 <ChevronRight size={12} /></span>
        </button>
        <button className="mp-setting-row">
          <span>微信绑定</span>
          <span className="mp-setting-val on">已绑定 <ChevronRight size={12} /></span>
        </button>
      </div>

      {/* 通知设置 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">
          <Bell size={12} /> 通知设置
        </div>
        <label className="mp-setting-row">
          <span>订单通知</span>
          <Switch on={notifyOrder} onChange={setNotifyOrder} ariaLabel="订单通知" />
        </label>
        <label className="mp-setting-row">
          <span>营销推送</span>
          <Switch on={notifyPromo} onChange={setNotifyPromo} ariaLabel="营销推送" />
        </label>
        <label className="mp-setting-row">
          <span>活动提醒</span>
          <Switch on={notifyActivity} onChange={setNotifyActivity} ariaLabel="活动提醒" />
        </label>
      </div>

      {/* 隐私 / 缓存 / 关于 */}
      <div className="mp-od-section">
        <div className="mp-od-section-title">
          <Lock size={12} /> 其他
        </div>
        <button className="mp-setting-row">
          <span>隐私设置</span>
          <ChevronRight size={12} />
        </button>
        <button
          className="mp-setting-row"
          onClick={() => show('缓存已清除')}
        >
          <span>清除缓存</span>
          <span className="mp-setting-val">12.6 MB <Trash2 size={11} /></span>
        </button>
        <button className="mp-setting-row">
          <span>
            <Info size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            关于爱花型
          </span>
          <span className="mp-setting-val">v1.0.0 <ChevronRight size={12} /></span>
        </button>
      </div>

      <button className="mp-setting-logout" onClick={() => onNavigate('c-mine')}>
        <LogOut size={13} /> 退出登录
      </button>

      <Toast message={toast} />
    </div>
  )
}
