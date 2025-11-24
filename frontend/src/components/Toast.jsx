import { useEffect } from "react";
import { useSettings } from "../context/SettingsContext";

const POSITION_CLASSES = {
  "top-right": "top-4 right-4 items-end",
  "top-left": "top-4 left-4 items-start",
  "bottom-right": "bottom-4 right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
};

export default function Toast({
  open,
  message,
  variant = "info",
  onClose,
  position = "top-right",
  offsetIndex = 0,
  autoHide = true,
  duration = 3200,
}) {
  const { theme } = useSettings();
  const isLight = theme === "light";

  useEffect(() => {
    if (!open || !autoHide) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [autoHide, duration, open, onClose]);

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

  const positionClass = POSITION_CLASSES[position] || POSITION_CLASSES["top-right"];

  return (
    <div
      className={`pointer-events-none fixed z-50 flex w-full max-w-sm flex-col gap-3 ${positionClass}`}
      style={{ transform: `translateY(${offsetIndex * 8}px)` }}
    >
      <div
        className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm font-semibold backdrop-blur transition duration-300 ${tone}`}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="leading-snug">{message}</span>
          {onClose && (
            <button
              onClick={onClose}
              className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs transition ${
                isLight
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
