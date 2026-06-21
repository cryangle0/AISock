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
    body: '<path d="M11.9999 4.99996C12.9204 4.99996 13.6666 4.25376 13.6666 3.33329C13.6666 2.41282 12.9204 1.66663 11.9999 1.66663C11.0795 1.66663 10.3333 2.41282 10.3333 3.33329C10.3333 4.25376 11.0795 4.99996 11.9999 4.99996Z" stroke="{C}" stroke-width="1.2"/><path d="M4 5.58972L6.6677 4.66602L10.3333 6.41555L6.6677 9.14808L10.3333 11.5611L8.00277 14.666" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.7734 7.21443L12.6673 7.70057L14.6668 5.8219" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.61641 10.5151L4.62651 11.8191L1.33472 13.6655" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  love: {
    vb: '0 0 16 16',
    body: '<path d="M7.92805 3.45729C6.22471 1.93742 4.21501 1.38229 2.75278 2.2265C0.680178 3.42309 0.492385 6.97803 2.33333 10.1667C3.54368 12.263 5.32958 13.6791 7.00008 14.0633" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.08602 5.83333C4.24508 9.02193 4.43285 12.5769 6.50545 13.7735C8.57805 14.9701 11.7506 13.3553 13.5916 10.1667C15.4325 6.97803 15.2447 3.42309 13.1721 2.2265C11.0995 1.02988 7.92695 2.64472 6.08602 5.83333Z" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  gift: {
    vb: '0 0 12 12',
    body: '<path d="M10.25 11V5H1.75V11H10.25Z" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 11V5" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.25 11H1.75" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 3H1V5H11V3Z" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 1L6 3L8 1" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  // 中筒袜 chip / 袜版选择 专用（设计稿 袜子_socks 1）：简化为清晰袜型轮廓，避免小尺寸被误读为音符
  'sock-mid': {
    vb: '0 0 16 16',
    body: '<path d="M6.2 1.5h3.6c.35 0 .63.28.63.62v1.4H6.2V1.5Z" stroke="{C}" stroke-width="1.1" stroke-linejoin="round"/><path d="M5.8 3.5h4.5v2.8c0 .55.22 1.08.6 1.46l2 1.95c.72.7.72 1.82 0 2.52-.62.64-1.7.64-2.32 0L5.45 9.2c-.45-.43-.75-1.03-.75-1.68V3.5Z" stroke="{C}" stroke-width="1.1" stroke-linejoin="round"/>',
  },
  // 袜版选择图标（E:\download\袜子.svg）
  'sock-template': {
    vb: '0 0 1024 1024',
    body: '<path d="M0 0h1024v1024H0z" fill="#D8D8D8" fill-opacity="0"/><path d="M337.92 204.8h471.04v61.44H337.92z" fill="#10704F"/><path d="M360.3456 962.60096a266.4448 266.4448 0 0 1-135.72096-496.59904l1.08544-0.63488 86.25152-49.5616V184.32a133.26336 133.26336 0 0 1 133.12-133.12h269.12768a133.2736 133.2736 0 0 1 133.12 133.12v346.86976a264.3968 264.3968 0 0 1-129.88416 267.06944l-1.4336 0.82944-222.84288 128.0512a265.91232 265.91232 0 0 1-132.8128 35.46112zM445.09184 112.64a71.76192 71.76192 0 0 0-71.68 71.68v267.03872L256.2048 518.7072a205.37344 205.37344 0 1 0 206.35648 355.15392l223.31392-128.3072a203.63264 203.63264 0 0 0 100.352-207.58528l-0.33792-4.5568V184.32a71.76192 71.76192 0 0 0-71.68-71.68z" fill="#333333"/><path d="M610.816 823.40864A232.07936 232.07936 0 0 1 583.68 714.58816 234.68032 234.68032 0 0 1 819.2 481.28v61.44a173.17888 173.17888 0 0 0-174.08 171.86816 170.496 170.496 0 0 0 19.9168 79.9232z" fill="#333333"/>',
  },
  voice: {
    vb: '0 0 20 20',
    body: '<path d="M12.9166 4.58329C12.9166 2.97246 11.6107 1.66663 9.99992 1.66663C8.38909 1.66663 7.08325 2.97246 7.08325 4.58329V9.99996C7.08325 11.6108 8.38909 12.9166 9.99992 12.9166C11.6107 12.9166 12.9166 11.6108 12.9166 9.99996V4.58329Z" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.75 9.58337C3.75 13.0352 6.54821 15.8334 10 15.8334C13.4518 15.8334 16.25 13.0352 16.25 9.58337" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 15.8334V18.3334" stroke="{C}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  send: {
    vb: '0 0 18 18',
    body: '<path fill-rule="evenodd" clip-rule="evenodd" d="M0.92763 4.78777C-0.14202 5.11682 -0.336528 6.54685 0.606492 7.14965L5.14796 10.0529C5.63278 10.3627 6.26274 10.321 6.70234 9.94993L12.3706 5.16679C12.6779 4.9075 13.0926 5.32186 12.8333 5.62941L8.05048 11.2987C7.67952 11.7383 7.63792 12.3682 7.94786 12.8528L10.8503 17.3937C11.4529 18.3365 12.8832 18.1419 13.2122 17.0726L17.9401 1.70143C18.2499 0.693702 17.3063 -0.249912 16.2989 0.059886L0.92763 4.78777Z" fill="{C}"/>',
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
  search: {
    vb: '0 0 24 24',
    body: '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" stroke="{C}" stroke-width="1.6"/><path d="m21 21-4.3-4.3" stroke="{C}" stroke-width="1.6" stroke-linecap="round"/>',
  },
  trash: {
    vb: '0 0 24 24',
    body: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6" stroke="{C}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  image: {
    vb: '0 0 24 24',
    body: '<path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/><path d="M8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" stroke="{C}" stroke-width="1.4"/><path d="m4 16 4.5-4 3.5 3 3-2.5L20 16" stroke="{C}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  clock: {
    vb: '0 0 24 24',
    body: '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="{C}" stroke-width="1.4"/><path d="M12 7v5l3 2" stroke="{C}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  box: {
    vb: '0 0 24 24',
    body: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/><path d="m3 7.5 9 4.5 9-4.5M12 21v-9" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/>',
  },
  truck: {
    vb: '0 0 24 24',
    body: '<path d="M3 6h11v9H3V6Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/><path d="M14 9h4l3 3v3h-7V9Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="{C}" stroke-width="1.4"/>',
  },
  bolt: {
    vb: '0 0 24 24',
    body: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" stroke="{C}" stroke-width="1.4" stroke-linejoin="round"/>',
  },
}
