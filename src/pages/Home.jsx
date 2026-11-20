import { Link } from 'react-router-dom';
import { assetUrl, LOGO_URL } from '../api';
import { ErrorMessage, Loading } from '../components/Feedback';
import { useApi } from '../hooks/useApi';
import { usePageTitle } from '../hooks/usePageTitle';
import { flattenDesigns } from '../labels';

const CATEGORY_TILES = [
  { to: '/damen', label: 'Damen', image: '/assets/home/women.jpg' },
  { to: '/herren', label: 'Herren', image: '/assets/home/men.jpg' },
  { to: '/kinder', label: 'Kinder', image: '/assets/home/kids.jpg' },
  { to: '/hunde', label: 'Hunde', image: '/assets/home/dogs.jpg' },
];

// Motive designe01.jpg bis designe04.jpg aus /assets/designs/adult/
const FEATURED_DESIGN_FILES = ['designe01.jpg', 'designe02.jpg', 'designe03.jpg', 'designe04.jpg'];

export default function Home() {
  usePageTitle('');
  const { data: designs, loading, error, reload } = useApi('/designs');

  const featured = flattenDesigns(designs)
    .filter((d) => d.group === 'adult')
    .filter((d) => FEATURED_DESIGN_FILES.some((file) => d.image === `/assets/designs/adult/${file}`))
    .sort((a, b) => a.image.localeCompare(b.image));

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__inner">
          <img src={LOGO_URL} alt="" className="hero__logo" />
          <h1 className="hero__slogan">Rainbow Design bringt Farbe in Regentage</h1>
        </div>
      </section>

      <section className="section" aria-labelledby="kategorien-titel">
        <div className="container">
          <h2 id="kategorien-titel" className="section__title">
            Kategorien
          </h2>
          <ul className="category-tiles">
            {CATEGORY_TILES.map((tile) => (
              <li key={tile.to}>
                <Link to={tile.to} className="category-tile">
                  <img src={assetUrl(tile.image)} alt="" className="category-tile__image" />
                  <span className="category-tile__label">{tile.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tinted" aria-labelledby="dein-design-titel">
        <div className="container">
          <h2 id="dein-design-titel" className="section__title">
            Dein Design
          </h2>
          <div className="design-teaser">
            <div className="design-teaser__text">
              <p className="design-teaser__headline">Dein Regenmantel, dein Design.</p>
              <p>Finde dein Lieblingsmotiv und mach deinen Regenmantel einzigartig.</p>
              <Link to="/dein-design" className="btn btn--primary">
                Dein Design gestalten
              </Link>
            </div>
            <div className="design-teaser__motifs">
              {loading && <Loading text="Motive werden geladen …" />}
              {error && <ErrorMessage error={error} onRetry={reload} />}
              {!loading && !error && (
                <ul className="motif-row">
                  {featured.map((design) => (
                    <li key={design.id}>
                      <Link
                        to={`/dein-design?motiv=${encodeURIComponent(design.id)}`}
                        className="motif-thumb"
                        aria-label={`${design.label} für Dein Design auswählen`}
                      >
                        <img src={assetUrl(design.image)} alt="" loading="lazy" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="ueber-uns" className="section about" aria-labelledby="ueber-uns-titel" tabIndex={-1}>
        <div className="container container--narrow">
          <h2 id="ueber-uns-titel" className="section__title">
            Über uns
          </h2>
          <p className="about__text">
            Rainbow.design steht für handgefertigte Regenmäntel mit individuellen Details. Farben, Rückenmotive und
            liebevoll gestaltete Taschen machen jedes Stück besonders.
          </p>
        </div>
      </section>
    </div>
  );
}
