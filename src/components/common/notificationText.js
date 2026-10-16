import { useCallback } from "react";
import { useLanguage } from "../../i18n/useLanguage";

const DATE_PARAMS = ["graceEndsAt", "paidUntil", "endsAt", "startsAt"];

/**
 * Words a stored notification (type + values) in the reader's language. The
 * same type can read differently for a merchant and for administrators.
 */
export function useNotificationText(role) {
  const { t, formatPrice, formatDate, formatNumber } = useLanguage();
  return useCallback(
    (item) => {
      const params = { ...item.params };
      if (params.amount !== undefined) params.amount = formatPrice(params.amount);
      if (params.monthlyFee !== undefined) params.monthlyFee = formatPrice(params.monthlyFee);
      if (params.method) params.method = t(`method.${params.method}`);
      if (params.status) params.status = t(`tstatus.${params.status}`);
      if (params.days !== undefined) params.days = formatNumber(params.days);
      DATE_PARAMS.forEach((key) => {
        if (params[key]) params[key] = formatDate(params[key]);
      });
      if (item.type === "merchant_application" && params.nidCheck && params.nidCheck !== "matched") params.name = `${params.name} — ${t("nidcheck.notVerified")}`;
      const key = role === "merchant" && item.type === "ticket_reply" ? "ticket_reply_merchant" : item.type;
      return t(`inbox.${key}`, params);
    },
    [role, t, formatPrice, formatDate, formatNumber]
  );
}
