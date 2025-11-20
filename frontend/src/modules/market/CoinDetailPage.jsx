import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useSettings } from "../../context/SettingsContext";
import { formatCurrency } from "../../utils/formatters";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const RANGE_OPTIONS = ["24h", "7d", "30d", "1y"];
const RANGE_TO_DAYS = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "1y": 365,
};

export default function CoinDetailPage() {
  const { id } = useParams(); // npr. "bitcoin"
  const { chartRange, currency } = useSettings();
  const [coin, setCoin] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState(chartRange || "7d");
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartError, setChartError] = useState(null);

  useEffect(() => {
    if (chartRange && RANGE_OPTIONS.includes(chartRange)) {
      setRange(chartRange);
    }
  }, [chartRange]);

  // osnovni podaci o coinu
  useEffect(() => {
    async function loadCoin() {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`
        );
        setCoin(res.data);
      } catch (e) {
        console.error(e);
        setError("Ne mogu učitati podate za ovaj coin.");
      } finally {
        setLoading(false);
      }
    }

    loadCoin();
  }, [id]);

  // chart podaci direktno sa CoinGecko market_chart
  useEffect(() => {
    async function loadChart() {
      try {
        setChartLoading(true);
        setChartError(null);

        const days = RANGE_TO_DAYS[range];

        // Free CoinGecko → automatic interval (best available)
        const res = await axios.get(
          `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`
        );

        const points = res.data.prices.map(([ts, price]) => {
          const d = new Date(ts);

          let label;
          if (range === "24h") {
            label = d.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
          } else {
            label = d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
            });
          }

          return { time: label, price };
        });

        setChartData(points);
      } catch (e) {
        console.error(e);
        setChartData([]);
        setChartError("Trenutno nije moguće učitati chart za ovaj coin.");
      } finally {
        setChartLoading(false);
      }
    }

    loadChart();
  }, [id, range]);

  const stats = useMemo(() => {
    if (!coin?.market_data) return [];
    const md = coin.market_data;
    return [
      {
        label: "Market Cap",
        value: formatCurrency(md.market_cap.usd, currency),
        tone: "text-emerald-300",
      },
      {
        label: "24h Change",
        value: `${md.price_change_percentage_24h.toFixed(2)}%`,
        tone:
          md.price_change_percentage_24h > 0
            ? "text-emerald-300"
            : md.price_change_percentage_24h < 0
            ? "text-rose-300"
            : "text-slate-200",
      },
      {
        label: "Circulating Supply",
        value: `${md.circulating_supply.toLocaleString()} ${coin.symbol.toUpperCase()}`,
        tone: "text-slate-100",
      },
      {
        label: "24h Volume",
        value: formatCurrency(md.total_volume.usd, currency),
        tone: "text-sky-200",
      },
    ];
  }, [coin, currency]);

  return (
    <div className="space-y-6 text-white">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white"
      >
        <span className="text-lg">←</span> Back to market
      </Link>

      {loading && <p className="mt-4 text-gray-400">Loading coin data...</p>}
      {error && <p className="mt-4 text-red-400">{error}</p>}

      {coin && (
        <div className="glass-panel border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-950/70 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-white/10 p-3 shadow-inner shadow-black/30">
                <img src={coin.image?.large} alt={coin.name} className="h-12 w-12 rounded-full" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{coin.symbol}</p>
                <h1 className="text-3xl font-bold text-white">{coin.name}</h1>
                {coin.market_data && (
                  <p className="text-xl font-semibold text-emerald-300">
                    {formatCurrency(coin.market_data.current_price.usd, currency)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                Verified market data
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-slate-200">Spot pairs</span>
              <span className="rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-blue-200">On-chain</span>
            </div>
          </div>

          {coin.market_data && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/30"
                >
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className={`mt-2 text-xl font-semibold ${stat.tone}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* range toggle + chart */}
          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-xl font-semibold">Price action</h2>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 p-1 text-xs font-semibold">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-full px-4 py-2 transition ${
                    range === r
                      ? "bg-white text-slate-900 shadow-sm shadow-cyan-500/30"
                      : "text-slate-200 hover:text-white"
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {chartLoading && <p className="text-gray-400">Loading chart data...</p>}
          {chartError && <p className="text-red-400">{chartError}</p>}

          {chartData.length > 0 ? (
            <div className="mt-4 h-72 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="time" hide={chartData.length > 40} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis domain={["auto", "auto"]} stroke="#94a3b8" tickFormatter={(v) => v.toFixed(0)} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)" }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={2} fill="url(#priceGradient)" />
                  <Line type="monotone" dataKey="price" dot={false} strokeWidth={1.5} stroke="#67e8f9" strokeLinecap="round" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            !chartLoading && !chartError && <p className="text-gray-400">No chart data available.</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
            {["overview", "markets", "on-chain"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full border px-3 py-2 capitalize transition ${
                  activeTab === tab
                    ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            {activeTab === "overview" && (
              <p>
                Overview sekcija čuva kratke napomene o tržišnoj poziciji i supply metrikama — vizuelno usklađeno sa karticama iznad.
              </p>
            )}
            {activeTab === "markets" && <p>Markets tab može prikazati order book ili listu berzi.</p>}
            {activeTab === "on-chain" && <p>On-chain tab rezervisan za mrežne metrike i transakcione tokove.</p>}
          </div>

          <p className="mt-4 text-xs text-slate-500">Data source: CoinGecko API</p>
        </div>
      )}
    </div>
  );
}
