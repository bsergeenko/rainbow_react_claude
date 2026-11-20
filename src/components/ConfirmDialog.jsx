import { useEffect, useId, useRef } from 'react';

/**
 * Modaler Bestätigungsdialog auf Basis des nativen <dialog>-Elements
 * (Fokusführung und Schließen per Escape-Taste inklusive).
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Bestätigen',
  cancelLabel = 'Abbrechen',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={titleId} className="dialog__title">
        {title}
      </h2>
      <div className="dialog__body">{children}</div>
      <div className="dialog__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={danger ? 'btn btn--danger' : 'btn btn--primary'}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Bitte warten …' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
