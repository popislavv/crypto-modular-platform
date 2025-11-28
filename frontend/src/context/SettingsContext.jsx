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

const readSetting = (key, fallback, transform) => {
  const stored = localStorage.getItem(key);
  if (stored === null || stored === undefined) return fallback;
  return transform ? transform(stored) : stored;
};

export function SettingsProvider({ children }) {
  const [refreshInterval, setRefreshInterval] = useState(() =>
    readSetting(STORAGE_KEYS.refreshInterval, DEFAULTS.refreshInterval, (value) => Number(value) || DEFAULTS.refreshInterval)
  );

  const [chartRange, setChartRange] = useState(() =>
    readSetting(STORAGE_KEYS.chartRange, DEFAULTS.chartRange)
  );

  const [currency, setCurrency] = useState(() =>
    readSetting(STORAGE_KEYS.currency, DEFAULTS.currency)
  );

  const [theme, setTheme] = useState(() =>
    readSetting(STORAGE_KEYS.theme, DEFAULTS.theme)
  );

  const [language, setLanguage] = useState(() =>
    readSetting(STORAGE_KEYS.language, DEFAULTS.language)
  );

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

