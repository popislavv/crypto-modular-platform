import './App.css'
import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import MarketPage from "./modules/market/MarketPage";
import WalletPage from "./modules/wallet/WalletPage.jsx";
import SettingsPage from "./modules/settings/SettingsPage.jsx";
import CoinDetailPage from "./modules/market/CoinDetailPage";
import { SettingsProvider, useSettings } from "./context/SettingsContext";

function Shell() {
  const { theme } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLight = theme === "light";
  const wrapperBg = isLight
    ? "bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900"
    : "bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white";

  const navLinkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 transition ${
      isActive
        ? isLight
          ? "bg-slate-900 text-white shadow-md shadow-cyan-500/10"
          : "bg-white text-slate-900 shadow-md shadow-cyan-500/20"
        : isLight
        ? "text-slate-700 hover:text-slate-900"
        : "text-slate-200 hover:text-white"
    }`;

  return (
    <div className={`min-h-screen ${wrapperBg}`}>
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur ${
          isLight
            ? "border-slate-200/80 bg-white/80 text-slate-900"
            : "border-white/10 bg-slate-950/70 text-white"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/30 ${
                isLight ? "text-slate-900" : "text-slate-950"
              }`}
            >
              <svg viewBox="0 0 64 64" className="h-7 w-7">
                <defs>
                  <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#logoGradient)" opacity="0.3" />
                <path
                  d="M18 32c0-7.732 6.268-14 14-14s14 6.268 14 14-6.268 14-14 14"
                  fill="none"
                  stroke="url(#logoGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M24 32c0-4.418 3.582-8 8-8 4.418 0 8 3.582 8 8s-3.582 8-8 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Crypto</p>
              <p className="text-lg font-semibold">Modular Platform</p>
            </div>
          </Link>

          <nav
            className={`hidden items-center gap-6 rounded-full border px-3 py-2 text-sm font-medium shadow-lg shadow-cyan-500/5 md:flex ${
              isLight
                ? "border-slate-200 bg-white/70 text-slate-800"
                : "border-white/10 bg-white/5 text-slate-200"
            }`}
          >
            <NavLink to="/" className={navLinkClass}>
              Market
            </NavLink>
            <NavLink to="/wallet" className={navLinkClass}>
              Wallet
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              Settings
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/wallet"
              className={`hidden rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-lg md:inline-flex ${
                isLight
                  ? "border-cyan-400/60 bg-white text-cyan-700 shadow-cyan-200/40"
                  : "border-cyan-400/50 bg-white/5 text-cyan-200 shadow-cyan-500/10"
              }`}
            >
              Connect Wallet
            </Link>
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition md:hidden ${
                isLight
                  ? "border-slate-200 bg-white text-slate-800 shadow"
                  : "border-white/10 bg-white/5 text-white"
              }`}
              aria-label="Toggle navigation"
            >
              <span className="block h-0.5 w-5 rounded-full bg-current" />
              <span className="mt-1 block h-0.5 w-5 rounded-full bg-current" />
              <span className="mt-1 block h-0.5 w-5 rounded-full bg-current" />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            className={`md:hidden ${
              isLight
                ? "border-b border-slate-200/80 bg-white/90 text-slate-900"
                : "border-b border-white/10 bg-slate-950/90 text-white"
            }`}
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pb-4">
              {["/", "/wallet", "/settings"].map((path) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? isLight
                          ? "bg-slate-900 text-white"
                          : "bg-white text-slate-900"
                        : isLight
                        ? "bg-white/80 text-slate-700 hover:bg-slate-100"
                        : "bg-white/5 text-slate-200 hover:bg-white/10"
                    }`
                  }
                >
                  {path === "/" ? "Market" : path === "/wallet" ? "Wallet" : "Settings"}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<MarketPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/coin/:id" element={<CoinDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <Shell />
      </SettingsProvider>
    </BrowserRouter>
  );
}

export default App
