import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import MarketPage from "./modules/market/MarketPage";
import WalletPage from "./modules/wallet/WalletPage.jsx";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import SettingsPage from "./modules/settings/SettingsPage.jsx";
import CoinDetailPage from "./modules/market/CoinDetailPage";


function App() {
  return (
  <BrowserRouter>
    <nav className="p-4 bg-gray-900 text-white flex gap-4">
      <Link to="/">Market</Link> | <Link to="/wallet">Wallet</Link> |  <Link to="/settings">Settings</Link>
    </nav>

    <Routes>
      <Route path="/" element={<MarketPage />} />
      <Route path="/wallet" element={<WalletPage />} />
      <Route path="/coin/:id" element={<CoinDetailPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  </BrowserRouter>
  );
}

export default App
