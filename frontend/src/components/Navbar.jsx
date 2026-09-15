import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import logoImg from '../assets/logo/one-layer-logo.jpeg'

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { itemCount } = useCart()
  const { user } = useAuth()
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

        <div className="nav-right">
          <Link to={user ? '/account' : '/login'} className="nav-account" onClick={() => setOpen(false)} aria-label="Account">
            <span className="nav-account-icon">
              <UserIcon />
            </span>
          </Link>
          <Link to="/cart" className="nav-cart" onClick={() => setOpen(false)} aria-label="Cart">
            <span className="nav-cart-icon">
              <CartIcon />
            </span>
            <span className="nav-cart-label">Cart</span>
            {itemCount > 0 && <span className="nav-cart-count">{itemCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  )
}
