import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { ErrorNote } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";

const METRICS = ["revenue", "orders"];

/**
 * The account for the chosen days: money in, where it came from, how it moved
 * through the day (or across the days), and what sold. Printable.
 */
export default function OrdersReport({ from, to }) {
  const { t, language, apiMessage, formatPrice, formatNumber } = useLanguage();
  // Each result remembers which period it answers, so switching periods shows
  // "loading" instead of the previous period's numbers.
  const [loaded, setLoaded] = useState({ period: null, report: null, error: "" });
  const [metric, setMetric] = useState("revenue");
  const period = `${from}|${to}`;

  useEffect(() => {
    let active = true;

    api.get("/admin/orders-report", { params: { from, to } })
      .then((response) => {
        if (active) setLoaded({ period: `${from}|${to}`, report: response.data.data, error: "" });
      })
      .catch((caught) => {
        if (active) setLoaded({ period: `${from}|${to}`, report: null, error: apiMessage(caught) });
      });

    return () => {
      active = false;
    };
  }, [from, to, apiMessage]);

  const current = loaded.period === period ? loaded : { report: null, error: "" };
  const { report, error } = current;

  if (error) return <ErrorNote message={error} />;
  if (!report) return <p className="mb-8 text-white/70">{t("common.loading")}</p>;

  const { summary, timeline, byStatus, topProducts, range } = report;
  const locale = language === "bn" ? "bn-BD" : "en-GB";

  const bucketLabel = (key) => {
    if (range.granularity === "hour") return `${formatNumber(Number(key))}:${language === "bn" ? "০০" : "00"}`;
    const options = range.granularity === "month" ? { month: "short", year: "numeric" } : { day: "numeric", month: "short" };
    return new Date(`${key.length === 7 ? `${key}-01` : key}T00:00:00Z`).toLocaleDateString(locale, { ...options, timeZone: "UTC" });
  };
  const chartData = timeline.map((point) => ({ ...point, label: bucketLabel(point.key) }));
  const formatMetric = (value) => (metric === "revenue" ? formatPrice(value) : formatNumber(value));

  const cards = [
    { label: t("report.sales"), value: formatPrice(summary.revenue), hint: t("report.salesHint"), hero: true },
    { label: t("report.orders"), value: formatNumber(summary.orders), hint: t("report.placedHint", { count: formatNumber(summary.placed) }) },
    { label: t("report.goods"), value: formatPrice(summary.goods) },
    { label: t("report.delivery"), value: formatPrice(summary.delivery) },
    { label: t("report.items"), value: formatNumber(summary.items) },
    { label: t("report.average"), value: formatPrice(summary.averageOrder) },
    { label: t("report.cod"), value: formatPrice(summary.cod) },
    { label: t("report.online"), value: formatPrice(summary.online) },
    { label: t("report.paid"), value: formatPrice(summary.paid) },
    { label: t("report.collected"), value: formatPrice(summary.delivered), hint: t("report.collectedHint") },
  ];

  const periodLabel =
    range.from === range.to
      ? t(range.from === range.today ? "report.periodToday" : "report.periodDay", { date: bucketLabel(range.from) })
      : t("report.periodRange", { from: bucketLabel(range.from), to: bucketLabel(range.to) });

  return (
    <section className="report mb-8 space-y-6" aria-label={t("report.title")}>
      <div>
        <h2 className="text-xl font-bold">{t("report.title")}</h2>
        <p className="text-sm text-white/60">{periodLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`report-card rounded-2xl p-4 ${card.hero ? "col-span-2 bg-green-500/20 md:col-span-1" : "bg-white/5"}`}
          >
            <h3 className="text-xs text-white/60">{card.label}</h3>
            <p className={`mt-1 font-bold tabular-nums ${card.hero ? "text-3xl" : "text-xl"}`}>{card.value}</p>
            {card.hint && <p className="mt-1 text-[11px] text-white/50">{card.hint}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="report-card rounded-2xl bg-white/5 p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">
              {t(range.granularity === "hour" ? "report.byHour" : range.granularity === "month" ? "report.byMonth" : "report.byDay")}
            </h3>
            <div className="no-print flex rounded-full bg-white/10 p-1 text-xs" role="group">
              {METRICS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMetric(key)}
                  aria-pressed={metric === key}
                  className={`rounded-full px-3 py-1 font-semibold ${metric === key ? "bg-white text-[#062B63]" : "text-white/80"}`}
                >
                  {t(`report.metric.${key}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" tickLine={false} fontSize={11} minTickGap={8} />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={64}
                  allowDecimals={false}
                  tickFormatter={formatMetric}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.06)" }}
                  formatter={(value) => [formatMetric(value), t(`report.metric.${metric}`)]}
                  contentStyle={{ background: "#031d43", border: "none", borderRadius: 8, color: "#fff" }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                />
                <Bar dataKey={metric} fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card rounded-2xl bg-white/5 p-5">
          <h3 className="mb-3 font-semibold">{t("report.byStatus")}</h3>
          {byStatus.length ? (
            <ul className="space-y-2">
              {byStatus.map((item) => (
                <li key={item.status} className="flex items-center justify-between gap-3 text-sm">
                  <StatusBadge kind="delivery" value={item.status} />
                  <span className="tabular-nums text-white/80">
                    {formatNumber(item.count)} · {formatPrice(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/60">{t("report.noOrders")}</p>
          )}
        </div>
      </div>

      <div className="report-card rounded-2xl bg-white/5 p-5">
        <h3 className="mb-3 font-semibold">{t("report.topProducts")}</h3>
        {topProducts.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/20 text-white/60">
                  <th className="pb-2 pr-4">{t("report.product")}</th>
                  <th className="pb-2 pr-4 text-right">{t("report.quantity")}</th>
                  <th className="pb-2 text-right">{t("report.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((item) => (
                  <tr key={item.product || item.title} className="border-b border-white/10 last:border-0">
                    <td className="py-2 pr-4">{item.title}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{formatNumber(item.quantity)}</td>
                    <td className="py-2 text-right tabular-nums">{formatPrice(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-white/60">{t("report.noOrders")}</p>
        )}
      </div>
    </section>
  );
}
