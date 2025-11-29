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

### Backend
cd backend  
npm install  
npm run dev

### Frontend
cd frontend  
npm install  
npm run dev

---

## 📩 Chat Email Setup

Create `.env` inside `/backend`:

GMAIL_USER=your@gmail.com  
GMAIL_PASS=your_app_password  

SMTP_HOST=smtp.gmail.com  
SMTP_PORT=587  
SMTP_USER=your@gmail.com  
SMTP_PASS=your_app_password  
SMTP_FROM=your@gmail.com  

(Gmail App Password required)

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
