import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, EmptyNote, selectClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";

const FILTERS = [
  { key: "all", labelKey: "orders.filterAll", params: {} },
  { key: "pending", labelKey: "orders.filterPending", params: { deliveryStatus: "pending" } },
  { key: "review", labelKey: "orders.filterReview", params: { fraudStatus: "review" } },
];

export default function Orders() {
  const { t, apiMessage, formatPrice, formatNumber, formatDate, pick } = useLanguage();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchOrders = useCallback(
    async (key) => {
      const params = FILTERS.find((item) => item.key === key)?.params || {};
      const response = await api.get("/checkout/all-orders", { params });
      return response.data.data || [];
    },
    []
  );

  useEffect(() => {
    let active = true;

    fetchOrders(filter)
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
  }, [filter, fetchOrders, apiMessage]);

  const updateStatus = async (id, deliveryStatus) => {
    try {
      await api.patch(`/admin/orders/${id}`, { deliveryStatus });
      setOrders(await fetchOrders(filter));
    } catch (caught) {
      setError(apiMessage(caught, "orders.updateFailed"));
    }
  };

  return (
    <PageShell
      title={t("orders.title")}
      actions={
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={filter === item.key}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === item.key ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      }
    >
      <ErrorNote message={error} />

      {orders === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : orders.length ? (
        <div className="overflow-x-auto rounded-xl bg-white/10">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="border-b border-white/20 text-sm text-white/70">
                <th className="p-4">{t("orders.orderNumber")}</th>
                <th className="p-4">{t("orders.customer")}</th>
                <th className="p-4">{t("orders.address")}</th>
                <th className="p-4">{t("orders.items")}</th>
                <th className="p-4">{t("orders.amount")}</th>
                <th className="p-4">{t("orders.payment")}</th>
                <th className="p-4">{t("orders.risk")}</th>
                <th className="p-4">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const customer = order.customer || order.shipping || {};
                return (
                  <tr key={order._id} className="border-b border-white/10 align-top last:border-0">
                    <td className="p-4">
                      <span className="block font-mono text-sm">{order.orderNumber}</span>
                      <span className="mt-1 block text-xs text-white/50">{formatDate(order.createdAt)}</span>
                      <span className="mt-1 inline-block rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
                        {order.isGuest ? t("orders.guest") : t("orders.registered")}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="block">{customer.name || order.user?.fullname || t("orders.guest")}</span>
                      <span className="block text-xs text-white/60">{customer.phone}</span>
                      {customer.email && <span className="block text-xs text-white/60">{customer.email}</span>}
                    </td>

                    <td className="max-w-[220px] p-4 text-sm">
                      <span className="block">{customer.address}</span>
                      <span className="block text-white/60">
                        {[customer.city, customer.district, customer.postcode].filter(Boolean).join(", ")}
                      </span>
                      {customer.note && <span className="mt-1 block text-xs italic text-white/50">{customer.note}</span>}
                    </td>

                    <td className="max-w-[200px] p-4 text-sm">
                      {(order.items || []).map((item, index) => (
                        <span key={`${item.product || index}`} className="block truncate">
                          {item.title || item.product?.title} × {formatNumber(item.quntity || 1)}
                        </span>
                      ))}
                    </td>

                    <td className="p-4 text-sm">
                      <span className="block text-white/60">
                        {t("orders.subtotal")}: {formatPrice(order.subtotal)}
                      </span>
                      <span className="block text-white/60">
                        {t("orders.delivery")}: {formatPrice(order.deliveryCharge)}
                        {order.deliveryZoneLabel && (
                          <span className="ml-1 text-xs">({pick(order.deliveryZoneLabel, order.deliveryZoneLabelBn)})</span>
                        )}
                      </span>
                      <span className="mt-1 block font-bold">{formatPrice(order.totalprice)}</span>
                    </td>

                    <td className="p-4 text-sm">
                      <span className="block">{order.paymentMethod === "online" ? t("orders.online") : t("orders.cod")}</span>
                      <span className="block text-white/60">{t(`orders.${order.paymentStatus || "unpaid"}`)}</span>
                    </td>

                    <td className="p-4">
                      <StatusBadge kind="fraud" value={order.fraudStatus} />
                      {order.riskScore > 0 && (
                        <span className="mt-1 block text-xs text-white/60">
                          {t("fraud.score")}: {formatNumber(order.riskScore)}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <StatusBadge kind="delivery" value={order.deliveryStatus} />
                      <select
                        value={order.deliveryStatus}
                        onChange={(event) => updateStatus(order._id, event.target.value)}
                        aria-label={t("orders.deliveryStatus")}
                        className={`${selectClass} mt-2 !p-2 text-sm`}
                      >
                        <option value="pending">{t("orders.statusPending")}</option>
                        <option value="confirm">{t("orders.statusConfirm")}</option>
                        <option value="deliverd">{t("orders.statusDeliverd")}</option>
                        <option value="cenceled">{t("orders.statusCenceled")}</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyNote message={t("orders.none")} />
      )}
    </PageShell>
  );
}
