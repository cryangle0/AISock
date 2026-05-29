/**
 * 12 个袜版设计预设（对齐原型 presetTemplates）
 * regions 用敦煌矿物色块表达 4 个区域（welt/cuff/body/toe）
 */
export interface Preset {
  id: string
  name: string
  regions: { welt: string; cuff: string; body: string; toe: string }
}

const C = {
  cream: '#F5EBD7',
  sand: '#DEC38A',
  brown: '#8C5A3C',
  red: '#C5483C',
  green: '#5a8a7d',
  blue: '#3a6fa3',
  rose: '#D6A87A',
  mint: '#A8C4B0',
}

export const PRESETS: Preset[] = [
  { id: 'p1', name: '经典条纹袜', regions: { welt: C.brown, cuff: C.cream, body: C.sand, toe: C.brown } },
  { id: 'p2', name: '简约几何袜', regions: { welt: C.blue, cuff: C.cream, body: C.cream, toe: C.blue } },
  { id: 'p3', name: '少女心花朵袜', regions: { welt: C.red, cuff: C.rose, body: C.cream, toe: C.red } },
  { id: 'p4', name: '清新波点袜', regions: { welt: C.mint, cuff: C.cream, body: C.green, toe: C.mint } },
  { id: 'p5', name: '极简小点袜', regions: { welt: C.cream, cuff: C.sand, body: C.cream, toe: C.sand } },
  { id: 'p6', name: '多彩混搭袜', regions: { welt: C.red, cuff: C.sand, body: C.green, toe: C.blue } },
  { id: 'p7', name: '棋盘格潮袜', regions: { welt: C.brown, cuff: C.cream, body: C.brown, toe: C.cream } },
  { id: 'p8', name: '蓝调海浪袜', regions: { welt: C.blue, cuff: C.cream, body: C.blue, toe: C.cream } },
  { id: 'p9', name: '圆点派对袜', regions: { welt: C.rose, cuff: C.cream, body: C.sand, toe: C.red } },
  { id: 'p10', name: '商务精英袜', regions: { welt: '#2B1F14', cuff: C.brown, body: '#2B1F14', toe: C.brown } },
  { id: 'p11', name: '花园漫步袜', regions: { welt: C.green, cuff: C.mint, body: C.cream, toe: C.green } },
  { id: 'p12', name: '薄荷条纹袜', regions: { welt: C.mint, cuff: C.cream, body: C.mint, toe: C.cream } },
]
