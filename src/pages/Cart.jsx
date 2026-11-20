import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback';
import { MinusIcon, PlusIcon } from '../components/Icons';
import { ItemAttributes, ItemImage } from '../components/ItemDetails';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useApi } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import { enrichItem } from '../cartDetails';
import { flattenDesigns, formatPrice } from '../labels';

export default function Cart() {
  usePageTitle('Warenkorb');
  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const products = useApi('/products');
  const designs = useApi('/designs');
  const [busyItem, setBusyItem] = useState(null);

  const { reload } = cart;
  useEffect(() => {
    reload();
  }, [reload]);

  const loading = cart.loading || products.loading || designs.loading;
  const error = cart.error || products.error || designs.error;

  const designList = flattenDesigns(designs.data);
  const items = cart.items.map((item) => enrichItem(item, products.data, designList));
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const changeQuantity = async (item, quantity) => {
    if (quantity < 1) return;
    setBusyItem(item.itemId);
    try {
      await cart.updateQuantity(item.itemId, quantity);
    } catch (err) {
      toast.show(err.message || 'Die Menge konnte nicht geändert werden.', 'error');
    } finally {
      setBusyItem(null);
    }
  };

  const removeItem = async (item) => {
    setBusyItem(item.itemId);
    try {
      await cart.removeItem(item.itemId);
      toast.show('Das Produkt wurde aus dem Warenkorb entfernt.');
    } catch (err) {
      toast.show(err.message || 'Das Produkt konnte nicht entfernt werden.', 'error');
    } finally {
      setBusyItem(null);
    }
  };

  const retry = () => {
    if (cart.error) cart.reload();
    if (products.error) products.reload();
    if (designs.error) designs.reload();
  };

  return (
    <section className="page container cart-page">
      <header className="page__header">
        <h1>Warenkorb</h1>
      </header>

      {loading && <Loading text="Warenkorb wird geladen …" />}
      {!loading && error && <ErrorMessage error={error} onRetry={retry} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState text="Dein Warenkorb ist leer.">
          <Link to="/" className="btn btn--primary">
            Weiter einkaufen
          </Link>
        </EmptyState>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="cart-layout">
          <ul className="cart-list" aria-label="Produkte im Warenkorb">
            {items.map((item) => {
              const busy = busyItem === item.itemId;
              return (
                <li key={item.itemId} className="cart-item">
                  <ItemImage item={item} />
                  <div className="cart-item__main">
                    <h2 className="cart-item__name">
                      {item.product ? (
                        <Link to={`/produkt/${encodeURIComponent(item.productId)}?farbe=${encodeURIComponent(item.color)}`}>
                          {item.name}
                        </Link>
                      ) : (
                        item.name
                      )}
                      {item.isCustom && <span className="badge">Dein Design</span>}
                    </h2>
                    <ItemAttributes item={item} />
                    <p className="cart-item__unit">
                      Einzelpreis: <strong>{formatPrice(item.unitPrice)}</strong>
                    </p>
                  </div>
                  <div className="cart-item__actions">
                    <div className="quantity" role="group" aria-label={`Menge für ${item.name}`}>
                      <button
                        type="button"
                        className="quantity__button"
                        onClick={() => changeQuantity(item, item.quantity - 1)}
                        disabled={busy || item.quantity <= 1}
                        aria-label="Menge verringern"
                      >
                        <MinusIcon size={18} />
                      </button>
                      <span className="quantity__value" aria-live="polite">
                        <span className="visually-hidden">Menge: </span>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="quantity__button"
                        onClick={() => changeQuantity(item, item.quantity + 1)}
                        disabled={busy}
                        aria-label="Menge erhöhen"
                      >
                        <PlusIcon size={18} />
                      </button>
                    </div>
                    <p className="cart-item__total">
                      <span className="muted">Positionspreis</span>
                      <strong>{formatPrice(item.lineTotal)}</strong>
                    </p>
                    <button type="button" className="link-button link-button--danger" onClick={() => removeItem(item)} disabled={busy}>
                      Löschen
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="cart-summary" aria-label="Warenkorb-Übersicht">
            <dl className="totals">
              <div className="totals__row totals__row--strong">
                <dt>Zwischensumme</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
            </dl>
            <p className="muted">Die Versandkosten werden im Checkout berechnet.</p>
            <Link to="/kasse" className="btn btn--primary btn--block">
              Zur Kasse
            </Link>

            {!user && (
              <div className="cart-login">
                <p>
                  Melde dich an oder registriere dich, um deinen Warenkorb in deinem Benutzerkonto zu speichern. Du
                  kannst auch ohne Anmeldung bestellen.
                </p>
                <div className="button-row">
                  <Link to="/anmelden" state={{ from: '/warenkorb' }} className="btn btn--secondary">
                    Anmelden
                  </Link>
                  <Link to="/registrieren" state={{ from: '/warenkorb' }} className="btn btn--secondary">
                    Registrieren
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
