import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import ConsentModal from './components/ConsentModal.jsx'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import Product from './pages/Product.jsx'
import Customize from './pages/Customize.jsx'
import Companies from './pages/Companies.jsx'
import About from './pages/About.jsx'
import Cart from './pages/Cart.jsx'
import Admin from './pages/Admin.jsx'
import Login from './pages/Login.jsx'
import Account from './pages/Account.jsx'

export default function App() {
  return (
    <AuthProvider>
      <ConsentModal />
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/customize" element={<Customize />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/about" element={<About />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </main>
      <Footer />
    </AuthProvider>
  )
}
