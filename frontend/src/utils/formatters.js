const currencySymbols = {
  USD: "$",
  EUR: "€",
  BAM: "KM",
};

export function formatCurrency(value, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (e) {
    const symbol = currencySymbols[currency] || "";
    return `${symbol}${Number(value).toLocaleString()}`;
  }
}

export function formatCompact(value, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const units = [
    { limit: 1_000_000_000_000, suffix: "T" },
    { limit: 1_000_000_000, suffix: "B" },
    { limit: 1_000_000, suffix: "M" },
  ];

  for (const unit of units) {
    if (value >= unit.limit) {
      return `${formatCurrency(value / unit.limit, currency)}${unit.suffix}`;
    }
  }

  return formatCurrency(value, currency);
}

