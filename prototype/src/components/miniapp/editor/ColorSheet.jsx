/**
 * ColorSheet — "颜色" 板块
 * 复用 web 端的 BaseColorPicker（袜身/螺口/袜跟/袜头）
 */
import BaseColorPicker from '../../print/BaseColorPicker'

export default function ColorSheet({
  colors,
  onColorsChange,
  showHeelToeSeparate,
}) {
  const update = (k, v) => onColorsChange({ ...colors, [k]: v })

  return (
    <div className="mp-sheet-body mp-color-sheet">
      <BaseColorPicker
        label="袜身底色"
        value={colors.bodyHex}
        onChange={(v) => update('bodyHex', v)}
        allowAuto
      />
      <BaseColorPicker
        label="螺口"
        value={colors.weltHex}
        onChange={(v) => update('weltHex', v)}
      />
      {showHeelToeSeparate ? (
        <>
          <BaseColorPicker
            label="袜跟"
            value={colors.heelHex}
            onChange={(v) => update('heelHex', v)}
          />
          <BaseColorPicker
            label="袜头"
            value={colors.toeHex}
            onChange={(v) => update('toeHex', v)}
          />
        </>
      ) : (
        <BaseColorPicker
          label="袜跟+袜头"
          value={colors.heelHex}
          onChange={(v) => {
            update('heelHex', v)
            onColorsChange({ ...colors, heelHex: v, toeHex: v })
          }}
        />
      )}
    </div>
  )
}
