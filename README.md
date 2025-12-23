# Crypto Modular Platform

A modern modular cryptocurrency dashboard platform for tracking markets, wallets, alerts, favorites, and user preferences — built with scalability and clean architecture in mind.

---

## 🚀 Overview

**Crypto Modular Platform** is a web-based crypto dashboard that unifies market tracking, wallet analytics, alerts, and personalization into a single extensible system.

The application is architected as a **modular platform**, allowing independent feature development and easy future expansion.

---

## ✨ Features

- 📊 **Market Dashboard**
  - Live crypto prices (CoinGecko API)
  - Top 10 / All / Favorites views
  - Watchlist (⭐ Favorites)

- 👛 **Wallet Viewer**
  - Public address analysis
  - Token balances
  - Portfolio breakdown

- 🔔 **Price Alerts**
  - Custom price thresholds
  - Persistent alerts
  - UI notifications

- 🌍 **Internationalization**
  - English 🇬🇧 / Serbian 🇷🇸
  - Instant language switching

- 🌓 **Themes**
  - Light / Dark mode
  - Persistent preferences

- 💬 **Support Chat**
  - Floating chat modal
  - Chat & FAQ tabs
  - Email delivery via NodeMailer

---

## 🏗 Tech Stack

**Frontend:**  
React, Vite, TailwindCSS, React Router, Recharts, i18next

**Backend:**  
Node.js, TypeScript, Express, Axios, Nodemailer

**APIs:**  
CoinGecko

---

## ⚙️ Setup

Create `.env` inside `/backend` with the providers you plan to use:

```
# CoinGecko (optional override)
COINGECKO_BASE_URL=https://api.coingecko.com/api/v3

# Alchemy (wallet + tokens)
ALCHEMY_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Etherscan (transactions)
ETHERSCAN_KEY=your_api_key

# Email (one transport is enough)
GMAIL_USER=your@gmail.com
GMAIL_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your@gmail.com
```

### Backend

```
cd backend
npm install
npm run dev
```

### Frontend

```
cd frontend
npm install
npm run dev
```

Backend runs on `http://localhost:3100` by default; override with `PORT` if needed.

---

## 🧪 How to verify gateway + cache behavior

- **Market cache header**: `curl -i http://localhost:3100/market` → check `X-Cache: HIT/MISS`. Append `?refresh=true` to force a MISS for measurement.
- **Chart cache header**: `curl -i "http://localhost:3100/coin/bitcoin/market_chart?days=7"` → `X-Cache` indicates whether the backend served cached or fresh data.
- **Metrics snapshot**: `curl http://localhost:3100/metrics` returns counters such as `marketCacheHits`, `marketCacheMisses`, `chartCacheHits`, and the last fetch durations in milliseconds.
- **Fallback demo**: temporarily set `COINGECKO_BASE_URL` to an invalid URL or disable the network; `/market` will return the last cached payload with `X-Cache: STALE` while logging the upstream failure.
- **Error format**: any upstream/provider error uses `{ "error": { "code", "message", "provider", "hint" } }` and responds with HTTP 4xx/5xx (e.g., missing `ETHERSCAN_KEY` → `CONFIG_MISSING`).

---

## 🛣 Roadmap

- AI portfolio analytics  
- Multi-wallet support  
- Trading simulator  
- News & sentiment modules  
- Real-time price streams  
- User profiles and reports  

---

## 👤 Author

Nikola Popović  
Crypto Modular Platform

MIT License
