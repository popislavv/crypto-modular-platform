import { createContext, useContext, useEffect, useMemo, useState } from "react";

const SettingsContext = createContext(null);

const STORAGE_KEYS = {
  refreshInterval: "refreshInterval",
  chartRange: "defaultChartRange",
  currency: "defaultCurrency",
  theme: "theme",
};

const DEFAULTS = {
  refreshInterval: 60,
  chartRange: "7d",
  currency: "USD",
  theme: "dark",
};

export function SettingsProvider({ children }) {
  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.refreshInterval);
    return saved ? Number(saved) || DEFAULTS.refreshInterval : DEFAULTS.refreshInterval;
  });

  const [chartRange, setChartRange] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.chartRange);
    return saved || DEFAULTS.chartRange;
  });

  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.currency);
    return saved || DEFAULTS.currency;
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.theme);
    return saved || DEFAULTS.theme;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.refreshInterval, String(refreshInterval));
  }, [refreshInterval]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.chartRange, chartRange);
  }, [chartRange]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.currency, currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("theme-light");
    } else {
      root.classList.remove("theme-light");
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      refreshInterval,
      setRefreshInterval,
      chartRange,
      setChartRange,
      currency,
      setCurrency,
      theme,
      setTheme,
    }),
    [refreshInterval, chartRange, currency, theme]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

