/**
 * 邀请关系：建立 + 给双方各加 N 次今日生图额度
 */
import { execute, queryOne } from '../db.js'
import { grantBonusQuota } from './ai.service.js'

const BONUS = 3

export async function ensureInvitation(inviterId: number, inviteeId: number): Promise<void> {
  const exist = await queryOne<{ id: number }>(
    'SELECT id FROM invitation WHERE invitee_id = ?',
    [inviteeId],
  )
  if (exist) return
  await execute(
    'INSERT INTO invitation (inviter_id, invitee_id, bonus) VALUES (?,?,?)',
    [inviterId, inviteeId, BONUS],
  )
  await grantBonusQuota(inviterId, BONUS)
  await grantBonusQuota(inviteeId, BONUS)
}
