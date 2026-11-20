import { Link } from 'react-router-dom';
import { LOGO_URL } from '../api';
import { FACEBOOK_URL, INSTAGRAM_URL, MAIN_LINKS } from '../siteLinks';
import { FacebookIcon, InstagramIcon } from './Icons';

export function SocialLinks({ className = '' }) {
  return (
    <ul className={`social-links ${className}`}>
      <li>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          <InstagramIcon size={22} />
          <span>Instagram</span>
          <span className="visually-hidden"> (öffnet in neuem Tab)</span>
        </a>
      </li>
      <li>
        <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
          <FacebookIcon size={22} />
          <span>Facebook</span>
          <span className="visually-hidden"> (öffnet in neuem Tab)</span>
        </a>
      </li>
    </ul>
  );
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <Link to="/" className="site-footer__logo" aria-label="Rainbow.design – zur Startseite">
          <img src={LOGO_URL} alt="Rainbow.design" />
        </Link>
        <nav aria-label="Footer-Navigation" className="site-footer__nav">
          <ul>
            {MAIN_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <SocialLinks className="site-footer__social" />
      </div>
      <p className="site-footer__copyright">© Rainbow.design</p>
    </footer>
  );
}
