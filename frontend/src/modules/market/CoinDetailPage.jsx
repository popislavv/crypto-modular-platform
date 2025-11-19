import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const RANGE_OPTIONS = ["1d", "7d", "30d", "1y"];
const RANGE_TO_DAYS = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  "1y": 365,
};

export default function CoinDetailPage() {
  const { id } = useParams(); // npr. "bitcoin"
  const [coin, setCoin] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState("7d");
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartError, setChartError] = useState(null);

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
        if (range === "1d") {
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


  return (
    <div className="page text-white bg-gray-950 min-h-screen">
      <Link to="/" className="text-blue-400 hover:underline text-sm">
        ← Back to market
      </Link>

      {loading && <p className="mt-4 text-gray-400">Loading coin data...</p>}
      {error && <p className="mt-4 text-red-400">{error}</p>}

      {coin && (
        <>
          <div className="flex items-center gap-3 mt-4 mb-4">
            <img
              src={coin.image?.small}
              alt={coin.name}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold">
                {coin.name} ({coin.symbol.toUpperCase()})
              </h1>
              {coin.market_data && (
                <p className="text-xl text-gray-100">
                  ${coin.market_data.current_price.usd.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {coin.market_data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <p className="text-xs text-gray-400">Market Cap</p>
                <p className="text-lg">
                  ${coin.market_data.market_cap.usd.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <p className="text-xs text-gray-400">24h Change</p>
                <p
                  className={
                    "text-lg " +
                    (coin.market_data.price_change_percentage_24h > 0
                      ? "text-green-400"
                      : coin.market_data.price_change_percentage_24h < 0
                      ? "text-red-400"
                      : "text-gray-200")
                  }
                >
                  {coin.market_data.price_change_percentage_24h.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <p className="text-xs text-gray-400">Circulating Supply</p>
                <p className="text-lg">
                  {coin.market_data.circulating_supply.toLocaleString()}{" "}
                  {coin.symbol.toUpperCase()}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* range toggle + chart */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">Price chart</h2>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={
                "px-3 py-1 rounded text-xs " +
                (range === r
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300")
              }
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {chartLoading && (
        <p className="text-gray-400 mb-2">Loading chart data...</p>
      )}
      {chartError && <p className="text-red-400 mb-2">{chartError}</p>}

      {chartData.length > 0 ? (
        <div className="w-full h-64 bg-gray-900 rounded border border-gray-700 p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" hide={chartData.length > 40} />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => v.toFixed(0)}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="price"
                dot={false}
                strokeWidth={2}
                stroke="#3b82f6"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        !chartLoading &&
        !chartError && (
          <p className="text-gray-400">No chart data available.</p>
        )
      )}

      <p className="mt-2 text-xs text-gray-500">
        Data source: CoinGecko API
      </p>
    </div>
  );
}
