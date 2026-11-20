import { assetUrl } from '../api';
import { colorLabel, sizeLabel, subcategoryLabel } from '../labels';

/** Bild einer Warenkorb- oder Bestellposition. */
export function ItemImage({ item }) {
  return (
    <span className="item-image">
      {item.image ? <img src={assetUrl(item.image)} alt="" loading="lazy" /> : <span>Kein Bild</span>}
    </span>
  );
}

/** Merkmale einer Position: Farbe, Größe und ggf. die Konfiguration aus „Dein Design“. */
export function ItemAttributes({ item }) {
  return (
    <dl className="item-attributes">
      {item.isCustom && (
        <div>
          <dt className="no-colon">Für wen?</dt>
          <dd>
            {item.target || '–'}
            {item.subcategory ? ` (${subcategoryLabel(item.subcategory)})` : ''}
          </dd>
        </div>
      )}
      <div>
        <dt>Farbe</dt>
        <dd>{colorLabel(item.color)}</dd>
      </div>
      <div>
        <dt>Größe</dt>
        <dd>{sizeLabel(item.size)}</dd>
      </div>
      {item.isCustom && (
        <>
          <div>
            <dt>Rückenmotiv</dt>
            <dd className="item-attributes__motif">
              {item.design ? (
                <>
                  <img src={assetUrl(item.design.image)} alt="" />
                  {item.design.fullLabel}
                </>
              ) : (
                'Motiv nicht mehr verfügbar'
              )}
            </dd>
          </div>
          <div>
            <dt>Taschenwunsch</dt>
            <dd className="pre-wrap">{item.pocketRequest && item.pocketRequest.trim() ? item.pocketRequest : 'Keine Angabe'}</dd>
          </div>
        </>
      )}
    </dl>
  );
}
