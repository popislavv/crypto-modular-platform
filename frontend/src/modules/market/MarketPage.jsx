import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function formatNumber(value) {
  if (!value && value !== 0) return "-";
  if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toLocaleString();
}

export default function MarketPage() {
  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("top10"); // "top10" | "all"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get("http://localhost:3100/market");
      setCoins(res.data);
    } catch (e) {
      console.error(e);
      setError("Trenutno nije moguće učitati podatke o tržištu. Pokušaj kasnije.");
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

    setFilteredCoins(list);
  }, [coins, search, viewMode]);

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

  return (
    <div className="space-y-8 text-white">
      <div className="glass-panel border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-950/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Live Markets</p>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Crypto Market Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Premium kartični layout sa KPI karticama, segment kontrolama i pro tabelom — baš kao na savremenim kripto platformama.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">Real-time</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">USD quotes</span>
            <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-blue-200">Pro table</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/30">
            <p className="text-xs text-slate-400">Total market cap</p>
            <p className="text-2xl font-semibold text-glow text-white">${formatNumber(metrics.totalMarketCap)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/30">
            <p className="text-xs text-slate-400">24h volume</p>
            <p className="text-2xl font-semibold text-white">${formatNumber(metrics.totalVolume)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/30">
            <p className="text-xs text-slate-400">BTC dominance</p>
            <p className="text-2xl font-semibold text-emerald-300">
              {metrics.dominance ? `${metrics.dominance.toFixed(2)}%` : "-"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/30">
            <p className="text-xs text-slate-400">ETH dominance</p>
            <p className="text-2xl font-semibold text-blue-300">
              {metrics.ethDominance ? `${metrics.ethDominance.toFixed(2)}%` : "-"}
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400">{error}</p>}
      {loading && <p className="text-gray-400">Loading market data...</p>}

      <div className="glass-panel border border-white/10 bg-white/5 p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 shadow-inner shadow-black/30">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.65 6.65a7.5 7.5 0 0 0 10.6 10.6Z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or symbol..."
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="inline-flex rounded-full border border-white/10 bg-slate-900/70 p-1 text-xs font-semibold shadow-inner shadow-black/30">
            {[
              { key: "top10", label: "Top 10" },
              { key: "all", label: "All" },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setViewMode(option.key)}
                className={`rounded-full px-4 py-2 transition ${
                  viewMode === option.key
                    ? "bg-white text-slate-900 shadow-sm shadow-cyan-500/30"
                    : "text-slate-200 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topMovers.map((coin) => {
            const change24h = coin.price_change_percentage_24h;
            const isUp = change24h > 0;
            return (
              <div
                key={coin.id}
                className="group cursor-pointer rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-950/70 p-4 transition hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-cyan-500/20"
                onClick={() => navigate(`/coin/${coin.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={coin.image} alt={coin.name} className="h-10 w-10 rounded-full" />
                    <div>
                      <p className="font-semibold text-white">{coin.name}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{coin.symbol}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isUp
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-rose-500/10 text-rose-300"
                    }`}
                  >
                    {change24h?.toFixed(2)}%
                  </span>
                </div>
                <div className="mt-3 text-2xl font-bold text-white">
                  ${coin.current_price.toLocaleString()}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <span>Market cap</span>
                  <span className="font-semibold text-slate-200">${formatNumber(coin.market_cap)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/60">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 text-sm text-slate-200">
            <p className="font-semibold">Pro market table</p>
            <p className="text-xs text-slate-400">Scroll for full depth</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-3 py-3 text-left">#</th>
                  <th className="px-3 py-3 text-left">Name</th>
                  <th className="px-3 py-3 text-right">Price</th>
                  <th className="px-3 py-3 text-right">24h %</th>
                  <th className="px-3 py-3 text-right">Market Cap</th>
                  <th className="px-3 py-3 text-right">Volume 24h</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoins.map((coin, idx) => {
                  const change24h = coin.price_change_percentage_24h;
                  const changeColor =
                    change24h > 0
                      ? "text-emerald-400"
                      : change24h < 0
                      ? "text-rose-400"
                      : "text-slate-200";

                  return (
                    <tr
                      key={coin.id}
                      className="border-b border-white/5 bg-slate-950/40 hover:bg-slate-900/60"
                      onClick={() => navigate(`/coin/${coin.id}`)}
                    >
                      <td className="px-3 py-3">{coin.market_cap_rank ?? idx + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <img src={coin.image} alt={coin.name} className="h-7 w-7 rounded-full" />
                          <div>
                            <div className="font-semibold text-white">{coin.name}</div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">
                              {coin.symbol}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-white">
                        ${coin.current_price.toLocaleString()}
                      </td>
                      <td className={`px-3 py-3 text-right ${changeColor}`}>{change24h?.toFixed(2)}%</td>
                      <td className="px-3 py-3 text-right text-white">${formatNumber(coin.market_cap)}</td>
                      <td className="px-3 py-3 text-right text-white">${formatNumber(coin.total_volume)}</td>
                    </tr>
                  );
                })}

                {filteredCoins.length === 0 && !loading && (
                  <tr>
                    <td className="px-3 py-4 text-center text-gray-400" colSpan={6}>
                      No coins to display.
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
