import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, EmptyNote, SuccessNote } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";

/**
 * The review queue for orders the automatic checks flagged.
 *
 * Staff call the customer and then either confirm the order as genuine, or
 * record it as fake — which cancels it and makes that phone number count
 * against any future order from the same person.
 */
export default function FraudReview() {
  const { t, apiMessage, formatPrice, formatNumber, formatDate, pick } = useLanguage();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchQueue = useCallback(async () => (await api.get("/admin/fraud-queue")).data.data || [], []);

  useEffect(() => {
    let active = true;

    fetchQueue()
      .then((items) => {
        if (!active) return;
        setOrders(items);
        setError("");
      })
      .catch((caught) => {
        if (!active) return;
        setOrders([]);
        setError(apiMessage(caught));
      });

    return () => {
      active = false;
    };
  }, [fetchQueue, apiMessage]);

  const resolve = async (order, fraudStatus) => {
    if (fraudStatus === "fake" && !window.confirm(t("fraud.confirmFake"))) return;

    try {
      await api.patch(`/admin/orders/${order._id}`, {
        fraudStatus,
        // A genuine order still needs confirming before it goes out.
        ...(fraudStatus === "verified" ? { deliveryStatus: "confirm" } : {}),
      });
      setNotice(t(fraudStatus === "fake" ? "fraud.statusFake" : "fraud.statusVerified"));
      setOrders(await fetchQueue());
    } catch (caught) {
      setError(apiMessage(caught, "orders.updateFailed"));
    }
  };

  return (
    <PageShell title={t("fraud.title")} subtitle={t("fraud.subtitle")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      {orders === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : orders.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {orders.map((order) => {
            const customer = order.customer || {};
            return (
              <article key={order._id} className="rounded-2xl bg-white/10 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm text-white/60">{order.orderNumber}</p>
                    <h2 className="mt-1 text-lg font-bold">{customer.name}</h2>
                    <a href={`tel:${customer.phone}`} className="text-sm text-emerald-300 hover:underline">
                      {customer.phone}
                    </a>
                  </div>
                  <div className="text-right">
                    <StatusBadge kind="risk" value={order.riskLevel} />
                    <p className="mt-1 text-sm text-white/70">
                      {t("fraud.score")}: <span className="font-bold text-white">{formatNumber(order.riskScore)}</span>
                    </p>
                    <div className="mt-1">
                      <StatusBadge kind="fraud" value={order.fraudStatus} />
                    </div>
                  </div>
                </div>

                <dl className="mt-4 space-y-1 border-t border-white/10 pt-4 text-sm text-white/80">
                  <div className="flex justify-between gap-4">
                    <dt>{t("orders.amount")}</dt>
                    <dd className="font-semibold">
                      {formatPrice(order.totalprice)}{" "}
                      <span className="text-xs text-white/50">
                        ({t("orders.delivery")} {formatPrice(order.deliveryCharge)})
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>{t("orders.payment")}</dt>
                    <dd>{order.paymentMethod === "online" ? t("orders.online") : t("orders.cod")}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>{t("orders.address")}</dt>
                    <dd className="max-w-[60%] text-right">
                      {customer.address}, {[customer.city, customer.district, customer.division].filter(Boolean).join(", ")}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>{t("fraud.placedFrom")}</dt>
                    <dd className="text-right text-xs text-white/50">
                      {order.isGuest ? t("orders.guest") : t("orders.registered")} · {order.ipAddress || "—"} ·{" "}
                      {formatDate(order.createdAt)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 border-t border-white/10 pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-amber-200">{t("fraud.reasons")}</h3>
                  <ul className="space-y-1.5">
                    {(order.riskFlags || []).map((flag) => (
                      <li key={flag.code} className="flex items-start justify-between gap-3 text-sm">
                        <span className="text-white/80">{pick(flag.label, flag.labelBn)}</span>
                        <span className="shrink-0 rounded bg-amber-400/20 px-1.5 py-0.5 text-xs text-amber-200">
                          +{formatNumber(flag.score)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {order.fraudStatus !== "fake" && order.fraudStatus !== "verified" && (
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => resolve(order, "verified")}
                      className="flex-1 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-400"
                    >
                      {t("fraud.markVerified")}
                    </button>
                    <button
                      type="button"
                      onClick={() => resolve(order, "fake")}
                      className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400"
                    >
                      {t("fraud.markFake")}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyNote message={t("fraud.none")} />
      )}
    </PageShell>
  );
}
