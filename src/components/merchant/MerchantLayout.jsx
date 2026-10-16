import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { useMerchantStore } from "../zustendstore/MerchantStore";
import { PageShell, ErrorNote } from "../common/PageShell";

/** One line about where the merchant's subscription stands, or nothing when all is well. */
export function SubscriptionNotice({ merchant }) {
  const { t, formatDate, formatNumber, formatPrice } = useLanguage();
  if (!merchant) return null;

  if (merchant.status === "trial") {
    const days = merchant.trialDaysLeft;
    return (
      <p className="mb-4 rounded-lg bg-violet-500/20 p-3 text-sm text-violet-100">
        {days > 0 ? t("mhome.trialLeft", { days: formatNumber(days), date: formatDate(merchant.trialEndsAt) }) : t("mhome.trialEndsToday")}
        {merchant.monthlyFee > 0 && ` ${t("mhome.feeLine", { amount: formatPrice(merchant.monthlyFee) })}`}
      </p>
    );
  }

  if (merchant.accountStatus === "payment_pending") {
    return <p className="mb-4 rounded-lg bg-sky-500/20 p-3 text-sm text-sky-100">{t("mhome.verificationPending")}</p>;
  }

  if (merchant.status === "payment_due" || merchant.status === "approved") {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-orange-500/20 p-3 text-sm text-orange-100">
        <p>
          {t(merchant.status === "approved" ? "mhome.awaitingPayment" : "mhome.paymentDue")}
          {merchant.monthlyFee > 0 && ` ${t("mhome.feeLine", { amount: formatPrice(merchant.monthlyFee) })}`}
          {merchant.graceEndsAt && <strong className="block pt-1">{t("mhome.graceLine", { date: formatDate(merchant.graceEndsAt) })}</strong>}
        </p>
        <Link to="/merchant/billing" className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-400">
          {t("mhome.payNow")}
        </Link>
      </div>
    );
  }

  return null;
}

/** Pages a suspended merchant can still use, so a closed account can always pay or ask for help. */
const OPEN_WHILE_SUSPENDED = ["/merchant/billing", "/merchant/support", "/merchant/notifications"];

/**
 * Frame for every merchant page. Loads the merchant's own account on each
 * navigation, so a suspension or a recorded payment shows up straight away.
 * A suspended merchant sees an explanation everywhere except the payment and
 * support pages; the API refuses the rest.
 */
export default function MerchantLayout() {
  const { t, apiMessage, formatPrice } = useLanguage();
  const { pathname } = useLocation();
  const { merchant, setMerchant, clearMerchant } = useMerchantStore();
  const [error, setError] = useState("");

  // Forget the account on the way out (sign-out), so the next person to sign in never sees it.
  useEffect(() => clearMerchant, [clearMerchant]);

  useEffect(() => {
    let active = true;
    api.get("/merchant/me")
      .then((response) => {
        if (!active) return;
        setMerchant(response.data.data);
        setError("");
      })
      .catch((caught) => active && setError(apiMessage(caught)));
    return () => {
      active = false;
    };
  }, [pathname, apiMessage, setMerchant]);

  if (error && !merchant) {
    return (
      <PageShell title={t("mhome.title")}>
        <ErrorNote message={error} />
      </PageShell>
    );
  }

  if (!merchant) {
    return <p className="min-h-screen bg-[#062B63]/95 p-6 text-white/70">{t("common.loading")}</p>;
  }

  const openWhileSuspended = OPEN_WHILE_SUSPENDED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (merchant.status === "suspended" && !openWhileSuspended) {
    return (
      <PageShell title={t("mhome.suspendedTitle")}>
        <div className="max-w-2xl rounded-2xl bg-red-500/20 p-6 text-red-50">
          <p className="leading-7">{t(merchant.suspendedAuto ? "mhome.suspendedAutoBody" : "mhome.suspendedBody")}</p>
          {merchant.outstandingAmount > 0 && (
            <p className="mt-4 rounded-lg bg-black/20 p-3 text-lg font-bold">{t("mhome.outstanding", { amount: formatPrice(merchant.outstandingAmount) })}</p>
          )}
          {merchant.accountStatus === "payment_pending" && <p className="mt-3 text-sm text-sky-100">{t("mhome.verificationPending")}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/merchant/billing" className="rounded-lg bg-green-500 px-4 py-2 font-semibold text-white hover:bg-green-400">
              {t("mhome.payNow")}
            </Link>
            <Link to="/merchant/support" className="rounded-lg bg-white/15 px-4 py-2 font-semibold text-white hover:bg-white/25">
              {t("mhome.getHelp")}
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  return <Outlet />;
}
