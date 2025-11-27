import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";
import { formatCompact, formatCurrency } from "../../utils/formatters";
import { useAlerts } from "../../context/AlertContext";
import { useTranslation } from "react-i18next";
import { useFavorites } from "../../context/FavoritesContext";

export default function MarketPage() {
  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("top10"); // "top10" | "all"
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { currency, theme } = useSettings();
  const { evaluatePriceAlerts } = useAlerts();
  const { favorites, toggleFavorite } = useFavorites();
  const { t } = useTranslation();
  const isLight = theme === "light";

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get("http://localhost:3100/market");
      setCoins(res.data);
    } catch (e) {
      console.error(e);
      setError(t("market.error"));
      setCoins([]);
      setFilteredCoins([]);
    } finally {
      setLoading(false);
    }
  }

  // prvi load
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (coins.length === 0) return;
    evaluatePriceAlerts(coins, currency);
  }, [coins, currency, evaluatePriceAlerts]);

  // filtriranje po search + top10/all
  useEffect(() => {
    let list = coins;

    if (search.trim() !== "") {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }

    if (viewMode === "top10") {
      list = list.slice(0, 10);
    }

    if (showFavoritesOnly) {
      list = list.filter((c) => favorites.includes(c.id));
    }

    setFilteredCoins(list);
  }, [coins, search, viewMode, showFavoritesOnly, favorites]);

  const metrics = useMemo(() => {
    const totalMarketCap = coins.reduce((sum, c) => sum + (c.market_cap || 0), 0);
    const totalVolume = coins.reduce((sum, c) => sum + (c.total_volume || 0), 0);
    const btc = coins.find((c) => c.id === "bitcoin");
    const eth = coins.find((c) => c.id === "ethereum");
    const dominance = totalMarketCap > 0 && btc ? (btc.market_cap / totalMarketCap) * 100 : null;
    const ethDominance = totalMarketCap > 0 && eth ? (eth.market_cap / totalMarketCap) * 100 : null;

    return { totalMarketCap, totalVolume, dominance, ethDominance };
  }, [coins]);

  const topMovers = useMemo(() => {
    return [...filteredCoins]
      .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
      .slice(0, 6);
  }, [filteredCoins]);

  const heroTone = isLight
    ? "glass-panel border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-100 text-slate-900"
    : "glass-panel border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-950/70 text-white";
  const chipText = isLight ? "text-slate-700" : "text-slate-200";
  const chipBorder = isLight ? "border-slate-200" : "border-white/10";
  const chipBg = isLight ? "bg-white/80" : "bg-white/5";

  return (
    <div className={`space-y-8 ${isLight ? "text-slate-900" : "text-white"}`}>
      <div className={`${heroTone} p-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.3em] ${isLight ? "text-cyan-600" : "text-cyan-200/70"}`}>
              {t("market.heroTag")}
            </p>
            <h1 className="text-3xl font-bold md:text-4xl">{t("market.heroTitle")}</h1>
            <p className={`mt-2 max-w-2xl text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              {t("market.heroSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span
              className={`rounded-full border px-3 py-1 text-emerald-700 ${
                isLight
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {t("market.badgeRealtime")}
            </span>
            <span className={`rounded-full border px-3 py-1 ${chipBorder} ${chipBg} ${chipText}`}>
              {t("market.badgeQuotes", { currency })}
            </span>
            <span
              className={`rounded-full border px-3 py-1 ${
                isLight
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-blue-400/30 bg-blue-500/10 text-blue-200"
              }`}
            >
              {t("market.badgeProTable")}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className={`rounded-2xl border p-4 shadow-inner ${
              isLight
                ? "border-slate-200 bg-white text-slate-900 shadow-slate-200/60"
                : "border-white/10 bg-white/5 shadow-black/30"
            }`}
          >
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {t("market.metrics.totalMarketCap")}
            </p>
            <p className="text-2xl font-semibold text-glow">{formatCompact(metrics.totalMarketCap, currency)}</p>
          </div>
          <div
            className={`rounded-2xl border p-4 shadow-inner ${
              isLight
                ? "border-slate-200 bg-white text-slate-900 shadow-slate-200/60"
                : "border-white/10 bg-white/5 shadow-black/30"
            }`}
          >
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {t("market.metrics.totalVolume")}
            </p>
            <p className="text-2xl font-semibold">{formatCompact(metrics.totalVolume, currency)}</p>
          </div>
          <div
            className={`rounded-2xl border p-4 shadow-inner ${
              isLight
                ? "border-slate-200 bg-white text-slate-900 shadow-slate-200/60"
                : "border-white/10 bg-white/5 shadow-black/30"
            }`}
          >
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {t("market.metrics.btcDominance")}
            </p>
            <p className="text-2xl font-semibold text-emerald-500">
              {metrics.dominance ? `${metrics.dominance.toFixed(2)}%` : "-"}
            </p>
          </div>
          <div
            className={`rounded-2xl border p-4 shadow-inner ${
              isLight
                ? "border-slate-200 bg-white text-slate-900 shadow-slate-200/60"
                : "border-white/10 bg-white/5 shadow-black/30"
            }`}
          >
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {t("market.metrics.ethDominance")}
            </p>
            <p className="text-2xl font-semibold text-blue-500">
              {metrics.ethDominance ? `${metrics.ethDominance.toFixed(2)}%` : "-"}
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400">{error}</p>}
      {loading && <p className="text-gray-400">{t("market.loading")}</p>}

      <div
        className={`glass-panel p-4 sm:p-6 ${
          isLight ? "border-slate-200/80 bg-white/90 text-slate-900" : "border-white/10 bg-white/5"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div
            className={`flex flex-1 items-center gap-3 rounded-full border px-4 py-2 shadow-inner ${
              isLight
                ? "border-slate-200 bg-white text-slate-900 shadow-slate-200/60"
                : "border-white/10 bg-slate-900/70 text-white shadow-black/30"
            }`}
          >
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.65 6.65a7.5 7.5 0 0 0 10.6 10.6Z" />
            </svg>
            <input
              type="text"
              placeholder={t("common.searchPlaceholder")}
              className={`w-full bg-transparent text-sm placeholder:text-slate-500 focus:outline-none ${
                isLight ? "text-slate-900" : "text-white"
              }`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`inline-flex rounded-full border p-1 text-xs font-semibold shadow-inner ${
                isLight
                  ? "border-slate-200 bg-white shadow-slate-200/60"
                  : "border-white/10 bg-slate-900/70 shadow-black/30"
              }`}
            >
                {[
                  { key: "top10", label: t("market.segment.top10") },
                  { key: "all", label: t("market.segment.all") },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setViewMode(option.key)}
                    className={`rounded-full px-4 py-2 transition ${
                      viewMode === option.key
                        ? isLight
                          ? "bg-cyan-100 text-cyan-900 shadow-sm shadow-cyan-300/40"
                          : "bg-white text-slate-900 shadow-sm shadow-cyan-500/30"
                        : isLight
                        ? "text-slate-700 hover:text-cyan-800"
                        : "text-slate-200 hover:text-white"
                    }`}
                  >
                  {option.label}
                </button>
              ))}
            </div>

            <label
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
                isLight
                  ? "border-slate-200 bg-white text-slate-800"
                  : "border-white/10 bg-slate-900/70 text-slate-200"
              }`}
            >
              <input
                type="checkbox"
                checked={showFavoritesOnly}
                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                className="h-4 w-4 accent-cyan-500"
              />
              {t("market.showFavorites")}
            </label>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topMovers.map((coin) => {
            const change24h = coin.price_change_percentage_24h;
            const isUp = change24h > 0;
            return (
              <div
                key={coin.id}
                className={`group cursor-pointer rounded-2xl border p-4 transition hover:-translate-y-1 hover:shadow-lg ${
                  isLight
                    ? "border-slate-200 bg-white hover:border-cyan-200 hover:shadow-cyan-200/40"
                    : "border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-950/70 hover:border-cyan-400/40 hover:shadow-cyan-500/20"
                }`}
                onClick={() => navigate(`/coin/${coin.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={coin.image} alt={coin.name} className="h-10 w-10 rounded-full" />
                    <div>
                      <p className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{coin.name}</p>
                      <p className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        {coin.symbol}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isUp
                        ? isLight
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-emerald-500/15 text-emerald-300"
                        : isLight
                        ? "bg-rose-50 text-rose-700"
                        : "bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    {change24h?.toFixed(2)}%
                  </span>
                </div>
                <div className={`mt-3 text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                  {formatCurrency(coin.current_price, currency)}
                </div>
                <div className={`mt-2 flex items-center justify-between text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  <span>{t("market.labels.marketCap")}</span>
                  <span className={`font-semibold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                    {formatCompact(coin.market_cap, currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`mt-8 rounded-2xl border ${
            isLight ? "border-slate-200 bg-white" : "border-white/10 bg-slate-950/60"
          }`}
        >
          <div
            className={`flex items-center justify-between border-b px-4 py-3 text-sm ${
              isLight ? "border-slate-100 text-slate-800" : "border-white/5 text-slate-200"
            }`}
          >
            <p className="font-semibold">{t("market.table.title")}</p>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
              {t("market.table.hint")}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className={`${isLight ? "bg-slate-50 text-slate-600" : "bg-white/5 text-slate-300"}`}>
                <tr>
                  <th className="px-3 py-3 text-left">{t("market.table.headers.rank")}</th>
                  <th className="px-3 py-3 text-left">{t("market.table.headers.name")}</th>
                  <th className="px-3 py-3 text-right">{t("market.table.headers.price")}</th>
                  <th className="px-3 py-3 text-right">{t("market.table.headers.change")}</th>
                  <th className="px-3 py-3 text-right">{t("market.table.headers.marketCap")}</th>
                  <th className="px-3 py-3 text-right">{t("market.table.headers.volume")}</th>
                  <th className="px-3 py-3 text-right">{t("market.table.headers.favorite")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoins.map((coin, idx) => {
                  const change24h = coin.price_change_percentage_24h;
                  const changeColor =
                    change24h > 0
                      ? isLight
                        ? "text-emerald-600"
                        : "text-emerald-400"
                      : change24h < 0
                      ? isLight
                        ? "text-rose-600"
                        : "text-rose-400"
                      : isLight
                      ? "text-slate-700"
                      : "text-slate-200";

                  return (
                    <tr
                      key={coin.id}
                      className={`${
                        isLight
                          ? "border-b border-slate-100 bg-white hover:bg-slate-50"
                          : "border-b border-white/5 bg-slate-950/40 hover:bg-slate-900/60"
                      } cursor-pointer`}
                      onClick={() => navigate(`/coin/${coin.id}`)}
                    >
                      <td className="px-3 py-3">{coin.market_cap_rank ?? idx + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <img src={coin.image} alt={coin.name} className="h-7 w-7 rounded-full" />
                          <div>
                            <div className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{coin.name}</div>
                            <div className={`text-xs uppercase tracking-wide ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                              {coin.symbol}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-3 py-3 text-right ${isLight ? "text-slate-900" : "text-white"}`}>
                        {formatCurrency(coin.current_price, currency)}
                      </td>
                      <td className={`px-3 py-3 text-right ${changeColor}`}>{change24h?.toFixed(2)}%</td>
                      <td className={`px-3 py-3 text-right ${isLight ? "text-slate-900" : "text-white"}`}>
                        {formatCompact(coin.market_cap, currency)}
                      </td>
                      <td className={`px-3 py-3 text-right ${isLight ? "text-slate-900" : "text-white"}`}>
                        {formatCompact(coin.total_volume, currency)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(coin.id);
                          }}
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-lg transition hover:-translate-y-0.5 ${
                            favorites.includes(coin.id)
                              ? "border-amber-300 bg-amber-100 text-amber-500"
                              : isLight
                              ? "border-slate-200 bg-white text-slate-500 hover:text-amber-500"
                              : "border-white/10 bg-white/5 text-slate-300 hover:text-amber-400"
                          }`}
                          aria-label={t("market.table.favoriteAction")}
                        >
                          {favorites.includes(coin.id) ? "★" : "☆"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredCoins.length === 0 && !loading && (
                  <tr>
                    <td className={`px-3 py-4 text-center ${isLight ? "text-slate-500" : "text-gray-400"}`} colSpan={6}>
                      {t("market.table.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
