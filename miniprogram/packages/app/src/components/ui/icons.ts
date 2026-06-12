/**
 * 图标注册表 —— 内联 SVG（路径取自 FigmaUI 导出资源，统一线条风格）
 * 颜色占位符 {C}：由 AppIcon 在渲染时替换为实际色值，实现一套图标多色复用。
 * 每个图标存「viewBox + 内部 markup」，AppIcon 负责拼成完整 svg 并转 data URI。
 */
export interface IconDef {
  vb: string // viewBox
  /** 内部 markup，颜色处用 {C} 占位 */
  body: string
}

export const ICONS: Record<string, IconDef> = {
  // 底部导航（实心首页 / 线性其余）
  'home-fill': {
    vb: '0 0 24 24',
    body: '<path d="M23 21.83c0 .31-.13.6-.36.83-.23.22-.54.34-.86.34H2.22c-.32 0-.63-.12-.86-.34-.23-.23-.36-.52-.36-.83V9.48c0-.18.04-.35.12-.51.08-.16.2-.3.35-.41L11.25 1.25c.21-.16.48-.25.75-.25s.54.09.75.25l9.78 7.31c.15.11.27.25.35.41.08.16.12.33.12.51v12.35ZM10.78 13.6v7.05h2.44V13.6h-2.44Z" fill="{C}"/>',
  },
  compass: {
    vb: '0 0 24 24',
    body: '<path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10Z" stroke="{C}" stroke-width="1.4"/><path d="M7.5 16.5 9.75 9.75 16.5 7.5 14.25 14.25 7.5 16.5Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/>',
  },
  bag: {
    vb: '0 0 24 24',
    body: '<path d="M2.5 8.5h19l-2.1 13H4.6L2.5 8.5Z" stroke="{C}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.5 8.5C17.5 5.19 15.04 2.5 12 2.5S6.5 5.19 6.5 8.5" stroke="{C}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 14.5s1 1.5 3 1.5 3-1.5 3-1.5" stroke="{C}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  account: {
    vb: '0 0 24 24',
    body: '<path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 11.5A2.5 2.5 0 1 0 12 6.5a2.5 2.5 0 0 0 0 5Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/><path d="M5.01 19.17A5.01 5.01 0 0 1 10 14.5h4a5.01 5.01 0 0 1 4.99 4.66" stroke="{C}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  // 箭头
  'chevron-right': {
    vb: '0 0 12 12',
    body: '<path d="M4.75 3 7.75 6 4.75 9" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  'chevron-left': {
    vb: '0 0 24 24',
    body: '<path d="M15 6 9 12l6 6" stroke="{C}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  // 功能图标
  palette: {
    vb: '0 0 16 16',
    body: '<path d="M8 14.67c1.99 0 .78-2.96 2-4.34 1.04-1.18 4.67-.64 4.67-2.33 0-3.68-2.99-6.67-6.67-6.67S1.33 4.32 1.33 8 4.32 14.67 8 14.67Z" stroke="{C}" stroke-width="1"/><path d="M9.33 5.67a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5.33 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5.67 11.33a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke="{C}" stroke-width="1"/>',
  },
  socks: {
    vb: '0 0 16 16',
    body: '<path d="M5 1.5h5.2c.4 0 .8.4.8.8V7c0 .7.3 1.3.8 1.8l2.3 2.2c.8.8.8 2 0 2.8-.7.8-2 .8-2.7 0l-3-2.9c-.6-.6-1-1.5-1-2.4V4.5H5V1.5Z" stroke="{C}" stroke-width="1.1" stroke-linejoin="round"/><path d="M5 1.5v3" stroke="{C}" stroke-width="1.1"/>',
  },
  sparkle: {
    vb: '0 0 15 15',
    body: '<path d="M7.5.52 5.76 5.41.52 7.5l5.24 2.09L7.5 14.48l1.74-4.89L14.48 7.5 9.24 5.41 7.5.52Z" stroke="{C}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.08.52l-.35.98-1.05.42 1.05.42.35.97.35-.97 1.05-.42-1.05-.42-.35-.98Z" stroke="{C}" stroke-width="1" stroke-linejoin="round"/>',
  },
  redo: {
    vb: '0 0 12 12',
    body: '<path d="M9.5 4.5A4 4 0 1 0 10 7" stroke="{C}" stroke-width="1.1" stroke-linecap="round"/><path d="M10 1.5V4.5H7" stroke="{C}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  sport: {
    vb: '0 0 16 16',
    body: '<path d="M11 4a1.2 1.2 0 1 0 0-2.4A1.2 1.2 0 0 0 11 4Z" stroke="{C}" stroke-width="1.1"/><path d="m3 9 2.5-1.2L8 9.5l-.8 3M8 9.5 10 8l2.5 1M5.5 7.8 8 5l2.5 1.5" stroke="{C}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  love: {
    vb: '0 0 16 16',
    body: '<path d="M8 13.5S2 9.8 2 5.9C2 4 3.5 2.5 5.3 2.5c1.1 0 2.1.6 2.7 1.5.6-.9 1.6-1.5 2.7-1.5C12.5 2.5 14 4 14 5.9 14 9.8 8 13.5 8 13.5Z" stroke="{C}" stroke-width="1.1" stroke-linejoin="round"/>',
  },
  gift: {
    vb: '0 0 16 16',
    body: '<path d="M2.5 5.5h11V8h-11V5.5ZM3.5 8h9v6h-9V8ZM8 5.5V14" stroke="{C}" stroke-width="1.1" stroke-linejoin="round"/><path d="M8 5.5S6.5 2 4.8 2.8C3.6 3.4 5 5.5 8 5.5Zm0 0S9.5 2 11.2 2.8C12.4 3.4 11 5.5 8 5.5Z" stroke="{C}" stroke-width="1.1" stroke-linejoin="round"/>',
  },
  voice: {
    vb: '0 0 20 20',
    body: '<path d="M10 2.5a2.5 2.5 0 0 0-2.5 2.5v5a2.5 2.5 0 0 0 5 0V5A2.5 2.5 0 0 0 10 2.5Z" stroke="{C}" stroke-width="1.3" stroke-linejoin="round"/><path d="M5 9v1a5 5 0 0 0 10 0V9M10 15v2.5M7 17.5h6" stroke="{C}" stroke-width="1.3" stroke-linecap="round"/>',
  },
  send: {
    vb: '0 0 24 24',
    body: '<path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z" stroke="{C}" stroke-width="1.5" stroke-linejoin="round"/><path d="m10 13.5 4-4" stroke="{C}" stroke-width="1.5" stroke-linecap="round"/>',
  },
  camera: {
    vb: '0 0 20 20',
    body: '<path d="M3 6.5h2.5L7 4.5h6l1.5 2H17a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1Z" stroke="{C}" stroke-width="1.3" stroke-linejoin="round"/><path d="M10 13.5a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z" stroke="{C}" stroke-width="1.3"/>',
  },
  plus: {
    vb: '0 0 24 24',
    body: '<path d="M12 5v14M5 12h14" stroke="{C}" stroke-width="2" stroke-linecap="round"/>',
  },
  minus: {
    vb: '0 0 24 24',
    body: '<path d="M5 12h14" stroke="{C}" stroke-width="2" stroke-linecap="round"/>',
  },
  check: {
    vb: '0 0 12 12',
    body: '<path d="m2.5 6.2 2.2 2.3L9.5 3.5" stroke="{C}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  download: {
    vb: '0 0 24 24',
    body: '<path d="M12 3v12m0 0 4-4m-4 4-4-4M4 18.5h16" stroke="{C}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  upload: {
    vb: '0 0 24 24',
    body: '<path d="M12 16V4m0 0L8 8m4-4 4 4M4 18.5h16" stroke="{C}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  share: {
    vb: '0 0 24 24',
    body: '<path d="M18 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM18 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="{C}" stroke-width="1.4"/><path d="m8.2 10.8 7.6-4.3M8.2 13.2l7.6 4.3" stroke="{C}" stroke-width="1.4"/>',
  },
  folder: {
    vb: '0 0 24 24',
    body: '<path d="M3 6.5a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6.5Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/>',
  },
  lock: {
    vb: '0 0 24 24',
    body: '<path d="M6 10.5h12a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="{C}" stroke-width="1.4" stroke-linecap="round"/><path d="M12 14.5v2.5" stroke="{C}" stroke-width="1.4" stroke-linecap="round"/>',
  },
  gear: {
    vb: '0 0 24 24',
    body: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="{C}" stroke-width="1.4"/><path d="M19.4 13a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V19a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 17.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 13a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 7a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 2.6a1.7 1.7 0 0 0 1-1.56V1a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 2.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 21.4 7v.09" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  phone: {
    vb: '0 0 24 24',
    body: '<path d="M6.5 3.5h3l1.5 4-2.2 1.4a12 12 0 0 0 5.3 5.3l1.4-2.2 4 1.5v3a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 4.5 5.6 2 2 0 0 1 6.5 3.5Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/>',
  },
  message: {
    vb: '0 0 24 24',
    body: '<path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/><path d="M8 9.5h8M8 12.5h5" stroke="{C}" stroke-width="1.4" stroke-linecap="round"/>',
  },
  shield: {
    vb: '0 0 24 24',
    body: '<path d="M12 3 5 6v5c0 4.2 2.9 7.8 7 9 4.1-1.2 7-4.8 7-9V6l-7-3Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/><path d="m9 11.5 2 2 4-4" stroke="{C}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
  },
}
