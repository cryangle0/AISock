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

async function main() {
  console.log('开始种子数据...')
  await seedAdmin()
  await seedSocks()
  await seedPatterns()
  await seedBanners()
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
