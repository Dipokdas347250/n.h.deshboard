import { Fragment, useEffect, useState } from "react";
import { FaComputer, FaMobileScreen, FaTabletScreenButton, FaCircleQuestion } from "react-icons/fa6";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { datePresets, todayInDhaka } from "../../lib/dates";
import { PageShell, ErrorNote, EmptyNote, inputClass } from "../common/PageShell";

const PRESETS = ["today", "yesterday", "last7", "thisMonth", "last30"];

const EMPTY = { visits: 0, uniqueVisitors: 0, signedInVisitors: 0, pageViews: 0, averageDuration: 0, devices: [], browsers: [], os: [], topPaths: [], sessions: [], page: 1, pages: 1 };

const DEVICE_ICON = { mobile: FaMobileScreen, tablet: FaTabletScreenButton, desktop: FaComputer };
const DEVICE_COLOUR = { mobile: "bg-green-400", tablet: "bg-amber-400", desktop: "bg-blue-400" };

const chipClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    active ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"
  }`;

/** "facebook.com" from a referrer URL, or "" when there is none. */
const sourceOf = (referrer) => {
  try {
    return referrer ? new URL(referrer).hostname.replace(/^(www\.|m\.|l\.|lm\.)/, "") : "";
  } catch {
    return "";
  }
};

export default function Analytics() {
  const { t, language, apiMessage, formatNumber } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState(() => ({ preset: "last7", ...datePresets().last7 }));
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const { from, to } = range;

  useEffect(() => {
    let active = true;

    api.get("/admin/analytics", { params: { from, to, page } })
      .then((response) => {
        if (!active) return;
        setData({ ...EMPTY, ...response.data.data });
        setError("");
      })
      .catch((caught) => {
        if (!active) return;
        setData(EMPTY);
        setError(apiMessage(caught));
      });

    return () => {
      active = false;
    };
  }, [from, to, page, apiMessage]);

  const changeRange = (next) => {
    setRange(next);
    setPage(1);
    setOpen(null);
  };
  const choosePreset = (preset) => changeRange({ preset, ...datePresets()[preset] });
  const chooseDate = (field, value) => {
    if (!value) return;
    const next = { ...range, preset: "custom", [field]: value };
    // Keep the span the right way round when one end jumps past the other.
    if (next.from > next.to) next[field === "from" ? "to" : "from"] = value;
    changeRange(next);
  };

  const duration = (seconds) => {
    const total = Math.round(seconds || 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h) return t("analytics.hm", { h: formatNumber(h), m: formatNumber(m) });
    if (m) return t("analytics.ms", { m: formatNumber(m), s: formatNumber(s) });
    return t("analytics.s", { s: formatNumber(s) });
  };

  const dateTime = (value) =>
    new Date(value).toLocaleString(language === "bn" ? "bn-BD" : "en-GB", {
      timeZone: "Asia/Dhaka",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });

  const deviceLabel = (device) => t(`analytics.device.${DEVICE_ICON[device] ? device : "unknown"}`);

  return (
    <PageShell title={t("analytics.title")} subtitle={t("analytics.subtitle")}>
      <div className="mb-6 space-y-3 rounded-2xl bg-white/5 p-4">
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

      <ErrorNote message={error} />

      {data === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Stat label={t("analytics.visits")} value={formatNumber(data.visits)} />
            <Stat label={t("analytics.uniqueVisitors")} value={formatNumber(data.uniqueVisitors)} />
            <Stat label={t("analytics.signedIn")} value={formatNumber(data.signedInVisitors)} />
            <Stat label={t("analytics.pageViews")} value={formatNumber(data.pageViews)} />
            <Stat label={t("analytics.avgTime")} value={duration(data.averageDuration)} />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <Panel title={t("analytics.devices")}>
              {data.devices.length ? (
                <>
                  <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-white/10">
                    {data.devices.map((item) => (
                      <span
                        key={item.name}
                        className={DEVICE_COLOUR[item.name] || "bg-white/40"}
                        style={{ width: `${(item.count / data.visits) * 100}%` }}
                        title={deviceLabel(item.name)}
                      />
                    ))}
                  </div>
                  {data.devices.map((item) => {
                    const Icon = DEVICE_ICON[item.name] || FaCircleQuestion;
                    return (
                      <div key={item.name} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                        <span className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${DEVICE_COLOUR[item.name] || "bg-white/40"}`} aria-hidden="true" />
                          <Icon className="text-white/70" aria-hidden="true" />
                          {deviceLabel(item.name)}
                        </span>
                        <span className="text-white/70">
                          {formatNumber(item.count)} · {formatNumber(Math.round((item.count / data.visits) * 100))}%
                        </span>
                      </div>
                    );
                  })}
                </>
              ) : (
                <p className="text-sm text-white/50">{t("common.none")}</p>
              )}
            </Panel>
            <Panel title={t("analytics.browsers")}>
              <Bars items={data.browsers} total={data.visits} label={(name) => (name === "unknown" || !name ? t("analytics.unknown") : name)} formatNumber={formatNumber} emptyText={t("common.none")} />
            </Panel>
            <Panel title={t("analytics.os")}>
              <Bars items={data.os} total={data.visits} label={(name) => (name === "unknown" || !name ? t("analytics.unknown") : name)} formatNumber={formatNumber} emptyText={t("common.none")} />
            </Panel>
          </div>

          <div className="mb-6 rounded-xl bg-white/10 p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{t("analytics.visitorsTitle")}</h2>
              <p className="text-xs text-white/50">{t("analytics.timingNote")}</p>
            </div>

            {data.sessions.length ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/20 text-white/60">
                        <th className="py-3 pr-4 font-medium">{t("analytics.who")}</th>
                        <th className="py-3 pr-4 font-medium">{t("analytics.deviceCol")}</th>
                        <th className="py-3 pr-4 font-medium">{t("analytics.timeOnSite")}</th>
                        <th className="py-3 pr-4 font-medium">{t("analytics.pagesCol")}</th>
                        <th className="py-3 pr-4 font-medium">{t("analytics.cameFrom")}</th>
                        <th className="py-3 font-medium">{t("analytics.when")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sessions.map((session) => {
                        const Icon = DEVICE_ICON[session.device] || FaCircleQuestion;

                        const expanded = open === session._id;
                        return (
                          <Fragment key={session._id}>
                            <tr className="border-b border-white/10 align-top">
                              <td className="py-3 pr-4">
                                {session.user ? (
                                  <>
                                    <span className="block font-semibold">{session.user.fullname || session.user.email}</span>
                                    <span className="block text-xs text-white/60">{[session.user.phone, session.user.email].filter(Boolean).join(" · ")}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="block font-semibold">
                                      {t("analytics.guest")} <span className="font-mono text-xs font-normal text-white/50">#{session.visitorKey.slice(0, 6)}</span>
                                    </span>
                                  </>
                                )}
                                <span className="mt-0.5 block text-xs text-green-200">
                                  {session.totalVisits > 1 ? t("analytics.visitNumber", { count: formatNumber(session.totalVisits) }) : t("analytics.firstVisit")}
                                </span>
                              </td>
                              <td className="py-3 pr-4">
                                <span className="flex items-center gap-2 font-medium">
                                  <Icon className="text-white/70" aria-hidden="true" />
                                  {deviceLabel(session.device)}
                                </span>
                                {session.os && (
                                  <span className="block text-xs text-white/60">
                                    {session.os} · {session.browser}
                                    {session.screen && ` · ${session.screen}`}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 pr-4 font-semibold">{session.timed ? duration(session.duration) : <span className="font-normal text-white/50">{t("analytics.untimed")}</span>}</td>
                              <td className="py-3 pr-4">
                                <button
                                  type="button"
                                  onClick={() => setOpen(expanded ? null : session._id)}
                                  aria-expanded={expanded}
                                  className="text-left text-green-300 hover:text-green-200"
                                >
                                  {t("analytics.pagesCount", { count: formatNumber(session.pages.length) })} {expanded ? "▴" : "▾"}
                                </button>
                                <span className="block max-w-[14rem] truncate font-mono text-xs text-white/50">{session.path}</span>
                              </td>
                              <td className="py-3 pr-4">{sourceOf(session.referrer) || <span className="text-white/50">{t("analytics.direct")}</span>}</td>
                              <td className="whitespace-nowrap py-3 text-white/70">{dateTime(session.createdAt)}</td>
                            </tr>
                            {expanded && (
                              <tr className="border-b border-white/10 bg-white/5">
                                <td colSpan={6} className="px-4 py-3">
                                  <ol className="space-y-1">
                                    {session.pages.map((visit, index) => (
                                      <li key={`${visit.path}-${index}`} className="flex gap-3 text-xs">
                                        <span className="w-24 shrink-0 text-white/50">{visit.at ? dateTime(visit.at) : ""}</span>
                                        <span className="font-mono">{visit.path}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {data.pages > 1 && (
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20 disabled:opacity-40">
                      ← {t("analytics.prev")}
                    </button>
                    <span className="text-white/60">{t("analytics.pageOf", { page: formatNumber(page), pages: formatNumber(data.pages) })}</span>
                    <button type="button" disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20 disabled:opacity-40">
                      {t("analytics.next")} →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyNote message={t("common.none")} />
            )}
          </div>

          <Panel title={t("analytics.topPages")}>
            {data.topPaths?.length ? (
              data.topPaths.map((item) => (
                <div key={item.path} className="flex flex-wrap justify-between gap-2 border-b border-white/10 py-3 last:border-0">
                  <span className="font-mono text-sm">{item.path}</span>
                  <span className="text-sm text-white/70">
                    {t("analytics.visitorsVisits", { visitors: formatNumber(item.visitors), visits: formatNumber(item.visits) })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/50">{t("common.none")}</p>
            )}
          </Panel>
        </>
      )}
    </PageShell>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <h2 className="text-sm text-white/60">{label}</h2>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-xl bg-white/10 p-5">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

/** Share of visits per name as thin horizontal bars. */
function Bars({ items, total, label, formatNumber, emptyText }) {
  if (!items.length) return <p className="text-sm text-white/50">{emptyText}</p>;
  return items.map((item) => {
    const share = total ? Math.round((item.count / total) * 100) : 0;
    return (
      <div key={item.name} className="py-1.5 text-sm">
        <div className="mb-1 flex justify-between gap-3">
          <span>{label(item.name)}</span>
          <span className="text-white/70">
            {formatNumber(item.count)} · {formatNumber(share)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <span className="block h-full rounded-full bg-green-400" style={{ width: `${share}%` }} />
        </div>
      </div>
    );
  });
}
