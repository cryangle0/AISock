/**
 * 种子数据：admin 账号 + 袜型 + 花型分类/素材 + Banner
 * 用法：npm run seed
 */
import bcrypt from 'bcryptjs'
import { execute, query, closePool } from '../src/db.js'
import { closeRedis } from '../src/redis.js'

async function seedAdmin() {
  const exists = await query('SELECT id FROM admin_account WHERE username = ?', ['admin'])
  if (exists.length) {
    console.log('· admin 已存在，跳过')
    return
  }
  const hash = await bcrypt.hash('admin123', 10)
  await execute(
    'INSERT INTO admin_account (username, password, nickname, role) VALUES (?,?,?,?)',
    ['admin', hash, '超级管理员', 'admin'],
  )
  console.log('✓ admin 账号已创建（admin / admin123）')
}

async function seedSocks() {
  const exists = await query('SELECT id FROM sock_model LIMIT 1')
  if (exists.length) {
    console.log('· 袜型已存在，跳过')
    return
  }
  const socks = [
    ['long-tube', '长筒袜', 'UV 印花', 50, 8.5],
    ['mid-tube', '中筒袜', 'UV 印花', 50, 6.8],
    ['short', '短袜', '针织提花', 100, 4.2],
    ['boat', '船袜', 'UV 印花', 100, 3.8],
    ['invisible', '隐形袜', 'UV 印花', 100, 3.2],
    ['kids', '儿童袜', 'UV 印花', 50, 4.5],
  ]
  for (const [code, name, craft, minOrder, price] of socks) {
    await execute(
      `INSERT INTO sock_model (code, name, craft, min_order, unit_price, recommend_dpi, phys_width_mm, phys_height_mm)
       VALUES (?,?,?,?,?,?,?,?)`,
      [code, name, craft, minOrder, price, 150, 120, 380],
    )
  }
  console.log(`✓ 已插入 ${socks.length} 个袜型`)
}

async function seedPatterns() {
  const exists = await query('SELECT id FROM pattern_category LIMIT 1')
  if (exists.length) {
    console.log('· 花型分类已存在，跳过')
    return
  }
  const cats = ['碎花', '条纹', '圆点', '方格', '大花', '几何', '卡通', '民族']
  const catIds: number[] = []
  for (let i = 0; i < cats.length; i++) {
    const r = await execute('INSERT INTO pattern_category (name, sort) VALUES (?, ?)', [cats[i], i])
    catIds.push(r.insertId)
  }
  for (let i = 0; i < cats.length; i++) {
    for (let j = 1; j <= 3; j++) {
      await execute(
        'INSERT INTO pattern (category_id, name, image_url, thumb_url, source) VALUES (?,?,?,?, ?)',
        [
          catIds[i], `${cats[i]}-${j}`,
          `https://placehold.co/512x512?text=${encodeURIComponent(cats[i] + j)}`,
          `https://placehold.co/128x128?text=${encodeURIComponent(cats[i] + j)}`,
          'public',
        ],
      )
    }
  }
  console.log(`✓ 已插入 ${cats.length} 个分类 + ${cats.length * 3} 张公共花型`)
}

async function seedBanners() {
  const exists = await query('SELECT id FROM banner LIMIT 1')
  if (exists.length) {
    console.log('· Banner 已存在，跳过')
    return
  }
  const banners = [
    ['敦煌梦', '千年壁画艺术之旅', 0],
    ['二十四节气', '随心订主题系列', 1],
    ['文创物语', '联名设计上新', 2],
  ]
  for (const [title, subtitle, sort] of banners) {
    await execute('INSERT INTO banner (title, subtitle, sort) VALUES (?,?,?)', [title, subtitle, sort])
  }
  console.log(`✓ 已插入 ${banners.length} 个 Banner`)
}

async function seedArticles() {
  const exists = await query('SELECT id FROM article LIMIT 1').catch(() => [])
  if (exists.length) {
    console.log('· 文章已存在，跳过')
    return
  }
  const feeds = [
    ['feed', '敦煌九色鹿', '主题', '九色鹿壁画同款，矿物色系'],
    ['feed', '飞天乐舞', '主题', '飞天飘带纹样，灵动优雅'],
    ['feed', '千手观音', '主题', '繁复对称之美'],
    ['feed', '二十四节气', '系列', '一节气一配色'],
    ['feed', '文创物语', '系列', '博物馆联名'],
    ['feed', '色卡推荐', '工具', '一键换季配色'],
  ]
  const news = [
    ['news', '2024 春夏趋势花型发布', '趋势', '最新花型趋势已上线，快来获取灵感'],
    ['news', '敦煌主题设计大赛开启', '活动', '参与赢取丰厚奖励'],
    ['news', '系统升级维护通知', '公告', '9月25日 02:00~04:00 系统升级'],
  ]
  const faqs = [
    ['faq', '如何下单生产？', '帮助', '设计完成后点击下单，填写尺码与收货信息即可'],
    ['faq', '起订量是多少？', '帮助', '不同袜型起订量 50-100 双不等'],
    ['faq', '多久能收到货？', '帮助', '生产周期约 7-15 个工作日'],
  ]
  for (const [kind, title, tag, summary] of [...feeds, ...news, ...faqs]) {
    await execute(
      'INSERT INTO article (kind, title, tag, summary, published_at) VALUES (?,?,?,?, NOW())',
      [kind, title, tag, summary],
    )
  }
  console.log(`✓ 已插入 ${feeds.length + news.length + faqs.length} 篇文章（推荐/资讯/FAQ）`)
}

/** 标签参考数据（与 migrations/007_pattern_tags.sql 保持一致；code 与小程序内置一致） */
const SEED_TAGS: Array<{ kind: string; code: string; name: string; description?: string; sort: number }> = [
  { kind: 'scene', code: 'lover', name: '送爱人/恋人', description: '甜蜜心意，温暖相伴', sort: 0 },
  { kind: 'scene', code: 'bff', name: '送闺蜜/朋友', description: '一起出行，默契加倍', sort: 1 },
  { kind: 'scene', code: 'elder', name: '送长辈/家人', description: '贴心守护，舒服相伴', sort: 2 },
  { kind: 'scene', code: 'self', name: '送给自己', description: '取悦自己，从脚开始', sort: 3 },
  { kind: 'style', code: 'floral', name: '浪漫花卉', sort: 0 },
  { kind: 'style', code: 'couple', name: '爱心情侣', sort: 1 },
  { kind: 'style', code: 'sport', name: '运动活力', sort: 2 },
  { kind: 'style', code: 'retro', name: '复古格纹', sort: 3 },
  { kind: 'style', code: 'solid', name: '简约纯色', sort: 4 },
  { kind: 'style', code: 'cartoon', name: '萌趣卡通', sort: 5 },
  { kind: 'style', code: 'illust', name: '艺术插画', sort: 6 },
  { kind: 'style', code: 'guochao', name: '国潮纹样', sort: 7 },
  // 主题（发现页顶部 Tab，名称与小程序内置一致；后台可改名/增减，前端跟随）
  { kind: 'theme', code: 'yequ', name: '野趣精灵', sort: 0 },
  { kind: 'theme', code: 'pasidier', name: '帕斯蒂尔', sort: 1 },
  { kind: 'theme', code: 'tonghe', name: '痛核少女', sort: 2 },
  { kind: 'theme', code: 'songchi', name: '松弛田园', sort: 3 },
  { kind: 'theme', code: 'meishi', name: '美式学院', sort: 4 },
]

/** code → 关键词（用于按花型名 + 分类名做首批回填；运营后续在后台精修） */
const TAG_KEYWORDS: Record<string, string[]> = {
  lover: ['浪漫', '花', '玫瑰', '爱心', '粉', '情侣', '樱'],
  bff: ['活力', '运动', '清新', '卡通', '彩虹', '萌'],
  elder: ['经典', '简约', '纯色', '回纹', '祥', '节气', '竹', '梅', '民族'],
  self: ['艺术', '插画', '个性', '国潮', '几何'],
  floral: ['花', '玫瑰', '樱', '牡丹', '浪漫'],
  couple: ['爱心', '情侣', '心'],
  sport: ['运动', '活力', '几何'],
  retro: ['格', '复古', '条纹'],
  solid: ['纯色', '简约', '米白', '燕麦', '圆点'],
  cartoon: ['卡通', '萌', '猫', '熊'],
  illust: ['插画', '艺术'],
  guochao: ['国潮', '祥', '龙', '云', '回纹', '观音', '飞天', '节气', '民族'],
}

/** 标签 + 花型打标：确保标签存在，再按关键词给公共花型回填首批关联（幂等，INSERT IGNORE） */
async function seedPatternTags() {
  // 1) 确保标签存在（与迁移一致，幂等）
  for (const t of SEED_TAGS) {
    await execute(
      'INSERT IGNORE INTO tag (kind, code, name, description, sort) VALUES (?,?,?,?,?)',
      [t.kind, t.code, t.name, t.description ?? null, t.sort],
    )
  }
  const tagRows = await query<{ id: number; code: string }>('SELECT id, code FROM tag')
  const tagIdByCode = new Map(tagRows.map((r) => [r.code, r.id]))

  // 2) 已有关联则跳过回填（避免覆盖运营在后台的精修）
  const linked = await query('SELECT 1 FROM pattern_tag LIMIT 1')
  if (linked.length) {
    console.log('· 花型标签关联已存在，跳过回填（标签已确保存在）')
    return
  }

  // 3) 按 花型名 + 分类名 关键词回填
  const patterns = await query<{ id: number; name: string; cat: string | null }>(
    `SELECT p.id, p.name, pc.name AS cat
     FROM pattern p LEFT JOIN pattern_category pc ON pc.id = p.category_id
     WHERE p.owner_id IS NULL`,
  )
  let linkCount = 0
  for (const p of patterns) {
    const haystack = `${p.name || ''} ${p.cat || ''}`
    for (const [code, keywords] of Object.entries(TAG_KEYWORDS)) {
      const tagId = tagIdByCode.get(code)
      if (!tagId) continue
      if (keywords.some((k) => haystack.includes(k))) {
        await execute('INSERT IGNORE INTO pattern_tag (pattern_id, tag_id) VALUES (?, ?)', [p.id, tagId])
        linkCount++
      }
    }
  }

  // 4) 主题回填：保持发现页现有内容（第 i 个主题 ↔ 第 i 个分类的花型，与旧的按位置映射一致）
  const themeRows = await query<{ id: number }>('SELECT id FROM tag WHERE kind = ? ORDER BY sort ASC, id ASC', ['theme'])
  const catRows = await query<{ id: number }>('SELECT id FROM pattern_category ORDER BY sort ASC, id ASC')
  for (let i = 0; i < themeRows.length; i++) {
    const theme = themeRows[i]
    const cat = catRows[i]
    if (!theme || !cat) continue
    await execute(
      'INSERT IGNORE INTO pattern_tag (pattern_id, tag_id) SELECT id, ? FROM pattern WHERE category_id = ? AND owner_id IS NULL',
      [theme.id, cat.id],
    )
  }
  console.log(`✓ 已确保 ${SEED_TAGS.length} 个标签，按关键词回填 ${linkCount} 条场景/风格关联，并按主题回填发现页内容`)
}

async function main() {
  console.log('开始种子数据...')
  await seedAdmin()
  await seedSocks()
  await seedPatterns()
  await seedPatternTags()
  await seedBanners()
  await seedArticles()
  console.log('完成 ✓')
}

main()
  .catch((err) => {
    console.error('种子失败:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await closePool()
    await closeRedis()
  })
