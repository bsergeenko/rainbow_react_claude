import { useId } from 'react';

/** Hinweis zur Kennzeichnung von Pflichtfeldern. */
export function RequiredNote() {
  return (
    <p className="form-note">
      Mit <span className="required-mark" aria-hidden="true">*</span> gekennzeichnete Felder sind Pflichtfelder.
    </p>
  );
}

function Label({ id, label, required }) {
  return (
    <div className="field__label-row">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {required && (
        <span className="required-mark" aria-hidden="true">
          *
        </span>
      )}
    </div>
  );
}

/** Beschriftetes Eingabefeld mit Fehlermeldung. */
export function TextField({ label, required, error, hint, className = '', multiline = false, ...inputProps }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  const Component = multiline ? 'textarea' : 'input';

  return (
    <div className={`field ${error ? 'field--invalid' : ''} ${className}`}>
      <Label id={id} label={label} required={required} />
      <Component
        id={id}
        className="input"
        aria-invalid={error ? 'true' : undefined}
        aria-required={required ? 'true' : undefined}
        aria-describedby={describedBy}
        {...(multiline ? {} : { type: 'text' })}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({ label, required, error, children, className = '', ...selectProps }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={`field ${error ? 'field--invalid' : ''} ${className}`}>
      <Label id={id} label={label} required={required} />
      <select
        id={id}
        className="input select"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...selectProps}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckboxField({ label, checked, onChange, name }) {
  const id = useId();
  return (
    <div className="checkbox">
      <input id={id} type="checkbox" name={name} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
