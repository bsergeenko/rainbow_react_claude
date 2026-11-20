import { enrichItem } from '../cartDetails';
import { formatAddress, formatPrice, paymentLabel } from '../labels';
import { ItemAttributes, ItemImage } from './ItemDetails';

/**
 * Vollständige Bestelldetails: Produkte, Preise, Versand, Zahlung und Kundendaten.
 * Formulierungen sind neutral und werden im Kundenbereich und im Adminbereich verwendet.
 */
export default function OrderDetails({ order, products, designs, shippingOptions, headingLevel = 3, children }) {
  const H = `h${headingLevel}`;
  const items = (order.items || []).map((item, index) => ({
    ...enrichItem(item, products, designs),
    key: item.itemId || `${item.productId}-${index}`,
  }));
  const shipping = (shippingOptions || []).find((o) => o.id === order.shippingMethod);
  const customer = order.customer || {};
  const addressLines = formatAddress(customer);
  const subtotal = order.subtotal !== undefined ? order.subtotal : items.reduce((s, i) => s + i.lineTotal, 0);

  return (
    <div className="order-details">
      <section className="order-details__section">
        <H className="order-details__title">Produkte</H>
        <ul className="order-items">
          {items.map((item) => (
            <li key={item.key} className="order-item">
              <ItemImage item={item} />
              <div className="order-item__main">
                <p className="order-item__name">
                  {item.name}
                  {item.isCustom && <span className="badge">Dein Design</span>}
                </p>
                <ItemAttributes item={item} />
              </div>
              <dl className="order-item__prices">
                <div>
                  <dt>Menge</dt>
                  <dd>{item.quantity}</dd>
                </div>
                <div>
                  <dt>Einzelpreis</dt>
                  <dd>{formatPrice(item.unitPrice)}</dd>
                </div>
                <div>
                  <dt>Positionspreis</dt>
                  <dd>{formatPrice(item.lineTotal)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <div className="order-details__grid">
        <section className="order-details__section">
          <H className="order-details__title">Preise und Versand</H>
          <dl className="totals">
            <div className="totals__row">
              <dt>Zwischensumme</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="totals__row">
              <dt>Versandart</dt>
              <dd>{shipping ? shipping.name : order.shippingMethod}</dd>
            </div>
            <div className="totals__row">
              <dt>Versandkosten</dt>
              <dd>{formatPrice(order.shippingCost)}</dd>
            </div>
            <div className="totals__row">
              <dt>Zahlungsmethode</dt>
              <dd>{paymentLabel(order.paymentMethod)}</dd>
            </div>
            <div className="totals__row totals__row--strong">
              <dt>Gesamtpreis</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        <section className="order-details__section">
          <H className="order-details__title">Kundendaten und Lieferadresse</H>
          <address className="address-block">
            <strong>
              {customer.firstName} {customer.lastName}
            </strong>
            <br />
            {addressLines.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
            <span>E-Mail-Adresse: {customer.email}</span>
          </address>
          {children}
        </section>
      </div>
    </div>
  );
}
