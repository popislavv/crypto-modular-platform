import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/SettingsContext";
import Card from "../../components/Card";
import Toast from "../../components/Toast";

export default function SettingsPage() {
  const {
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
  } = useSettings();
  const { t } = useTranslation();
  const [interval, setIntervalValue] = useState(refreshInterval);
  const [range, setRange] = useState(chartRange);
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [toast, setToast] = useState(null);
  const isLight = theme === "light";

  function save() {
    if (interval < 30) {
      setToast({ message: t("settings.intervalWarning"), variant: "warning" });
      return;
    }

    setRefreshInterval(interval);
    setChartRange(range);
    setCurrency(selectedCurrency);
    setTheme(selectedTheme);
    setLanguage(selectedLanguage);
    setToast({ message: t("settings.saved"), variant: "success" });
    localStorage.setItem("lang", selectedLanguage);
    window.location.reload();
  }

  useEffect(() => {
    setIntervalValue(refreshInterval);
  }, [refreshInterval]);

  useEffect(() => {
    setRange(chartRange);
  }, [chartRange]);

  useEffect(() => {
    setSelectedCurrency(currency);
  }, [currency]);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const fieldBase = `w-full rounded-lg border p-3 text-sm shadow-inner transition focus:border-cyan-400/70 ${
    isLight
      ? "border-slate-200 bg-white text-slate-900 shadow-slate-200/50"
      : "border-white/10 bg-white/5 text-white shadow-black/30"
  }`;

  const labelTone = `block space-y-2 text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-200"}`;
  const helperTone = `text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`;

  return (
    <div className="page">
      <Card variant="glass" className="p-6">
        <h1 className="mb-2 text-2xl font-bold">{t("settings.title")}</h1>
        <p className={`mb-6 text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
          {t("settings.subtitle")}
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <label className={labelTone}>
            <span>{t("settings.refreshIntervalLabel")}</span>
            <input
              type="number"
              min={0}
              value={interval}
              onChange={(e) => setIntervalValue(Number(e.target.value) || 0)}
              className={fieldBase}
            />
            <span className={helperTone}>
              {t("settings.refreshIntervalHelp")}
            </span>
          </label>

          <label className={labelTone}>
            <span>{t("settings.chartRange")}</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className={fieldBase}
            >
              {["24h", "7d", "30d", "1y"].map((opt) => (
                <option key={opt} value={opt} className="text-slate-900">
                  {opt}
                </option>
              ))}
            </select>
            <span className={helperTone}>{t("settings.chartRangeHelp")}</span>
          </label>

          <label className={labelTone}>
            <span>{t("settings.currency")}</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className={fieldBase}
            >
              {["USD", "EUR", "BAM"].map((opt) => (
                <option key={opt} value={opt} className="text-slate-900">
                  {opt}
                </option>
              ))}
            </select>
            <span className={helperTone}>{t("settings.currencyHelp")}</span>
          </label>

          <label className={labelTone}>
            <span>{t("settings.theme")}</span>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className={fieldBase}
            >
              {[
                { key: "dark", label: t("settings.dark") },
                { key: "light", label: t("settings.light") },
              ].map((opt) => (
                <option key={opt.key} value={opt.key} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
            <span className={helperTone}>{t("settings.themeHelp")}</span>
          </label>

          <label className={labelTone}>
            <span>{t("settings.language")}</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className={fieldBase}
            >
              {[
                { key: "en", label: t("settings.langEnglish") },
                { key: "sr", label: t("settings.langSerbian") },
              ].map((opt) => (
                <option key={opt.key} value={opt.key} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
            <span className={helperTone}>{t("settings.languageHelp")}</span>
          </label>
        </div>

        <button
          onClick={save}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5"
        >
          {t("settings.save")}
        </button>
      </Card>

      <Toast open={!!toast} message={toast?.message} variant={toast?.variant || "info"} onClose={() => setToast(null)} />
    </div>
  );
}
