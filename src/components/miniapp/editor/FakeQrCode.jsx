/**
 * FakeQrCode — 伪二维码（演示用）
 * 与 web PaymentModal 中的实现一致：3 角定位锚 + 确定式伪随机点阵
 */
export default function FakeQrCode({ color = '#000', size = 140 }) {
  const cellSize = 6
  const grid = 24
  const total = grid * cellSize
  const seed = (x, y) => ((x * 73) ^ (y * 41) ^ 137) & 1

  const cells = []
  for (let y = 0; y < grid; y += 1) {
    for (let x = 0; x < grid; x += 1) {
      const inAnchor = (x < 7 && y < 7)
        || (x >= grid - 7 && y < 7)
        || (x < 7 && y >= grid - 7)
      if (inAnchor) continue
      if (seed(x, y) === 1) {
        cells.push(
          <rect
            key={`${x}-${y}`}
            x={x * cellSize}
            y={y * cellSize}
            width={cellSize}
            height={cellSize}
          />,
        )
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${total} ${total}`} className="mp-pay-qr">
      <rect width={total} height={total} fill="#fff" />
      <g fill={color}>{cells}</g>
      <Anchor ox={0} oy={0} cellSize={cellSize} color={color} />
      <Anchor ox={grid - 7} oy={0} cellSize={cellSize} color={color} />
      <Anchor ox={0} oy={grid - 7} cellSize={cellSize} color={color} />
    </svg>
  )
}

function Anchor({ ox, oy, cellSize, color }) {
  return (
    <g transform={`translate(${ox * cellSize} ${oy * cellSize})`}>
      <rect width={cellSize * 7} height={cellSize * 7} rx={2} fill={color} />
      <rect x={cellSize} y={cellSize} width={cellSize * 5} height={cellSize * 5} rx={1} fill="#fff" />
      <rect x={cellSize * 2} y={cellSize * 2} width={cellSize * 3} height={cellSize * 3} fill={color} />
    </g>
  )
}
