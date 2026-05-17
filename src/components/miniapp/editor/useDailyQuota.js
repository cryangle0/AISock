/**
 * useDailyQuota —— 新用户每日免费 AI 生图配额
 *
 * 规则（前端原型）：
 *   - 注册当天起 7 天内为"新用户"，每天赠送 5 次
 *   - 之后维持每日 2 次基础免费额度
 *   - 状态保存在 localStorage：aisock.mp.aiQuota = { date, used, perDay, isNewUser }
 *   - 跨过 0 点自动重置（按设备本地时间）
 */
import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'aisock.mp.aiQuota'
const REGISTERED_KEY = 'aisock.mp.registeredAt'

const NEW_USER_DAYS = 7
const NEW_USER_DAILY = 5
const RETURNING_DAILY = 2

function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function isWithinNewUserWindow() {
  try {
    const ts = Number(localStorage.getItem(REGISTERED_KEY))
    if (!ts) return true   // 没登记过的视为新用户
    return Date.now() - ts < NEW_USER_DAYS * 24 * 3600 * 1000
  } catch { return true }
}

function dailyLimit() {
  return isWithinNewUserWindow() ? NEW_USER_DAILY : RETURNING_DAILY
}

function loadQuota() {
  const today = todayStr()
  const perDay = dailyLimit()
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (raw && raw.date === today) {
      return { date: today, used: raw.used || 0, perDay, isNewUser: isWithinNewUserWindow() }
    }
  } catch { /* noop */ }
  return { date: today, used: 0, perDay, isNewUser: isWithinNewUserWindow() }
}

function saveQuota(q) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(q)) } catch { /* noop */ }
}

/** 调用方在登录成功时一次性调用，标记新用户开始时间 */
export function markRegisteredOnce() {
  try {
    if (!localStorage.getItem(REGISTERED_KEY)) {
      localStorage.setItem(REGISTERED_KEY, String(Date.now()))
    }
  } catch { /* noop */ }
}

export default function useDailyQuota() {
  const [quota, setQuota] = useState(() => loadQuota())

  // 跨日自动刷新
  useEffect(() => {
    const id = setInterval(() => {
      const today = todayStr()
      if (quota.date !== today) setQuota(loadQuota())
    }, 60 * 1000)
    return () => clearInterval(id)
  }, [quota.date])

  const remaining = Math.max(0, quota.perDay - quota.used)

  const consume = useCallback(() => {
    setQuota((q) => {
      const today = todayStr()
      const base = q.date === today ? q : loadQuota()
      const next = { ...base, used: base.used + 1 }
      saveQuota(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    const next = { date: todayStr(), used: 0, perDay: dailyLimit(), isNewUser: isWithinNewUserWindow() }
    saveQuota(next)
    setQuota(next)
  }, [])

  return {
    used: quota.used,
    perDay: quota.perDay,
    remaining,
    isNewUser: quota.isNewUser,
    canUse: remaining > 0,
    consume,
    reset,
  }
}
