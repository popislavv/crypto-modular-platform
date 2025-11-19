import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

export default function CoinCandleChart({ data }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!chartRef.current) {
      const chart = createChart(containerRef.current, {
        layout: {
          background: { color: "#020617" }, // bg-gray-950
          textColor: "#e5e7eb", // text-gray-200
        },
        grid: {
          vertLines: { color: "#1f2933" },
          horzLines: { color: "#1f2933" },
        },
        width: containerRef.current.clientWidth,
        height: 300,
        crosshair: {
          mode: 1,
        },
        timeScale: {
          borderColor: "#374151",
        },
        rightPriceScale: {
          borderColor: "#374151",
        },
      });

      let series;

      // pokušaj candlestick, fallback na line ako ne postoji
      if (typeof chart.addCandlestickSeries === "function") {
        series = chart.addCandlestickSeries({
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        });
      } else if (typeof chart.addLineSeries === "function") {
        console.warn(
          "[CoinCandleChart] Candlestick serije nisu dostupne, koristim line chart fallback."
        );
        series = chart.addLineSeries({
          color: "#3b82f6",
          lineWidth: 2,
        });
      }

      chartRef.current = chart;
      seriesRef.current = series;

      const handleResize = () => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: containerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
      };
    }
  }, []);

  useEffect(() => {
    if (
      seriesRef.current &&
      Array.isArray(data) &&
      data.length > 0 &&
      chartRef.current
    ) {
      seriesRef.current.setData(data);
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-gray-900 rounded border border-gray-700"
    />
  );
}
