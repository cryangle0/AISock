/**
 * MySQL 连接池与查询助手
 * 单例池 + query / queryOne / execute / transaction 封装
 */
import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root123',
      database: process.env.DB_NAME || 'aisock',
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_SIZE) || 20,
      queueLimit: 0,
      charset: 'utf8mb4',
      timezone: '+08:00',
      supportBigNumbers: true,
      bigNumberStrings: false,
    })
  }
  return pool
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await getPool().query(sql, params)
  return rows as T[]
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const [result] = await getPool().query(sql, params)
  return result as mysql.ResultSetHeader
}

/**
 * 事务封装：回调内抛错自动回滚，否则提交。
 * 用法：await transaction(async (conn) => { await conn.query(...) })
 */
export async function transaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await getPool().getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
