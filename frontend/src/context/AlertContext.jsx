import { createContext, useContext, useMemo, useState } from "react";
import { formatCurrency } from "../utils/formatters";

const AlertContext = createContext(null);
const ALERT_STORAGE_KEY = "priceAlerts";

export function AlertProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState({});

  function dismiss(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  function pushNotification(notification) {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    const payload = { id, autoHide: true, ...notification };
    setNotifications((prev) => [...prev, payload]);
    return id;
  }

  function evaluatePriceAlerts(coins, currency = "USD") {
    if (!coins?.length) return;
    const raw = localStorage.getItem(ALERT_STORAGE_KEY);
    if (!raw) return;

    let savedAlerts = {};
    try {
      savedAlerts = JSON.parse(raw) || {};
    } catch (e) {
      savedAlerts = {};
    }

    const nextTriggered = { ...triggeredAlerts };

    coins.forEach((coin) => {
      const alertConfig = savedAlerts[coin.id];
      const priceUsd = coin.market_data?.current_price?.usd ?? coin.current_price ?? coin.current_price?.usd;
      if (!alertConfig || !priceUsd) return;

      const key = `${coin.id}-${alertConfig.direction}-${alertConfig.threshold}`;
      const conditionMet =
        alertConfig.direction === "above"
          ? priceUsd >= alertConfig.threshold
          : priceUsd <= alertConfig.threshold;

      if (conditionMet && !triggeredAlerts[key]) {
        const displayThreshold = formatCurrency(alertConfig.threshold, currency);
        pushNotification({
          message: `Alert: ${coin.name || coin.symbol || ""} price crossed ${displayThreshold} (${alertConfig.direction})`,
          variant: "warning",
          autoHide: false,
        });
        nextTriggered[key] = true;
      } else if (!conditionMet && triggeredAlerts[key]) {
        delete nextTriggered[key];
      }
    });

    setTriggeredAlerts(nextTriggered);
  }

  const value = useMemo(
    () => ({ notifications, pushNotification, dismiss, evaluatePriceAlerts }),
    [notifications, triggeredAlerts]
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlerts must be used within AlertProvider");
  return ctx;
}
