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

async function main() {
  console.log('开始种子数据...')
  await seedAdmin()
  await seedSocks()
  await seedPatterns()
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
