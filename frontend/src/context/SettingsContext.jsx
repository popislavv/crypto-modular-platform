import { createContext, useContext, useEffect, useMemo, useState } from "react";
import i18n from "../i18n";

const SettingsContext = createContext(null);

const STORAGE_KEYS = {
  refreshInterval: "refreshInterval",
  chartRange: "defaultChartRange",
  currency: "defaultCurrency",
  theme: "theme",
  language: "lang",
};

const DEFAULTS = {
  refreshInterval: 60,
  chartRange: "7d",
  currency: "USD",
  theme: "dark",
  language: "en",
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

  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.language);
    return saved || DEFAULTS.language;
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
    localStorage.setItem(STORAGE_KEYS.language, language);
    i18n.changeLanguage(language);
  }, [language]);

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
      language,
      setLanguage,
    }),
    [refreshInterval, chartRange, currency, theme, language]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

