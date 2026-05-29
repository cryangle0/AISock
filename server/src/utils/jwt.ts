/**
 * JWT 签发 / 校验
 * type 区分 user（小程序/web 用户）与 admin（后台账号）
 */
import jwt from 'jsonwebtoken'

export type TokenType = 'user' | 'admin'

export interface TokenPayload {
  userId: number
  type: TokenType
}

function getSecret(): string {
  return process.env.JWT_SECRET || 'change-me-in-production'
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions)
}

export function parseToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getSecret()) as TokenPayload
  if (typeof decoded.userId !== 'number' || !decoded.type) {
    throw new Error('invalid token payload')
  }
  return decoded
}
