/**
 * 内联 SVG 图标注册表（线性风格，stroke 用 currentColor，对齐 FigmaUI/web端）
 * 用法：<AppIcon name="home" :size="22" />
 */
export interface IconDef {
  vb: string
  body: string
}

export const ICONS: Record<string, IconDef> = {
  home: {
    vb: '0 0 24 24',
    body: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  },
  'home-fill': {
    vb: '0 0 24 24',
    body: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5Z" fill="currentColor"/>',
  },
  palette: {
    vb: '0 0 24 24',
    body: '<path d="M12 3a9 9 0 1 0 0 18c1.3 0 2-.9 2-1.9 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-1 .8-1.8 1.8-1.8H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="7.5" cy="11.5" r="1.2" fill="currentColor"/><circle cx="9.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="14.5" cy="7.5" r="1.2" fill="currentColor"/>',
  },
  sparkle: {
    vb: '0 0 24 24',
    body: '<path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 17.9l-1.7-5.5L4.8 10.7 10.3 9 12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M18.5 3.5 19 5l1.5.5L19 6l-.5 1.5L18 6l-1.5-.5L18 5l.5-1.5Z" fill="currentColor"/>',
  },
  'sparkle-fill': {
    vb: '0 0 24 24',
    body: '<path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 17.9l-1.7-5.5L4.8 10.7 10.3 9 12 3.5Z" fill="currentColor"/><path d="M18.6 3 19.2 5l2 .6-2 .6-.6 2-.6-2-2-.6 2-.6.6-2Z" fill="currentColor"/>',
  },
  bag: {
    vb: '0 0 24 24',
    body: '<path d="M5.5 8.5h13l-1 11.5a1 1 0 0 1-1 .9H7.5a1 1 0 0 1-1-.9L5.5 8.5Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.5 8.5a3.5 3.5 0 0 1 7 0" fill="none" stroke="currentColor" stroke-width="1.7"/>',
  },
  user: {
    vb: '0 0 24 24',
    body: '<circle cx="12" cy="8.5" r="3.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  },
  bell: {
    vb: '0 0 24 24',
    body: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  },
  search: {
    vb: '0 0 24 24',
    body: '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m20 20-3.6-3.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  },
  chat: {
    vb: '0 0 24 24',
    body: '<path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-4 3.2V17H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  },
  moon: {
    vb: '0 0 24 24',
    body: '<path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  },
  'chevron-down': {
    vb: '0 0 24 24',
    body: '<path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  'chevron-right': {
    vb: '0 0 24 24',
    body: '<path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  upload: {
    vb: '0 0 24 24',
    body: '<path d="M12 15V4m0 0L8 8m4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  },
  image: {
    vb: '0 0 24 24',
    body: '<rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="10" r="1.6" fill="currentColor"/><path d="m5 17 4-4 3.5 3 3-2.5L19 17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  },
  undo: {
    vb: '0 0 24 24',
    body: '<path d="M9 7 4.5 11.5 9 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 11.5H14a5.5 5.5 0 0 1 0 11h-2.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  },
  redo: {
    vb: '0 0 24 24',
    body: '<path d="m15 7 4.5 4.5L15 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.5 11.5H10a5.5 5.5 0 0 0 0 11h2.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  },
  plus: {
    vb: '0 0 24 24',
    body: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  },
  minus: {
    vb: '0 0 24 24',
    body: '<path d="M5 12h14" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
  },
  design: {
    vb: '0 0 24 24',
    body: '<path d="M4 16.5 14.5 6a2.1 2.1 0 0 1 3 3L7 19.5l-4 1 1-4Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12.5 8 16 11.5" stroke="currentColor" stroke-width="1.6"/>',
  },
  folder: {
    vb: '0 0 24 24',
    body: '<path d="M4 6.5a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  },
  cart: {
    vb: '0 0 24 24',
    body: '<path d="M3 4h2l2.2 11.2a1 1 0 0 0 1 .8h8.2a1 1 0 0 0 1-.8L19 7H6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="19.5" r="1.4" fill="currentColor"/><circle cx="17" cy="19.5" r="1.4" fill="currentColor"/>',
  },
  grid: {
    vb: '0 0 24 24',
    body: '<rect x="4" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  },
  check: {
    vb: '0 0 24 24',
    body: '<path d="m5 12.5 4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  },
  close: {
    vb: '0 0 24 24',
    body: '<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  },
  bolt: {
    vb: '0 0 24 24',
    body: '<path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  },
  headset: {
    vb: '0 0 24 24',
    body: '<path d="M5 13v-1a7 7 0 0 1 14 0v1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><rect x="3.5" y="13" width="3.5" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="17" y="13" width="3.5" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M19 19a4 4 0 0 1-4 3.2h-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  },
  heart: {
    vb: '0 0 24 24',
    body: '<path d="M12 20s-7-4.4-7-9.3A3.7 3.7 0 0 1 12 7a3.7 3.7 0 0 1 7-.3c0 4.9-7 9.3-7 9.3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  },
  download: {
    vb: '0 0 24 24',
    body: '<path d="M12 4v11m0 0 4-4m-4 4-4-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 18h14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  },
  sun: {
    vb: '0 0 24 24',
    body: '<circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  },
}
