/** Setzt den Fokus nach einem fehlgeschlagenen Absendeversuch auf das erste ungültige Feld. */
export function focusFirstInvalid(form) {
  if (!form) return;
  window.requestAnimationFrame(() => {
    const field = form.querySelector('[aria-invalid="true"]');
    if (field) field.focus();
  });
}
