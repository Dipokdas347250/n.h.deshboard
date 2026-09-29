import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { datePresets, todayInDhaka } from "../../lib/dates";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, inputClass, selectClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";
import OrdersReport from "./OrdersReport";

// Orders with no delivery status yet count as pending, as StatusBadge shows them.
const deliveryOf = (order) => order.deliveryStatus || "pending";

/** Status tabs over the period's orders; `dot` matches the StatusBadge colours. */
const FILTERS = [
  { key: "all", labelKey: "orders.filterAll", dot: "bg-white", match: () => true },
  { key: "pending", labelKey: "orders.statusPending", dot: "bg-amber-400", match: (order) => deliveryOf(order) === "pending" },
  { key: "confirm", labelKey: "orders.statusConfirm", dot: "bg-blue-400", match: (order) => deliveryOf(order) === "confirm" },
  { key: "deliverd", labelKey: "orders.statusDeliverd", dot: "bg-green-400", match: (order) => deliveryOf(order) === "deliverd" },
  { key: "cenceled", labelKey: "orders.statusCenceled", dot: "bg-red-400", match: (order) => deliveryOf(order) === "cenceled" },
  { key: "review", labelKey: "orders.filterReview", dot: "bg-orange-400", match: (order) => order.fraudStatus === "review" },
];

const PRESETS = ["today", "yesterday", "last7", "thisMonth", "last30"];

/** Confirmed, cleared by the fraud check, and not booked with the courier yet. */
const readyForCourier = (order) =>
  order.deliveryStatus === "confirm" &&
  !order.courier?.consignmentId &&
  order.courier?.status !== "sending" &&
  !["review", "blocked", "fake"].includes(order.fraudStatus);

const canSendToCourier = (order) =>
  !order.courier?.consignmentId &&
  ["pending", "confirm"].includes(order.deliveryStatus) &&
  !["review", "blocked", "fake"].includes(order.fraudStatus);

const tabClass = (active) =>
  `flex min-w-[8.5rem] flex-1 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition ${
    active ? "bg-white text-[#062B63] shadow-lg" : "bg-white/10 text-white hover:bg-white/20"
  }`;

const chipClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    active ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"
  }`;

export default function Orders() {
  const { t, language, apiMessage, formatPrice, formatNumber, formatDate, pick } = useLanguage();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [courierBusy, setCourierBusy] = useState({});
  // The page opens on today's account; any earlier day or span can be chosen.
  const [range, setRange] = useState(() => ({ preset: "today", ...datePresets().today }));
  const { from, to } = range;

  // Every order in the period is loaded once; the status tabs filter it here so
  // each tab can show its count and switching tabs needs no request.
  const fetchOrders = useCallback(async () => {
    const response = await api.get("/checkout/all-orders", { params: { from, to } });
    return response.data.data || [];
  }, [from, to]);

  const choosePreset = (preset) => setRange({ preset, ...datePresets()[preset] });
  const chooseDate = (field, value) => {
    if (!value) return;
    setRange((current) => {
      const next = { ...current, preset: "custom", [field]: value };
      // Keep the span the right way round when one end jumps past the other.
      if (next.from > next.to) next[field === "from" ? "to" : "from"] = value;
      return next;
    });
  };

  useEffect(() => {
    let active = true;

    fetchOrders()
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
  }, [fetchOrders, apiMessage]);

  const updateStatus = async (id, deliveryStatus) => {
    try {
      await api.patch(`/admin/orders/${id}`, { deliveryStatus });
      setOrders(await fetchOrders());
    } catch (caught) {
      setError(apiMessage(caught, "orders.updateFailed"));
    }
  };

  /** A success reply's message in the reader's language. */
  const replyText = (data) => (language === "bn" && data.messageBn) || data.message;

  const replaceOrder = (updated) =>
    setOrders((current) => current.map((order) => (order._id === updated._id ? { ...order, ...updated, user: order.user, items: order.items } : order)));

  /** Runs a courier action for one order, keeping its row busy meanwhile. */
  const courierAction = async (order, path) => {
    setCourierBusy((current) => ({ ...current, [order._id]: true }));
    setError("");
    setNotice("");
    try {
      const response = await api.post(`/admin/orders/${order._id}/${path}`);
      replaceOrder(response.data.data);
      setNotice(replyText(response.data));
    } catch (caught) {
      setError(apiMessage(caught));
      // The failure reason is stored on the order, so show it in the row too.
      setOrders(await fetchOrders().catch(() => orders));
    } finally {
      setCourierBusy((current) => ({ ...current, [order._id]: false }));
    }
  };

  const activeFilter = FILTERS.find((item) => item.key === filter) || FILTERS[0];
  const visibleOrders = (orders || []).filter(activeFilter.match);
  const readyOrders = visibleOrders.filter(readyForCourier);

  const sendAllReady = async () => {
    if (!window.confirm(t("steadfast.confirmBulk", { count: formatNumber(readyOrders.length) }))) return;
    setCourierBusy((current) => ({ ...current, bulk: true }));
    setError("");
    setNotice("");
    try {
      const response = await api.post("/admin/orders/steadfast/bulk", { ids: readyOrders.map((order) => order._id) });
      const failures = response.data.data.results.filter((item) => !item.ok);
      setNotice(replyText(response.data));
      if (failures.length) {
        setError(failures.map((item) => `${item.orderNumber}: ${language === "bn" ? item.messageBn : item.message}`).join(" · "));
      }
      setOrders(await fetchOrders());
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setCourierBusy((current) => ({ ...current, bulk: false }));
    }
  };

  const courierStatusLabel = (status) => {
    const key = `steadfast.status.${status}`;
    const label = t(key);
    return label === key ? status.replace(/_/g, " ") : label;
  };

  return (
    <PageShell
      title={t("orders.title")}
      actions={
        <button type="button" onClick={() => window.print()} className="no-print rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-400">
          {t("report.print")}
        </button>
      }
    >
      <div className="no-print mb-6 space-y-3 rounded-2xl bg-white/5 p-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("report.period")}>
          {PRESETS.map((key) => (
            <button key={key} type="button" onClick={() => choosePreset(key)} aria-pressed={range.preset === key} className={chipClass(range.preset === key)}>
              {t(`report.preset.${key}`)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-white/70">
            <span className="mb-1 block">{t("report.from")}</span>
            <input type="date" value={from} max={todayInDhaka()} onChange={(event) => chooseDate("from", event.target.value)} className={`${inputClass} !p-2 [color-scheme:dark]`} />
          </label>
          <label className="text-sm text-white/70">
            <span className="mb-1 block">{t("report.to")}</span>
            <input type="date" value={to} max={todayInDhaka()} onChange={(event) => chooseDate("to", event.target.value)} className={`${inputClass} !p-2 [color-scheme:dark]`} />
          </label>
        </div>
      </div>

     

      <div className="no-print mb-4 flex flex-wrap gap-2" role="tablist" aria-label={t("orders.deliveryStatus")}>
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            onClick={() => setFilter(item.key)}
            aria-selected={filter === item.key}
            className={tabClass(filter === item.key)}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} aria-hidden="true" />
              {t(item.labelKey)}
            </span>
            <span className="text-lg font-bold">{orders ? formatNumber(orders.filter(item.match).length) : "–"}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          {filter === "all" ? t("orders.listTitle") : t(activeFilter.labelKey)}
          {orders && <span className="ml-2 text-base font-normal text-white/60">({formatNumber(visibleOrders.length)})</span>}
        </h2>
        <div className="no-print flex flex-wrap gap-2">
          {readyOrders.length > 0 && (
            <button
              type="button"
              onClick={sendAllReady}
              disabled={courierBusy.bulk}
              className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-400 disabled:opacity-50"
            >
              {courierBusy.bulk ? t("steadfast.sending") : t("steadfast.sendAll", { count: formatNumber(readyOrders.length) })}
            </button>
          )}
        </div>
      </div>

      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      {orders === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : visibleOrders.length ? (
        <div className="overflow-x-auto rounded-xl bg-white/10">
          <table className="w-full min-w-[1180px] text-left">
            <thead>
              <tr className="border-b border-white/20 text-sm text-white/70">
                <th className="p-4">{t("orders.orderNumber")}</th>
                <th className="p-4">{t("orders.customer")}</th>
                <th className="p-4">{t("orders.address")}</th>
                <th className="p-4">{t("orders.items")}</th>
                <th className="p-4">{t("orders.amount")}</th>
                <th className="p-4">{t("orders.payment")}</th>
                <th className="p-4">{t("orders.risk")}</th>
                <th className="p-4">{t("steadfast.column")}</th>
                <th className="p-4">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order) => {
                const customer = order.customer || order.shipping || {};
                return (
                  <tr key={order._id} className="border-b border-white/10 align-top last:border-0">
                    <td className="p-4">
                      <span className="block font-mono text-sm">{order.orderNumber}</span>
                      <span className="mt-1 block text-xs text-white/50">
                        {formatDate(order.createdAt)} · {new Date(order.createdAt).toLocaleTimeString(language === "bn" ? "bn-BD" : "en-GB", { hour: "numeric", minute: "2-digit" })}
                      </span>
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
                        {[customer.city, customer.district, customer.division, customer.postcode].filter(Boolean).join(", ")}
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

                    <td className="p-4 text-sm">
                      {order.courier?.consignmentId ? (
                        <>
                          <span className="block font-mono text-xs text-white/60">#{order.courier.consignmentId}</span>
                          {order.courier.trackingCode && (
                            <a
                              href={`https://steadfast.com.bd/t/${encodeURIComponent(order.courier.trackingCode)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block font-mono text-green-300 underline-offset-2 hover:underline"
                            >
                              {order.courier.trackingCode}
                            </a>
                          )}
                          <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize">
                            {courierStatusLabel(order.courier.status || "in_review")}
                          </span>
                          <button
                            type="button"
                            onClick={() => courierAction(order, "steadfast/status")}
                            disabled={courierBusy[order._id]}
                            className="no-print mt-2 block text-xs text-white/70 underline-offset-2 hover:underline disabled:opacity-50"
                          >
                            {courierBusy[order._id] ? t("common.loading") : t("steadfast.refresh")}
                          </button>
                        </>
                      ) : canSendToCourier(order) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => courierAction(order, "steadfast")}
                            disabled={courierBusy[order._id] || order.courier?.status === "sending"}
                            className="no-print whitespace-nowrap rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-400 disabled:opacity-50"
                          >
                            {courierBusy[order._id] || order.courier?.status === "sending" ? t("steadfast.sending") : t("steadfast.send")}
                          </button>
                          {order.courier?.error && <span className="mt-1 block max-w-[180px] text-xs text-red-200">{order.courier.error}</span>}
                        </>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>

                    <td className="p-4">
                      <StatusBadge kind="delivery" value={order.deliveryStatus} />
                      <select
                        value={order.deliveryStatus}
                        onChange={(event) => updateStatus(order._id, event.target.value)}
                        aria-label={t("orders.deliveryStatus")}
                        className={`${selectClass} no-print mt-2 !p-2 text-sm`}
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
       <OrdersReport from={from} to={to} />
    </PageShell>
  );
}
