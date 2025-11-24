import { useSettings } from "../context/SettingsContext";

export default function Card({ children, variant = "solid", className = "" }) {
  const { theme } = useSettings();
  const isLight = theme === "light";

  const variants = {
    solid: isLight
      ? "bg-white border-slate-200 shadow-lg shadow-slate-200/60"
      : "bg-white/5 border-white/10",
    glass: isLight
      ? "bg-white/80 border-slate-200 shadow-lg shadow-slate-200/60 backdrop-blur"
      : "bg-white/5 border-white/10 backdrop-blur",
    outlined: isLight
      ? "bg-white border-slate-200 shadow-sm shadow-slate-200/50"
      : "bg-transparent border-white/15",
  };

  const textTone = isLight ? "text-slate-900" : "text-white";

  return (
    <div
      className={`${variants[variant] ?? variants.solid} ${textTone} rounded-2xl border p-4 shadow-lg shadow-slate-950/40 ${className}`}
    >
      {children}
    </div>
  );
}
