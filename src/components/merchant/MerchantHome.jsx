import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { useMerchantStore } from "../zustendstore/MerchantStore";
import { PageShell, ErrorNote } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";
import { SubscriptionNotice } from "./MerchantLayout";

function Stat({ label, value, to, tone = "text-white" }) {
  const body = (
    <>
      <p className="text-sm text-white/60">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
    </>
  );
  return to ? (
    <Link to={to} className="block rounded-xl bg-white/10 p-5 transition hover:bg-white/15">
      {body}
    </Link>
  ) : (
    <div className="rounded-xl bg-white/10 p-5">{body}</div>
  );
}

/** The merchant's overview: subscription, their own product, order and sales numbers, and payments. */
export default function MerchantHome() {
  const { t, apiMessage, formatNumber, formatPrice, formatDate } = useLanguage();
  const merchant = useMerchantStore((state) => state.merchant);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/merchant/summary")
      .then((response) => active && setSummary(response.data.data))
      .catch((caught) => active && setError(apiMessage(caught)));
    return () => {
      active = false;
    };
  }, [apiMessage]);

  return (
    <PageShell
      title={t("mhome.welcome", { name: merchant.name })}
      subtitle={merchant.email}
      actions={<StatusBadge kind="account" value={merchant.accountStatus} />}
    >
      <SubscriptionNotice merchant={merchant} />
      {merchant.status === "active" && merchant.paidUntil && (
        <p className="mb-4 rounded-lg bg-green-500/20 p-3 text-sm text-green-100">{t("mhome.paidUntil", { date: formatDate(merchant.paidUntil) })}</p>
      )}
      <ErrorNote message={error} />

      {summary ? (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("mhome.products")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label={t("mhome.live")} value={formatNumber(summary.products.approved)} to="/merchant/products?status=approved" tone="text-green-300" />
              <Stat label={t("mhome.waiting")} value={formatNumber(summary.products.pending)} to="/merchant/products?status=pending" tone="text-amber-300" />
              <Stat label={t("mhome.rejected")} value={formatNumber(summary.products.rejected)} to="/merchant/products?status=rejected" tone="text-red-300" />
              <Stat label={t("mhome.lowStock")} value={formatNumber(summary.products.lowStock)} to="/merchant/products" tone="text-orange-300" />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("mhome.orders")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label={t("mhome.newOrders")} value={formatNumber(summary.orders.pending)} to="/merchant/orders?status=pending" tone="text-amber-300" />
              <Stat label={t("mhome.orders")} value={formatNumber(summary.orders.total)} to="/merchant/orders" />
              <Stat label={t("mhome.sales")} value={formatPrice(summary.sales.revenue)} />
              <Stat label={t("mhome.delivered")} value={formatPrice(summary.sales.delivered)} tone="text-green-300" />
            </div>
          </section>
        </div>
      ) : (
        !error && <p className="text-white/70">{t("common.loading")}</p>
      )}

      <section className="mt-8 max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold">{t("mhome.payments")}</h2>
        {merchant.payments.length ? (
          <ul className="divide-y divide-white/10 rounded-xl bg-white/10">
            {merchant.payments.map((payment) => (
              <li key={`${payment.createdAt}-${payment.periodEnd}`} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                <span className="font-semibold">{formatPrice(payment.amount)}</span>
                <span className="text-white/70">
                  {t("mhome.period", { from: formatDate(payment.periodStart), to: formatDate(payment.periodEnd) })}
                </span>
                {payment.method && <span className="text-white/50">{payment.method}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-white/5 p-4 text-sm text-white/60">{t("mhome.noPayments")}</p>
        )}
      </section>
    </PageShell>
  );
}
