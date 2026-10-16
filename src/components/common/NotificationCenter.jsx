import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, EmptyNote } from "./PageShell";
import { useNotificationText } from "./notificationText";

const CATEGORIES = ["subscription", "payment", "support", "suspension", "reactivation", "application"];
/** Merchants never get application notices. */
const MERCHANT_CATEGORIES = CATEGORIES.filter((category) => category !== "application");

const chipClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"}`;

/**
 * Notification Center: every notification, grouped (expiry alerts, payments,
 * support, suspensions, reactivations, applications), with paging. For
 * administrators it also shows when the automatic subscription check last ran.
 */
export default function NotificationCenter({ role = "admin" }) {
  const { t, apiMessage, language, formatNumber } = useLanguage();
  const describe = useNotificationText(role);
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const base = role === "merchant" ? "/merchant" : "/admin";
  const categories = role === "merchant" ? MERCHANT_CATEGORIES : CATEGORIES;

  const load = useCallback(
    () => api.get(`${base}/notification-center`, { params: { category: category || undefined, page } }).then((response) => setData(response.data.data)),
    [base, category, page]
  );

  useEffect(() => {
    load().catch((caught) => {
      setData({ items: [], pages: 1, page: 1, unreadByCategory: {} });
      setError(apiMessage(caught));
    });
  }, [load, apiMessage]);

  const update = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!("page" in changes)) next.delete("page");
    setSearchParams(next);
  };

  const markRead = async (ids) => {
    await api.post(`${base}/notifications/read`, ids ? { ids } : {}).catch(() => {});
    load().catch(() => {});
  };

  const when = (value) =>
    new Date(value).toLocaleString(language === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

  const unread = data?.unreadByCategory || {};
  const totalUnread = Object.values(unread).reduce((sum, count) => sum + count, 0);

  return (
    <PageShell
      title={t("center.title")}
      subtitle={t(role === "merchant" ? "center.subtitleMerchant" : "center.subtitle")}
      actions={
        totalUnread > 0 && (
          <button type="button" onClick={() => markRead()} className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25">
            {t("inbox.markAll")}
          </button>
        )
      }
    >
      <ErrorNote message={error} />

      <div className="mb-5 flex flex-wrap gap-2" role="group">
        <button type="button" onClick={() => update({ category: "" })} aria-pressed={!category} className={chipClass(!category)}>
          {t("common.all")}
          {totalUnread ? ` · ${formatNumber(totalUnread)}` : ""}
        </button>
        {categories.map((key) => (
          <button key={key} type="button" onClick={() => update({ category: key })} aria-pressed={category === key} className={chipClass(category === key)}>
            {t(`center.cat.${key}`)}
            {unread[key] ? ` · ${formatNumber(unread[key])}` : ""}
          </button>
        ))}
      </div>

      {data === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : data.items.length ? (
        <>
          <ul className="max-w-4xl space-y-2">
            {data.items.map((item) => (
              <li key={item._id} className={`flex flex-wrap items-start gap-3 rounded-xl p-4 ${item.readAt ? "bg-white/5" : "bg-white/15 ring-1 ring-green-300/40"}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-transparent" : "bg-green-400"}`} />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm">{describe(item)}</p>
                  <p className="mt-1 text-xs text-white/50">
                    {when(item.createdAt)}
                    {item.category && ` · ${t(`center.cat.${item.category}`)}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {item.link && (
                    <Link to={item.link} onClick={() => !item.readAt && markRead([item._id])} className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold hover:bg-blue-400">
                      {t("common.view")}
                    </Link>
                  )}
                  {!item.readAt && (
                    <button type="button" onClick={() => markRead([item._id])} className="rounded-lg bg-white/15 px-3 py-1.5 text-xs hover:bg-white/25">
                      {t("center.markRead")}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {data.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <button type="button" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} className="rounded-lg bg-white/15 px-4 py-2 disabled:opacity-40">
                {t("audit.prev")}
              </button>
              <span>{t("audit.page", { page: formatNumber(data.page), pages: formatNumber(data.pages) })}</span>
              <button type="button" disabled={page >= data.pages} onClick={() => update({ page: String(page + 1) })} className="rounded-lg bg-white/15 px-4 py-2 disabled:opacity-40">
                {t("audit.next")}
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyNote message={t("inbox.empty")} />
      )}

      {data?.billingJob && (
        <p className="mt-6 text-xs text-white/50">
          {t("mlist.lastCheck", { when: data.billingJob.lastFinishedAt ? when(data.billingJob.lastFinishedAt) : "—" })}
          {data.billingJob.lastError && <span className="text-red-200"> · {data.billingJob.lastError}</span>}
        </p>
      )}
    </PageShell>
  );
}
