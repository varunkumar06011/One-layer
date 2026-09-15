import { Link } from 'react-router-dom'
import logoImg from '../assets/logo/one-layer-logo.jpeg'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src={logoImg} alt="ONE LAYER" className="footer-logo" />
            <p className="text-muted">
              A calm, considered apparel studio.
              <br />One clean layer of fabric. One clean layer of identity.
            </p>
          </div>

          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop">All Tees</Link></li>
              <li><Link to="/product/collar-polo">Collar Polo</Link></li>
              <li><Link to="/product/neckless-round">Neckless Round</Link></li>
              <li><Link to="/product/oversized-printed">Oversized Printed</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Studio</h4>
            <ul>
              <li><Link to="/customize">Customize Your Own</Link></li>
              <li><Link to="/companies">For Companies</Link></li>
              <li><Link to="/about">About</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:hello@onelayer.in">hello@onelayer.in</a></li>
              <li><a href="https://www.instagram.com/onelayer000?stkn=bTZqN3duaTg0Y3Vw" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="https://wa.me/9391798370" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="text-muted">
            (c) {new Date().getFullYear()} ONE LAYER. All rights reserved.
          </p>
          <p className="text-muted">Designed in India. Made with intention.</p>
        </div>
      </div>
    </footer>
  )
}
