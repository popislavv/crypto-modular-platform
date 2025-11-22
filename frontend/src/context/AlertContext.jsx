import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../utils/formatters";

const AlertContext = createContext(null);
const ALERT_STORAGE_KEY = "priceAlerts";
const ALERT_TRIGGER_STATE_KEY = "priceAlertTriggeredState";

export function AlertProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState(() => {
    try {
      const raw = localStorage.getItem(ALERT_TRIGGER_STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ALERT_TRIGGER_STATE_KEY, JSON.stringify(triggeredAlerts));
    } catch (e) {
      // noop
    }
  }, [triggeredAlerts]);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const pushNotification = useCallback((notification) => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    const payload = { id, autoHide: true, ...notification };
    setNotifications((prev) => [...prev, payload]);
    return id;
  }, []);

  const evaluatePriceAlerts = useCallback(
    (coins, currency = "USD") => {
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
      let changed = false;

      coins.forEach((coin) => {
        const alertConfig = savedAlerts[coin.id];
        const priceUsd = coin.market_data?.current_price?.usd ?? coin.current_price ?? coin.current_price?.usd;
        if (!alertConfig || !priceUsd) return;

        const key = `${coin.id}-${alertConfig.direction}-${alertConfig.threshold}`;
        const conditionMet =
          alertConfig.direction === "above"
            ? priceUsd >= alertConfig.threshold
            : priceUsd <= alertConfig.threshold;
        const wasMet = !!nextTriggered[key];

        if (conditionMet && !wasMet) {
          const displayThreshold = formatCurrency(alertConfig.threshold, currency);
          pushNotification({
            message: `Alert: ${coin.name || coin.symbol || ""} price crossed ${displayThreshold} (${alertConfig.direction})`,
            variant: "warning",
            autoHide: false,
          });
          nextTriggered[key] = true;
          changed = true;
        } else if (!conditionMet && wasMet) {
          delete nextTriggered[key];
          changed = true;
        }
      });

      if (changed) {
        setTriggeredAlerts(nextTriggered);
      }
    },
    [pushNotification, triggeredAlerts]
  );

  const value = useMemo(
    () => ({ notifications, pushNotification, dismiss, evaluatePriceAlerts }),
    [notifications, pushNotification, dismiss, evaluatePriceAlerts]
  );

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlerts must be used within AlertProvider");
  return ctx;
}
