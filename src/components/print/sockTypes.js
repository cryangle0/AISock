// 袜版类型 metadata — 一期支持 4 种基础袜型
//
// 每种袜型对应一组资源：sock / mask / othermask / lineart
// 当前只内置 default（标准船袜+脚踝）一套图，其它袜型先 fallback 到 default，
// 后续替换为真实图片即可，无需改业务代码。

export const SOCK_TYPES = [
  {
    id: 'crew',
    name: '中筒袜',
    desc: '标准长度 · 25cm',
    asset: 'default',           // 资源 key（对应 image-tool 子目录或文件前缀）
    iconPath: 'M40 14 L60 14 L60 64 Q60 76 56 80 L48 86 Q44 88 41 88 L36 88 Q34 88 34 86 L34 78 Q34 68 36 64 L40 60 Z',
  },
  {
    id: 'ankle',
    name: '船袜',
    desc: '低帮浅口 · 12cm',
    asset: 'default',
    iconPath: 'M38 50 L62 50 L62 64 Q62 76 58 80 L50 86 Q46 88 43 88 L36 88 Q34 88 34 86 L34 78 Q34 68 36 64 Z',
  },
  {
    id: 'tube',
    name: '长筒袜',
    desc: '过膝长版 · 50cm',
    asset: 'default',
    iconPath: 'M40 6 L60 6 L60 64 Q60 76 56 80 L48 86 Q44 88 41 88 L36 88 Q34 88 34 86 L34 78 Q34 68 36 64 L40 60 Z',
  },
  {
    id: 'short',
    name: '短袜',
    desc: '常规短款 · 18cm',
    asset: 'default',
    iconPath: 'M40 30 L60 30 L60 64 Q60 76 56 80 L48 86 Q44 88 41 88 L36 88 Q34 88 34 86 L34 78 Q34 68 36 64 L40 60 Z',
  },
]

export const SOCK_TYPE_MAP = Object.fromEntries(SOCK_TYPES.map((t) => [t.id, t]))

// 已有真实资源的袜型 asset key 列表（其它袜型自动 fallback 到 default）
export const HAS_REAL_ASSET = new Set(['default'])

export const DEFAULT_SOCK_TYPE_ID = 'crew'

/** 取一个袜型对应的资源前缀（用于拼接 image-tool 路径） */
export function resolveAssetKey(sockTypeId) {
  const t = SOCK_TYPE_MAP[sockTypeId]
  if (!t) return 'default'
  return HAS_REAL_ASSET.has(t.asset) ? t.asset : 'default'
}
