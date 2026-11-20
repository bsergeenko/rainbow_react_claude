import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { colorLabel } from '../labels';
import { HeartIcon } from './Icons';

/**
 * Herzsymbol für die Wunschliste. Ohne Login wird die Login-Seite geöffnet.
 * Gespeicherte Produkte werden ausgefüllt dargestellt; ein erneuter Klick entfernt sie.
 */
export default function HeartButton({ productId, color, productName, className = '' }) {
  const { user } = useAuth();
  const wishlist = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const entry = user ? wishlist.findItem(productId, color) : null;
  const saved = Boolean(entry);
  const name = `${productName || 'Produkt'} in ${colorLabel(color)}`;

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      navigate('/anmelden', {
        state: {
          flash: 'Bitte melde dich an, um Produkte auf deiner Wunschliste zu speichern.',
          flashType: 'info',
        },
      });
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (entry) {
        await wishlist.remove(entry.itemId);
        toast.show('Das Produkt wurde von deiner Wunschliste entfernt.');
      } else {
        await wishlist.add(productId, color);
        toast.show('Das Produkt wurde zu deiner Wunschliste hinzugefügt.');
      }
    } catch (error) {
      toast.show(error.message || 'Die Wunschliste konnte nicht aktualisiert werden.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`heart-button ${saved ? 'is-saved' : ''} ${className}`}
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? `${name} von der Wunschliste entfernen` : `${name} zur Wunschliste hinzufügen`}
      title={saved ? 'Von der Wunschliste entfernen' : 'Zur Wunschliste hinzufügen'}
      disabled={busy}
    >
      <HeartIcon filled={saved} size={22} />
    </button>
  );
}
