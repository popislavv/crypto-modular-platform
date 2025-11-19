import './App.css'
import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import MarketPage from "./modules/market/MarketPage";
import WalletPage from "./modules/wallet/WalletPage.jsx";
import SettingsPage from "./modules/settings/SettingsPage.jsx";
import CoinDetailPage from "./modules/market/CoinDetailPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-lg font-bold text-slate-950 shadow-lg">
                CM
              </div>
              <div className="leading-tight">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Crypto</p>
                <p className="text-lg font-semibold text-white">Modular Platform</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 shadow-lg shadow-cyan-500/5 md:flex">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition ${
                    isActive
                      ? "bg-white text-slate-900 shadow-md shadow-cyan-500/20"
                      : "text-slate-200 hover:text-white"
                  }`
                }
              >
                Market
              </NavLink>
              <NavLink
                to="/wallet"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition ${
                    isActive
                      ? "bg-white text-slate-900 shadow-md shadow-cyan-500/20"
                      : "text-slate-200 hover:text-white"
                  }`
                }
              >
                Wallet
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition ${
                    isActive
                      ? "bg-white text-slate-900 shadow-md shadow-cyan-500/20"
                      : "text-slate-200 hover:text-white"
                  }`
                }
              >
                Settings
              </NavLink>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/wallet"
                className="hidden rounded-full border border-cyan-400/50 bg-white/5 px-4 py-2 text-sm font-semibold text-cyan-200 shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:shadow-lg md:inline-flex"
              >
                Connect Wallet
              </Link>
              <Link
                to="/"
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5"
              >
                Deposit
              </Link>
            </div>
          </div>
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
    </BrowserRouter>
  );
}

export default App
