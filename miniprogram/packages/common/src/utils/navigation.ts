/** 导航助手（封装 uni 路由，做空值/错误兜底） */

export function navigateTo(url: string): void {
  uni.navigateTo({ url, fail: () => uni.switchTab({ url }) })
}

export function switchTab(url: string): void {
  uni.switchTab({ url })
}

export function redirectTo(url: string): void {
  uni.redirectTo({ url })
}

export function reLaunch(url: string): void {
  uni.reLaunch({ url })
}

export function navigateBack(delta = 1): void {
  uni.navigateBack({ delta })
}
