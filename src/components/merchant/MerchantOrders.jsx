import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, inputClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";

const TABS = ["all", "pending", "confirmed", "shipped", "delivered", "cancelled"];

/** Where a merchant may move their part of an order next; mirrors the API. */
const NEXT_STATUS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const BUTTON_STYLE = {
  confirmed: "bg-blue-500 hover:bg-blue-400",
  shipped: "bg-violet-500 hover:bg-violet-400",
  delivered: "bg-green-500 hover:bg-green-400",
  cancelled: "bg-red-500 hover:bg-red-400",
};

const chipClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"}`;

/**
 * Orders containing this merchant's products. The API sends only the
 * merchant's own lines and the delivery details needed to fulfil them.
 */
export default function MerchantOrders() {
  const { t, apiMessage, formatPrice, formatNumber, formatDate } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.includes(searchParams.get("status")) ? searchParams.get("status") : "all";
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);

  const [result, setResult] = useState(null);
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(
    () => api.get("/merchant/orders", { params: { status: tab === "all" ? undefined : tab, page } }).then((response) => response.data.data),
    [tab, page]
  );

  useEffect(() => {
    let active = true;
    load()
      .then((data) => active && setResult(data))
      .catch((caught) => {
        if (!active) return;
        setResult({ orders: [], total: 0, page: 1, pages: 1 });
        setError(apiMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [load, apiMessage]);

  const setParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value === undefined || value === "all" || (key === "page" && value === 1)) params.delete(key);
    else params.set(key, value);
    if (key === "status") params.delete("page");
    setSearchParams(params);
  };

  const move = async (order, status) => {
    if (status === "cancelled" && !window.confirm(t("morder.cancelConfirm"))) return;
    setBusy(order._id);
    setError("");
    setNotice("");
    try {
      const response = await api.patch(`/merchant/orders/${order._id}`, { status, note: notes[order._id] ?? order.note });
      setResult((current) => ({ ...current, orders: current.orders.map((item) => (item._id === order._id ? response.data.data : item)) }));
      setNotice(apiMessage({ response }));
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(null);
    }
  };

  return (
    <PageShell title={t("morder.title")} subtitle={t("morder.subtitle")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      <div className="mb-5 flex flex-wrap gap-2" role="group">
        {TABS.map((key) => (
          <button key={key} type="button" onClick={() => setParam("status", key)} aria-pressed={tab === key} className={chipClass(tab === key)}>
            {key === "all" ? t("common.all") : t(`mstep.${key}`)}
          </button>
        ))}
      </div>

      {result === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : result.orders.length ? (
        <div className="space-y-4">
          {result.orders.map((order) => {
            const storeCancelled = order.orderStatus === "cenceled";
            const actions = storeCancelled ? [] : NEXT_STATUS[order.status] || [];
            return (
              <article key={order._id} className="rounded-xl bg-white/10 p-5">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-white/60">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {storeCancelled ? (
                      <span className="rounded-full bg-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-100">{t("morder.storeCancelled")}</span>
                    ) : (
                      <StatusBadge kind="step" value={order.status} />
                    )}
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">
                      {order.paymentMethod === "online" && order.paymentStatus === "paid" ? t("morder.online") : t("morder.cod")}
                    </span>
                  </div>
                </header>

                {order.underReview && !storeCancelled && (
                  <p className="mt-3 rounded-lg bg-amber-500/20 p-2 text-sm text-amber-100">{t("morder.underReview")}</p>
                )}

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="text-sm">
                    <p className="mb-1 text-white/60">{t("morder.customer")}</p>
                    <p className="font-semibold">{order.customer.name}</p>
                    <a href={`tel:${order.customer.phone}`} className="block text-green-300 hover:underline">
                      {order.customer.phone}
                    </a>
                    <p>{order.customer.address}</p>
                    <p className="text-white/60">
                      {[order.customer.city, order.customer.district, order.customer.division, order.customer.postcode].filter(Boolean).join(", ")}
                    </p>
                    {order.customer.note && <p className="mt-1 text-xs italic text-white/50">{order.customer.note}</p>}
                  </div>

                  <div className="text-sm">
                    <p className="mb-1 text-white/60">{t("morder.yourItems")}</p>
                    <ul className="space-y-2">
                      {order.items.map((item, index) => (
                        <li key={`${item.product}-${index}`} className="flex items-center gap-3">
                          {item.image && <img src={item.image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{item.title}</span>
                            <span className="text-xs text-white/60">
                              {[item.variant?.size, item.variant?.color].filter(Boolean).join(" / ")}
                              {item.variant ? " · " : ""}
                              {formatPrice(item.unitprice)} × {formatNumber(item.quntity)}
                            </span>
                          </span>
                          <span className="font-semibold">{formatPrice(item.totalprice)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 flex justify-between border-t border-white/10 pt-2 font-semibold">
                      <span>{t("morder.yourTotal")}</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </p>
                  </div>
                </div>

                {actions.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                    <input
                      value={notes[order._id] ?? order.note}
                      onChange={(event) => setNotes((current) => ({ ...current, [order._id]: event.target.value }))}
                      placeholder={t("morder.notePlaceholder")}
                      aria-label={t("morder.note")}
                      className={`${inputClass} !p-2 min-w-[12rem] flex-1 text-sm`}
                    />
                    {actions.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={busy === order._id || (order.underReview && status !== "cancelled")}
                        onClick={() => move(order, status)}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40 ${BUTTON_STYLE[status]}`}
                      >
                        {t("morder.move", { status: t(`mstep.${status}`) })}
                      </button>
                    ))}
                  </div>
                )}
                {!actions.length && order.note && <p className="mt-3 text-xs text-white/60">{t("morder.note")}: {order.note}</p>}
              </article>
            );
          })}

          {result.pages > 1 && (
            <nav className="flex items-center justify-center gap-3 pt-2">
              <button type="button" disabled={page <= 1} onClick={() => setParam("page", page - 1)} className="rounded-lg bg-white/10 px-4 py-2 text-sm disabled:opacity-40">
                {t("morder.prev")}
              </button>
              <span className="text-sm text-white/70">{t("morder.page", { page: formatNumber(result.page), pages: formatNumber(result.pages) })}</span>
              <button type="button" disabled={page >= result.pages} onClick={() => setParam("page", page + 1)} className="rounded-lg bg-white/10 px-4 py-2 text-sm disabled:opacity-40">
                {t("morder.next")}
              </button>
            </nav>
          )}
        </div>
      ) : (
        <EmptyNote message={t("morder.none")} />
      )}
    </PageShell>
  );
}
