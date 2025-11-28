import { useMemo, useState } from "react";
import axios from "axios";
import { useSettings } from "../context/SettingsContext";
import { useTranslation } from "react-i18next";
import { useAlerts } from "../context/AlertContext";

const TAB_OPTIONS = [
  { key: "chat", icon: "💬" },
  { key: "help", icon: "❓" },
];

const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export default function ChatWidget() {
  const { theme } = useSettings();
  const { pushNotification } = useAlerts();
  const { t } = useTranslation();
  const isLight = theme === "light";
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const panelBase = useMemo(
    () =>
      isLight
        ? "bg-white text-slate-900 border-slate-200 shadow-slate-300/60"
        : "bg-slate-900/95 text-white border-white/10 shadow-cyan-500/20",
    [isLight]
  );

  const tabIndex = TAB_OPTIONS.findIndex((tab) => tab.key === activeTab);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      pushNotification({ message: t("chat.validation.required"), variant: "warning" });
      return;
    }

    if (!emailRegex.test(email.trim())) {
      pushNotification({ message: t("chat.validation.email"), variant: "warning" });
      return;
    }

    try {
      setLoading(true);
      await axios.post("http://localhost:3100/contact", { email: email.trim(), message: message.trim() });
      pushNotification({ message: t("chat.success"), variant: "success" });
      setMessage("");
      setEmail("");
      setOpen(false);
    } catch (error) {
      console.error(error);
      pushNotification({ message: t("chat.error"), variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const faqItems = t("chat.help.items", { returnObjects: true });

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="pointer-events-auto fixed inset-0 z-40 flex items-end justify-end sm:items-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div
            className={`relative m-4 w-full max-w-3xl rounded-3xl border backdrop-blur ${panelBase}`}
            role="dialog"
            aria-modal="true"
            style={{ minHeight: "520px", width: "min(95vw, 820px)" }}
          >
            <div className="flex items-center justify-between border-b px-6 py-4 text-sm font-semibold">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-400">
                <span>•</span>
                <span>{t("chat.title")}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-lg font-semibold ${
                  isLight ? "border-slate-200 bg-white text-slate-700" : "border-white/10 bg-white/5 text-white"
                }`}
                aria-label={t("chat.close")}
              >
                ×
              </button>
            </div>

            <div className="flex h-full flex-col px-4 pb-4 sm:px-6 sm:pb-6">
              <div
                className={`relative mb-6 flex items-center gap-2 rounded-2xl border px-2 py-2 text-sm font-semibold ${
                  isLight
                    ? "border-slate-200 bg-slate-50 text-slate-700"
                    : "border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                <span
                  className={`absolute inset-y-2 left-2 rounded-xl transition-all duration-300 ease-in-out ${
                    isLight ? "bg-cyan-100 shadow-sm shadow-cyan-200" : "bg-white text-slate-900 shadow-cyan-500/30"
                  }`}
                  style={{
                    width: "calc(50% - 0.5rem)",
                    transform: `translateX(${tabIndex * 100}%)`,
                  }}
                  aria-hidden
                />
                {TAB_OPTIONS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative z-10 flex-1 rounded-xl px-5 py-2.5 text-sm transition-colors ${
                      activeTab === tab.key
                        ? isLight
                          ? "text-cyan-900"
                          : "text-slate-900"
                        : isLight
                        ? "text-slate-700 hover:text-cyan-800"
                        : "text-slate-200 hover:text-white"
                    }`}
                  >
                    <span className="mr-1">{tab.icon}</span>
                    {t(`chat.tabs.${tab.key}`)}
                  </button>
                ))}
              </div>

              <div className="flex-1">
                {activeTab === "chat" ? (
                  <form className="flex h-full flex-col gap-4" onSubmit={handleSend}>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold">{t("chat.emailLabel")}</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("chat.emailPlaceholder")}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm ${
                          isLight
                            ? "border-slate-200 bg-white text-slate-900"
                            : "border-white/10 bg-slate-900/70 text-white"
                        }`}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="block text-sm font-semibold">{t("chat.message")}</label>
                      <textarea
                        rows={6}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t("chat.messagePlaceholder")}
                        className={`h-full w-full rounded-2xl border px-4 py-3 text-sm ${
                          isLight
                            ? "border-slate-200 bg-white text-slate-900"
                            : "border-white/10 bg-slate-900/70 text-white"
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                          isLight
                            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        {t("chat.close")}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 disabled:opacity-60"
                      >
                        {loading ? t("chat.sending") : t("chat.send")}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex h-full flex-col space-y-3">
                    <h3 className="text-lg font-semibold">{t("chat.help.title")}</h3>
                    <p className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                      {t("chat.help.subtitle")}
                    </p>
                    <div
                      className={`flex-1 space-y-3 rounded-2xl border p-4 text-sm shadow-inner shadow-black/5 dark:shadow-black/30 ${
                        isLight ? "border-slate-200 bg-white" : "border-white/10 bg-slate-900/50"
                      }`}
                    >
                      {Array.isArray(faqItems) &&
                        faqItems.map((item) => (
                          <div key={item.q} className="rounded-xl bg-white/40 p-3 text-left shadow-sm shadow-black/5 dark:bg-white/5 dark:shadow-black/20">
                            <p className="font-semibold">{item.q}</p>
                            <p className={`mt-1 text-xs ${isLight ? "text-slate-600" : "text-slate-300"}`}>{item.a}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border text-2xl shadow-lg transition hover:-translate-y-0.5 ${
          isLight
            ? "border-slate-200 bg-white text-cyan-600 shadow-cyan-200/60"
            : "border-white/10 bg-white/5 text-cyan-200 shadow-cyan-500/20"
        }`}
        aria-label={t("chat.open")}
      >
        💬
      </button>
    </div>
  );
}
