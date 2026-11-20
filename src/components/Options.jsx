import { COLOR_SWATCHES, colorLabel, sizeLabel } from '../labels';
import { CheckIcon } from './Icons';

function isLightColor(hex) {
  if (!hex) return true;
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

/**
 * Gruppe auswählbarer Schaltflächen. Die aktuelle Auswahl wird über
 * aria-pressed und eine deutliche Hervorhebung angezeigt.
 */
export function OptionGroup({ legend, options, value, onChange, error, variant = 'pill', hideLegend = false }) {
  return (
    <fieldset className={`option-group ${error ? 'option-group--invalid' : ''}`}>
      <legend className={hideLegend ? 'visually-hidden' : 'option-group__legend'}>{legend}</legend>
      <div className={`option-group__items option-group__items--${variant}`}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              className={`option option--${variant} ${selected ? 'is-selected' : ''}`}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {error && <p className="field__error">{error}</p>}
    </fieldset>
  );
}

/** Farbauswahl mit Farbfeld und deutscher Farbbezeichnung. */
export function ColorPicker({ legend = 'Farbe', colors, value, onChange, error }) {
  return (
    <fieldset className={`option-group ${error ? 'option-group--invalid' : ''}`}>
      <legend className="option-group__legend">
        {legend}
        {value && <span className="option-group__current">: {colorLabel(value)}</span>}
      </legend>
      <div className="color-options">
        {colors.map((color) => {
          const selected = color === value;
          return (
            <button
              key={color}
              type="button"
              className={`color-option ${selected ? 'is-selected' : ''}`}
              aria-pressed={selected}
              onClick={() => onChange(color)}
            >
              <span
                className={`color-option__swatch ${isLightColor(COLOR_SWATCHES[color]) ? 'is-light' : ''}`}
                style={{ background: COLOR_SWATCHES[color] || '#ccc' }}
                aria-hidden="true"
              >
                {selected && <CheckIcon size={16} />}
              </span>
              <span className="color-option__label">{colorLabel(color)}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="field__error">{error}</p>}
    </fieldset>
  );
}

/** Größenauswahl. */
export function SizePicker({ legend = 'Größe', sizes, value, onChange, error }) {
  return (
    <OptionGroup
      legend={legend}
      options={sizes.map((size) => ({ value: size, label: sizeLabel(size) }))}
      value={value}
      onChange={onChange}
      error={error}
      variant="box"
    />
  );
}
