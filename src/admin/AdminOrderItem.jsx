import { useState } from 'react';
import { api } from '../api';
import OrderDetails from '../components/OrderDetails';
import { SelectField } from '../components/FormFields';
import { useToast } from '../context/ToastContext';
import { formatDate, formatPrice, ORDER_STATUS_LABELS, statusLabel } from '../labels';

const ADMIN_STATUSES = ['new', 'processing', 'shipped', 'delivered'];

/** Zugeordnetes Benutzerkonto bzw. Gastbestellung. */
function orderOwnerText(order, users) {
  if (!order.userId) return 'Gastbestellung';
  const owner = (users || []).find((u) => u.id === order.userId);
  if (owner) return `Benutzerkonto: ${owner.firstName} ${owner.lastName} (${owner.email})`;
  return 'Benutzerkonto gelöscht';
}

function StatusEditor({ order, onUpdated }) {
  const toast = useToast();
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  if (order.status === 'cancelled') {
    return (
      <p className="notice notice--info">
        Diese Bestellung wurde storniert. Der Status kann nicht mehr geändert werden. Der Gesamtbetrag von{' '}
        {formatPrice(order.total)} einschließlich Versandkosten wird auf die ursprünglich verwendete Zahlungsmethode
        zurückerstattet.
      </p>
    );
  }

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await api(`/orders/${encodeURIComponent(order.id)}/status`, {
        method: 'PUT',
        body: { status },
      });
      onUpdated(updated);
      toast.show(`Der Bestellstatus wurde auf „${statusLabel(updated.status)}“ geändert.`);
    } catch (err) {
      toast.show(err.message || 'Der Bestellstatus konnte nicht geändert werden.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="status-editor" onSubmit={save}>
      <SelectField label="Bestellstatus" value={status} onChange={(e) => setStatus(e.target.value)}>
        {ADMIN_STATUSES.map((value) => (
          <option key={value} value={value}>
            {ORDER_STATUS_LABELS[value]}
          </option>
        ))}
      </SelectField>
      <button type="submit" className="btn btn--primary" disabled={saving || status === order.status}>
        {saving ? 'Wird gespeichert …' : 'Status speichern'}
      </button>
    </form>
  );
}

/**
 * Bestellung im Adminbereich: kompakte Zeile mit aufklappbaren Bestelldetails
 * und Statusänderung. Die Ansicht bleibt Teil des Adminbereichs.
 */
export default function AdminOrderItem({ order, users, products, designs, shippingOptions, showCustomer = true, onUpdated }) {
  const [open, setOpen] = useState(false);
  const customer = order.customer || {};
  const detailsId = `admin-bestellung-${order.id}`;

  return (
    <li className="order-row">
      <div className="order-row__summary">
        <dl className="order-row__facts">
          <div>
            <dt>Bestellnummer</dt>
            <dd>{order.id}</dd>
          </div>
          <div>
            <dt>Bestelldatum</dt>
            <dd>{formatDate(order.createdAt)}</dd>
          </div>
          {showCustomer && (
            <div>
              <dt>Kunde</dt>
              <dd>
                {customer.firstName} {customer.lastName}
                <span className="block muted small">{order.userId ? 'Registrierter Benutzer' : 'Gast'}</span>
              </dd>
            </div>
          )}
          <div>
            <dt>Gesamtpreis</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`status status--${order.status}`}>{statusLabel(order.status)}</span>
            </dd>
          </div>
        </dl>
        <div className="order-row__actions">
          <button
            type="button"
            className="btn btn--secondary btn--small"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Details ausblenden' : 'Details anzeigen'}
          </button>
        </div>
      </div>
      {open && (
        <div id={detailsId} className="order-row__details">
          <p className="order-owner">
            <strong>Zuordnung:</strong> {orderOwnerText(order, users)}
          </p>
          <OrderDetails
            order={order}
            products={products}
            designs={designs}
            shippingOptions={shippingOptions}
            headingLevel={3}
          >
            <div className="status-box">
              <p>
                <strong>Aktueller Status:</strong> {statusLabel(order.status)}
              </p>
              <StatusEditor key={order.status} order={order} onUpdated={onUpdated} />
            </div>
          </OrderDetails>
        </div>
      )}
    </li>
  );
}
