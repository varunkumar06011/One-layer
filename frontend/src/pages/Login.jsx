import { useAuth } from '../context/AuthContext.jsx'
import { Link } from 'react-router-dom'
import logoImg from '../assets/logo/one-layer-logo.jpeg'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

export default function Login() {
  const { signInWithGoogle, user } = useAuth()

  if (user) {
    return (
      <div className="container section text-center">
        <img src={logoImg} alt="ONE LAYER" style={{ maxWidth: '200px', margin: '0 auto 2rem' }} />
        <h1>You're already signed in.</h1>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          Welcome back. Your account is ready.
        </p>
        <Link to="/account" className="btn btn-primary">Go to My Account</Link>
      </div>
    )
  }

  return (
    <div className="container section text-center">
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <img src={logoImg} alt="ONE LAYER" style={{ maxWidth: '200px', margin: '0 auto 2rem' }} />
        <h1 style={{ marginBottom: '0.5rem' }}>Sign in to ONE LAYER</h1>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>
          Access your orders, wishlist, addresses, and more.
        </p>
        <button
          onClick={signInWithGoogle}
          className="btn btn-outline btn-full"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1rem 2rem'
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <p className="text-muted" style={{ fontSize: '0.8125rem', marginTop: '1.5rem' }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
        <Link to="/" className="btn btn-ghost btn-full" style={{ marginTop: '1rem' }}>
          Back to home
        </Link>
      </div>
    </div>
  )
}
