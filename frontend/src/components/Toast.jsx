import { useEffect } from "react";
import { useSettings } from "../context/SettingsContext";

export default function Toast({ open, message, variant = "info", onClose }) {
  const { theme } = useSettings();
  const isLight = theme === "light";

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, 2800);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  const tone = {
    info: isLight
      ? "bg-white text-slate-900 border-slate-200 shadow-slate-200/70"
      : "bg-slate-900/90 text-white border-white/10 shadow-slate-950/60",
    success: isLight
      ? "bg-emerald-50 text-emerald-900 border-emerald-200 shadow-emerald-200/80"
      : "bg-emerald-900/80 text-emerald-100 border-emerald-500/40 shadow-emerald-900/40",
    warning: isLight
      ? "bg-amber-50 text-amber-900 border-amber-200 shadow-amber-200/80"
      : "bg-amber-900/80 text-amber-100 border-amber-500/40 shadow-amber-900/40",
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 sm:justify-end sm:py-8">
      <div
        className={`w-full max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold backdrop-blur transition duration-300 ${tone}`}
      >
        {message}
      </div>
    </div>
  );
}
