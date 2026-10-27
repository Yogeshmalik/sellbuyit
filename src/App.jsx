import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { Suspense, lazy, useState } from "react";
import Brand from "./components/Brand.jsx";

const CalculatorPage = lazy(() => import("./pages/CalculatorPage.jsx"));

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r=".9" className="fill" />
    </svg>
  );
}

function MenuIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <BrowserRouter>
      <header className="topbar">
        <div className="topbar__inner">
          <Brand />
          <button
            className="mobile-nav-toggle"
            type="button"
            aria-label={
              mobileNavOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-controls="primary-navigation"
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <MenuIcon open={mobileNavOpen} />
          </button>
          <nav
            id="primary-navigation"
            className={`topbar__nav${mobileNavOpen ? " is-open" : ""}`}
            aria-label="Main navigation"
          >
            <NavLink to="/calculator" onClick={closeMobileNav}>
              Stock Sale
            </NavLink>
            <NavLink to="/target-profit" onClick={closeMobileNav}>
              Target Profit
            </NavLink>
            <NavLink to="/maximum-buy-price" onClick={closeMobileNav}>
              Maximum Buy
            </NavLink>
            <a href="#about" onClick={closeMobileNav}>
              About
            </a>
          </nav>
        </div>
      </header>

      <Suspense
        fallback={
          <main className="page-loading" role="status">
            Loading calculator…
          </main>
        }
      >
        <Routes>
          <Route path="*" element={<CalculatorPage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route
            path="/target-profit"
            element={<CalculatorPage kind="target" />}
          />
          <Route
            path="/maximum-buy-price"
            element={<CalculatorPage kind="maximum" />}
          />
        </Routes>
      </Suspense>

      <footer className="site-footer" id="about">
        <div className="site-footer__inner">
          {/* Top Row: Brand & Developer Credit */}
          <div className="site-footer__top">
            <Brand location="footer" />
            <a
              className="site-footer__credit"
              href="https://instagram.com/thesixftperspective"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Made by Yogesh SM on Instagram (opens in a new tab)"
            >
              <InstagramIcon />
              <span>
                Made by <strong>Yogesh SM</strong>
              </span>
            </a>
          </div>
          
          {/* Bottom Row: Disclaimer & Copyright */}
          <div className="site-footer__bottom">
            <p className="site-footer__disclaimer">
              Estimates use configured broker charges and Indian market/tax
              rules. Verify final amounts against your contract note and
              applicable tax rules.
            </p>
            <p className="site-footer__copyright">
              © {new Date().getFullYear()} SellBuyIt <span aria-hidden="true">·</span> Trade smarter. Calculate clearer.
            </p>
          </div>
        </div>
      </footer>
    </BrowserRouter>
  );
}

export default App;