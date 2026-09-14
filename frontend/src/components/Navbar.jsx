import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import logoImg from '../assets/logo/one-layer-logo.jpeg'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { itemCount } = useCart()
  const { pathname } = useLocation()

  const links = [
    { to: '/shop', label: 'Shop' },
    { to: '/customize', label: 'Customize' },
    { to: '/companies', label: 'For Companies' },
    { to: '/about', label: 'About' },
  ]

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button className="nav-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
          <span className={`nav-toggle-line ${open ? 'open' : ''}`}></span>
          <span className={`nav-toggle-line ${open ? 'open' : ''}`}></span>
        </button>

        <Link to="/" className="nav-logo" onClick={() => setOpen(false)}>
          <img src={logoImg} alt="ONE LAYER" className="nav-logo-img"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }}
          />
          <span className="nav-logo-text" style={{ display: 'none' }}>ONE LAYER</span>
        </Link>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link ${pathname === l.to ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link to="/cart" className="nav-cart" onClick={() => setOpen(false)}>
          <span className="nav-cart-label">Cart</span>
          {itemCount > 0 && <span className="nav-cart-count">{itemCount}</span>}
        </Link>
      </div>
    </header>
  )
}
