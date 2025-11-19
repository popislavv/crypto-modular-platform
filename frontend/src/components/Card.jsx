export default function Card({ children, variant = "solid", className = "" }) {
  const variants = {
    solid: "bg-white/5 border-white/10",
    glass: "bg-white/5 border-white/10 backdrop-blur",
    outlined: "bg-transparent border-white/15",
  };

  return (
    <div
      className={`${variants[variant] ?? variants.solid} rounded-2xl border p-4 text-white shadow-lg shadow-slate-950/40 ${className}`}
    >
      {children}
    </div>
  );
}
