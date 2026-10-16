import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { api } from "../../lib/api";
import { merchantCode } from "../../lib/merchantCode";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, EmptyNote } from "../common/PageShell";

const GROUPS = ["payment", "account", "subscription", "ticket"];

const chipClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"}`;

const DATE_KEYS = ["periodStart", "periodEnd", "graceEndsAt", "trialEndsAt"];
const MONEY_KEYS = ["amount"];

/** The details object as short "key: value" lines, with dates and money formatted. */
function Details({ details }) {
  const { formatDate, formatPrice } = useLanguage();
  const entries = Object.entries(details || {}).filter(([, value]) => value !== null && value !== "" && value !== undefined);
  if (!entries.length) return null;
  const show = (key, value) => {
    if (DATE_KEYS.includes(key)) return formatDate(value);
    if (MONEY_KEYS.includes(key)) return formatPrice(value);
    if (value && typeof value === "object") return Object.values(value).map(String).join(" → ");
    return String(value);
  };
  return (
    <ul className="space-y-0.5 text-xs text-white/70">
      {entries.map(([key, value]) => (
        <li key={key}>
          <span className="text-white/50">{key}:</span> {show(key, value)}
        </li>
      ))}
    </ul>
  );
}

/** Who did what to merchant payments, accounts and tickets. Read-only by design. */
export default function AuditLog() {
  const { t, apiMessage, language, formatNumber } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const group = searchParams.get("group") || "";
  const merchant = searchParams.get("merchant") || "";
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/admin/audit-logs", { params: { group: group || undefined, merchant: merchant || undefined, page } })
      .then((response) => active && setData(response.data.data))
      .catch((caught) => {
        if (!active) return;
        setData({ entries: [], page: 1, pages: 1 });
        setError(apiMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [group, merchant, page, apiMessage]);

  const update = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!("page" in changes)) next.delete("page");
    setSearchParams(next);
  };

  const when = (value) =>
    new Date(value).toLocaleString(language === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <PageShell title={t("audit.title")} subtitle={t("audit.subtitle")}>
      <ErrorNote message={error} />

      <div className="mb-5 flex flex-wrap items-center gap-2" role="group">
        <button type="button" onClick={() => update({ group: "" })} aria-pressed={!group} className={chipClass(!group)}>
          {t("common.all")}
        </button>
        {GROUPS.map((key) => (
          <button key={key} type="button" onClick={() => update({ group: key })} aria-pressed={group === key} className={chipClass(group === key)}>
            {t(`audit.group.${key}`)}
          </button>
        ))}
        {merchant && (
          <button type="button" onClick={() => update({ merchant: "" })} className="ml-2 rounded-full bg-amber-400/20 px-4 py-2 text-sm text-amber-100">
            {t("audit.filterMerchant")} ({merchantCode(merchant)}) · {t("audit.clearMerchant")}
          </button>
        )}
      </div>

      {data === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : data.entries.length ? (
        <>
          <div className="overflow-x-auto rounded-xl bg-white/5">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-white/10 text-white/70">
                <tr>
                  <th className="p-3">{t("audit.when")}</th>
                  <th className="p-3">{t("audit.action")}</th>
                  <th className="p-3">{t("audit.merchant")}</th>
                  <th className="p-3">{t("audit.by")}</th>
                  <th className="p-3">{t("audit.details")}</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => (
                  <tr key={entry._id} className="border-t border-white/10 align-top">
                    <td className="whitespace-nowrap p-3">{when(entry.createdAt)}</td>
                    <td className="p-3 font-semibold">{t(`audit.${entry.action}`)}</td>
                    <td className="p-3">
                      {entry.merchant ? (
                        <button type="button" onClick={() => update({ merchant: entry.merchant })} className="text-left hover:underline">
                          <span className="block">{entry.merchantName}</span>
                          <span className="block font-mono text-xs text-white/50">{merchantCode(entry.merchant)}</span>
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">
                      <span className="block">{entry.actorType === "system" ? t("audit.system") : entry.actorName}</span>
                      {entry.ip && <span className="block text-xs text-white/40">{entry.ip}</span>}
                    </td>
                    <td className="p-3">
                      <Details details={entry.details} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <EmptyNote message={t("audit.none")} />
      )}
    </PageShell>
  );
}
