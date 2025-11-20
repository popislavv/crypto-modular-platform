const currencySymbols = {
  USD: "$",
  EUR: "€",
  BAM: "KM",
};

const FX_RATES_FROM_USD = {
  USD: 1,
  EUR: 0.91,
  BAM: 1.7,
};

export function convertFromUsd(value, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  const rate = FX_RATES_FROM_USD[currency] ?? 1;
  return Number(value) * rate;
}

export function formatCurrency(value, currency = "USD", { convert = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";

  const preparedValue = convert ? convertFromUsd(value, currency) : value;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(preparedValue);
  } catch (e) {
    const symbol = currencySymbols[currency] || "";
    return `${symbol}${Number(preparedValue).toLocaleString()}`;
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

