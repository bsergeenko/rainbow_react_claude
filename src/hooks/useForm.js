import { useState } from 'react';

/**
 * Einfache Formularverwaltung. Fehler werden erst nach einem Absendeversuch
 * oder nach Bearbeitung (Änderung + Verlassen) des jeweiligen Feldes angezeigt.
 */
export function useForm(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [dirty, setDirty] = useState({});
  const [blurred, setBlurred] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const errors = validate(values);
  const isValid = Object.keys(errors).length === 0;

  const setValue = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setDirty((d) => (d[name] ? d : { ...d, [name]: true }));
  };

  const fieldError = (name) => {
    if (!errors[name]) return undefined;
    if (submitted || (dirty[name] && blurred[name])) return errors[name];
    return undefined;
  };

  /** Props für ein Eingabefeld. */
  const field = (name) => ({
    name,
    value: values[name] ?? '',
    onChange: (event) => setValue(name, event.target.value),
    onBlur: () => setBlurred((b) => (b[name] ? b : { ...b, [name]: true })),
  });

  /** Markiert einen Absendeversuch und liefert true, wenn alle Eingaben gültig sind. */
  const trySubmit = () => {
    setSubmitted(true);
    return isValid;
  };

  const reset = (nextValues = initialValues) => {
    setValues(nextValues);
    setDirty({});
    setBlurred({});
    setSubmitted(false);
  };

  return { values, setValues, setValue, errors, isValid, fieldError, field, trySubmit, reset, submitted };
}
