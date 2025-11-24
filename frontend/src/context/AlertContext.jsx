import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../utils/formatters";
import { useTranslation } from "react-i18next";

const AlertContext = createContext(null);
const ALERT_STORAGE_KEY = "priceAlerts";
const ALERT_TRIGGER_STATE_KEY = "priceAlertTriggeredState";
const ALERT_DISMISSED_STATE_KEY = "priceAlertDismissedState";

export function AlertProvider({ children }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState(() => {
    try {
      const raw = localStorage.getItem(ALERT_TRIGGER_STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      const raw = localStorage.getItem(ALERT_DISMISSED_STATE_KEY);
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

  useEffect(() => {
    try {
      localStorage.setItem(ALERT_DISMISSED_STATE_KEY, JSON.stringify(dismissedAlerts));
    } catch (e) {
      // noop
    }
  }, [dismissedAlerts]);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target?.alertKey) {
        setDismissedAlerts((state) => ({ ...state, [target.alertKey]: true }));
      }
      return prev.filter((n) => n.id !== id);
    });
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
        const thresholdValue = Number(alertConfig.threshold);
        const conditionMet =
          alertConfig.direction === "above" ? priceUsd >= thresholdValue : priceUsd <= thresholdValue;
        const wasMet = !!nextTriggered[key];
        const wasDismissed = !!dismissedAlerts[key];

        if (conditionMet && !wasMet && !wasDismissed) {
          const displayThreshold = formatCurrency(alertConfig.threshold, currency);
          const directionLabel = t(`alerts.${alertConfig.direction === "above" ? "above" : "below"}`);
          pushNotification({
            message: t("alerts.toast", {
              coin: coin.name || coin.symbol || "",
              threshold: displayThreshold,
              direction: directionLabel,
            }),
            variant: "warning",
            autoHide: false,
            alertKey: key,
          });
          nextTriggered[key] = true;
          changed = true;
        } else if (!conditionMet && (wasMet || wasDismissed)) {
          if (wasMet) delete nextTriggered[key];
          if (wasDismissed) {
            const nextDismissed = { ...dismissedAlerts };
            delete nextDismissed[key];
            setDismissedAlerts(nextDismissed);
          }
          changed = true;
        }
      });

      if (changed) {
        setTriggeredAlerts(nextTriggered);
      }
    },
    [dismissedAlerts, pushNotification, t, triggeredAlerts]
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
