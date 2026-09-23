import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, EmptyNote } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";

export default function Dashboard() {
  const { t, apiMessage, formatPrice, formatNumber, pick } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api.get("/admin/dashboard")
      .then((response) => {
        if (active) setDashboard(response.data.data);
      })
      .catch((caught) => {
        if (active) setError(apiMessage(caught, "dashboard.loadFailed"));
      });

    return () => {
      active = false;
    };
  }, [apiMessage]);

  if (error) {
    return (
      <PageShell title={t("nav.dashboard")}>
        <ErrorNote message={error} />
      </PageShell>
    );
  }

  if (!dashboard) {
    return (
      <PageShell title={t("nav.dashboard")}>
        <p className="text-white/70">{t("common.loading")}</p>
      </PageShell>
    );
  }

  const { metrics, revenueTrend, recentOrders = [], topSelling = [] } = dashboard;

  const cards = [
    { title: t("dashboard.revenue"), value: formatPrice(metrics.revenue) },
    { title: t("dashboard.deliveryRevenue"), value: formatPrice(metrics.deliveryRevenue) },
    { title: t("dashboard.orders"), value: formatNumber(metrics.orders) },
    { title: t("dashboard.users"), value: formatNumber(metrics.users) },
    { title: t("dashboard.growth"), value: `${metrics.growth >= 0 ? "+" : ""}${formatNumber(metrics.growth)}%` },
    { title: t("dashboard.underReview"), value: formatNumber(metrics.ordersUnderReview), alert: metrics.ordersUnderReview > 0 },
    { title: t("dashboard.blocked"), value: formatNumber(metrics.ordersBlocked) },
    { title: t("dashboard.markedFake"), value: formatNumber(metrics.ordersMarkedFake) },
  ];

  // Recharts needs plain numbers, and the axis label follows the active language.
  const chartData = (revenueTrend || []).map((point) => ({ ...point, label: pick(point.name, point.nameBn) }));

  return (
    <PageShell title={t("nav.dashboard")}>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className={`rounded-2xl p-5 transition ${card.alert ? "bg-amber-400/20" : "bg-white/5"}`}>
            <h2 className="text-sm text-white/60">{card.title}</h2>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Chart title={t("dashboard.revenueTrend")}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <Tooltip formatter={(value) => formatPrice(value)} contentStyle={{ background: "#062B63", border: "none", borderRadius: 8 }} />
            <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </Chart>

        <Chart title={t("dashboard.ordersOverview")}>
          <BarChart data={chartData}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: "#062B63", border: "none", borderRadius: 8 }} />
            <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </Chart>
      </div>

      <div className="mb-8 rounded-2xl bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold">{t("dashboard.topSelling")}</h2>
        {topSelling.length ? (
          <div className="space-y-1">
            {topSelling.map((item) => (
              <div key={item._id} className="flex items-center justify-between gap-4 border-b border-white/10 py-3 last:border-0">
                <span className="min-w-0 truncate">{item.title}</span>
                <span className="shrink-0 text-green-300">{t("dashboard.sold", { count: formatNumber(item.sold) })}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote message={t("dashboard.noSales")} />
        )}
      </div>

      <div className="rounded-2xl bg-white/5 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t("dashboard.recentOrders")}</h2>
          <span className="text-sm text-white/60">{t("dashboard.visitors", { count: formatNumber(metrics.uniqueVisitors) })}</span>
        </div>

        {recentOrders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-white/20 text-sm text-white/60">
                  <th className="pb-2 pr-4">{t("orders.orderNumber")}</th>
                  <th className="pb-2 pr-4">{t("orders.customer")}</th>
                  <th className="pb-2 pr-4">{t("orders.deliveryStatus")}</th>
                  <th className="pb-2 pr-4">{t("orders.risk")}</th>
                  <th className="pb-2">{t("orders.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className="border-b border-white/10 last:border-0">
                    <td className="py-3 pr-4 font-mono text-sm">{order.orderNumber}</td>
                    <td className="py-3 pr-4">
                      {order.customer?.name || order.user?.fullname || t("orders.guest")}
                      {order.isGuest && <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px]">{t("orders.guest")}</span>}
                    </td>
                    <td className="py-3 pr-4"><StatusBadge kind="delivery" value={order.deliveryStatus} /></td>
                    <td className="py-3 pr-4"><StatusBadge kind="fraud" value={order.fraudStatus} /></td>
                    <td className="py-3">{formatPrice(order.totalprice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyNote message={t("dashboard.noOrders")} />
        )}
      </div>
    </PageShell>
  );
}

function Chart({ title, children }) {
  return (
    <div className="rounded-2xl bg-white/5 p-6">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
