import { useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { useTranslation } from "react-i18next";

export default function ChatWidget() {
  const { theme } = useSettings();
  const { t } = useTranslation();
  const isLight = theme === "light";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const panelBase = isLight
    ? "bg-white text-slate-900 border-slate-200 shadow-slate-300/50"
    : "bg-slate-900/90 text-white border-white/10 shadow-cyan-500/10";

  const handleSend = () => {
    console.log("Chat message", { email, message });
    setMessage("");
    setOpen(false);
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div
          className={`pointer-events-auto w-[320px] rounded-2xl border p-4 backdrop-blur transition ${panelBase}`}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
                {t("chat.title")}
              </p>
              <h3 className="text-lg font-semibold">{t("chat.subtitle")}</h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-lg font-semibold ${
                isLight
                  ? "border-slate-200 bg-white text-slate-700"
                  : "border-white/10 bg-white/5 text-white"
              }`}
              aria-label={t("chat.close")}
            >
              ×
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="space-y-1">
              <label className="font-semibold">{t("chat.emailOptional")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("chat.emailPlaceholder")}
                className={`w-full rounded-xl border px-3 py-2 ${
                  isLight
                    ? "border-slate-200 bg-white text-slate-900"
                    : "border-white/10 bg-slate-900/70 text-white"
                }`}
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold">{t("chat.message")}</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("chat.messagePlaceholder")}
                className={`w-full rounded-xl border px-3 py-2 ${
                  isLight
                    ? "border-slate-200 bg-white text-slate-900"
                    : "border-white/10 bg-slate-900/70 text-white"
                }`}
              />
            </div>
            <button
              onClick={handleSend}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30"
            >
              {t("chat.send")}
            </button>
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
