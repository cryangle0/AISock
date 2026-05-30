/**
 * App 首页聚合路由（访客可访问）
 * 返回 banner + 主题 + 推荐袜型 + 公共花型分类
 */
import { Hono } from 'hono'
import { ok } from '../../utils/response.js'
import { query } from '../../db.js'
import { listSocks } from '../../services/sock.service.js'
import { listCategories } from '../../services/pattern.service.js'
import { getPublicValue } from '../../services/config.service.js'

export const homeRouter = new Hono()

// 配置缺失时的兜底（与小程序内置默认一致，保证首屏永不空）
const DEFAULT_THEMES = [
  { id: 'jieqi', title: '二十四节气', en: 'JIE QI', bg: 'linear-gradient(135deg,#E8D5B8,#D4C09A)', link: '/pages/feed/index' },
  { id: 'dunhuang', title: '敦煌入梦', en: 'DUN HUANG', bg: 'linear-gradient(135deg,#C9B89A,#B5A085)', link: '/pages/feed/index' },
  { id: 'wenchuang', title: '文创物语', en: 'WEN CHUANG', bg: 'linear-gradient(135deg,#DEC38A,#C7A66E)', link: '/pages/feed/index' },
]
const DEFAULT_ZONES = [
  { id: 'editor', icon: '✏️', title: '开始设计', link: '/pages/editor/index' },
  { id: 'cart', icon: '🛒', title: '购物车', link: '/pages/cart/index' },
  { id: 'designs', icon: '📁', title: '我的设计', link: '/pages/designs/index' },
]
const DEFAULT_CASES = [
  { id: 'c1', title: '敦煌九色鹿', bg: 'linear-gradient(180deg,#C8B89A,#d4b796)', link: '/pages/feed/index' },
  { id: 'c2', title: '飞天乐舞', bg: 'linear-gradient(180deg,#A8C4B0,#d4b796)', link: '/pages/feed/index' },
  { id: 'c3', title: '千手观音', bg: 'linear-gradient(180deg,#D6A87A,#d4b796)', link: '/pages/feed/index' },
]

homeRouter.get('/', async (c) => {
  const [banners, socks, categories, themes, zones, cases] = await Promise.all([
    query('SELECT id, title, subtitle, image_url, link FROM banner WHERE status = 1 ORDER BY sort ASC LIMIT 5'),
    listSocks(),
    listCategories(),
    getPublicValue('home_themes', DEFAULT_THEMES),
    getPublicValue('home_zones', DEFAULT_ZONES),
    getPublicValue('home_cases', DEFAULT_CASES),
  ])
  return ok(c, {
    banners,
    socks: socks.slice(0, 8),
    categories,
    themes,
    zones,
    cases,
  })
})
