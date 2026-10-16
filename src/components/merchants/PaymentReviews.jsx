import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "../../lib/api";
import { merchantCode } from "../../lib/merchantCode";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, Field, inputClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";
import Modal from "../common/Modal";

const TABS = ["new", "pending", "approved", "activated", "rejected", "all"];

const chipClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"}`;

const methodLabel = (t, submission) => (submission.method === "other" ? submission.methodOther || t("method.other") : t(`method.${submission.method}`));

/** One payment proof with everything needed to verify it, and the approve / reject / activate actions. */
function PaymentDetail({ id, periodDays, onClose, onChanged }) {
  const { t, apiMessage, formatDate, formatPrice, formatNumber, language } = useLanguage();
  const [submission, setSubmission] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => api.get(`/admin/payment-submissions/${id}`).then((response) => setSubmission(response.data.data)), [id]);

  useEffect(() => {
    load().catch((caught) => setError(apiMessage(caught)));
  }, [load, apiMessage]);

  const run = async (action, body) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post(`/admin/payment-submissions/${id}/${action}`, body);
      setNotice(apiMessage({ response }));
      await load();
      onChanged();
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const when = (value) =>
    new Date(value).toLocaleString(language === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

  const merchant = submission?.merchant;

  return (
    <Modal title={submission ? `${formatPrice(submission.amount)} · ${merchant?.name || ""}` : t("pay.review")} onClose={onClose} wide>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />
      {!submission ? (
        !error && <p className="text-white/70">{t("common.loading")}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <a href={submission.screenshot?.url} target="_blank" rel="noreferrer noopener" title={t("pay.openScreenshot")}>
              <img src={submission.screenshot?.url} alt={t("billing.screenshot")} className="max-h-[28rem] w-full rounded-xl bg-white/5 object-contain" />
            </a>
            <p className="mt-1 text-center text-xs text-white/50">{t("pay.openScreenshot")}</p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge kind="payment" value={submission.status} />
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <div className={`rounded-lg p-3 ${submission.expectedAmount && submission.amount < submission.expectedAmount ? "bg-red-500/20" : "bg-white/5"}`}>
                <dt className="text-white/60">{t("pay.amount")}</dt>
                <dd className="text-lg font-bold">{formatPrice(submission.amount)}</dd>
                {submission.expectedAmount > 0 && (
                  <dd className={`text-xs ${submission.amount < submission.expectedAmount ? "text-red-100" : "text-white/60"}`}>
                    {t(submission.amount < submission.expectedAmount ? "pay.lessThanFee" : "pay.expectedFee", { amount: formatPrice(submission.expectedAmount) })}
                  </dd>
                )}
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <dt className="text-white/60">{t("pay.method")}</dt>
                <dd className="font-semibold">{methodLabel(t, submission)}</dd>
              </div>
              <div className="col-span-2 rounded-lg bg-white/5 p-3">
                <dt className="text-white/60">{t("pay.transactionId")}</dt>
                <dd className="select-all break-all font-mono text-base font-bold">{submission.transactionId}</dd>
              </div>
              <div className="col-span-2 rounded-lg bg-white/5 p-3">
                <dt className="text-white/60">{t("pay.submitted")}</dt>
                <dd>{when(submission.createdAt)}</dd>
              </div>
            </dl>
            {submission.message && (
              <div className="rounded-lg bg-white/5 p-3">
                <p className="text-white/60">{t("pay.message")}</p>
                <p className="whitespace-pre-wrap">{submission.message}</p>
              </div>
            )}
            {submission.sameTransaction?.length > 0 && (
              <div className="rounded-lg bg-red-500/20 p-3 text-red-100">
                <p className="font-semibold">{t("pay.sameTransaction")}</p>
                <ul className="mt-1 list-disc pl-5">
                  {submission.sameTransaction.map((other) => (
                    <li key={other._id}>
                      {other.merchant?.name} · {formatPrice(other.amount)} · {t(`pstatusShort.${other.status}`)} · {formatDate(other.createdAt)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {merchant && (
              <div className="rounded-lg bg-white/5 p-3">
                <p className="font-semibold">
                  {merchant.name} <span className="font-mono text-xs text-white/60">{merchantCode(merchant._id)}</span>
                </p>
                <p className="text-white/60">
                  {merchant.phone} · {merchant.email}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge kind="merchant" value={merchant.status} />
                  {merchant.locked && <StatusBadge kind="merchant" value="locked" />}
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-1 text-xs text-white/70">
                  <dt>{t("pay.fee")}</dt>
                  <dd>{formatPrice(merchant.monthlyFee)}</dd>
                  <dt>{t("pay.paidUntil")}</dt>
                  <dd>{merchant.paidUntil ? formatDate(merchant.paidUntil) : "—"}</dd>
                  <dt>{t("pay.trialEnds")}</dt>
                  <dd>{merchant.trialEndsAt ? formatDate(merchant.trialEndsAt) : "—"}</dd>
                  {merchant.graceEndsAt && merchant.status === "payment_due" && (
                    <>
                      <dt>{t("pay.graceEnds")}</dt>
                      <dd>{formatDate(merchant.graceEndsAt)}</dd>
                    </>
                  )}
                </dl>
              </div>
            )}

            {submission.status === "pending" && (
              <div className="space-y-3 rounded-xl bg-white/5 p-4">
                <button type="button" disabled={busy} onClick={() => run("approve")} className="w-full rounded-lg bg-green-500 py-2 font-semibold text-white hover:bg-green-400 disabled:opacity-40">
                  {t("pay.approve")}
                </button>
                <p className="text-xs text-white/50">{t("pay.approveNote")}</p>
              </div>
            )}
            {submission.status === "approved" && (
              <div className="space-y-2 rounded-xl bg-green-500/10 p-4">
                <button type="button" disabled={busy} onClick={() => run("activate")} className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white hover:bg-green-400 disabled:opacity-40">
                  {t("pay.activate")}
                </button>
                <p className="text-xs text-white/60">{t("pay.activateNote", { days: formatNumber(periodDays) })}</p>
              </div>
            )}
            {["pending", "approved"].includes(submission.status) && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  run("reject", { reason });
                }}
                className="space-y-2 rounded-xl bg-red-500/10 p-4"
              >
                <Field label={t("pay.rejectReason")} htmlFor="reject-reason">
                  <input id="reject-reason" required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className={`${inputClass} !p-2`} />
                </Field>
                <button disabled={busy} className="w-full rounded-lg bg-red-600 py-2 font-semibold text-white hover:bg-red-500 disabled:opacity-40">
                  {t("pay.reject")}
                </button>
              </form>
            )}
            {submission.status === "rejected" && submission.rejectionReason && (
              <p className="rounded-lg bg-red-500/20 p-3 text-red-100">{t("billing.rejectedBecause", { reason: submission.rejectionReason })}</p>
            )}
            {submission.status === "activated" && submission.periodEnd && (
              <p className="rounded-lg bg-green-500/20 p-3 text-green-100">
                {t("billing.activePeriod", { from: formatDate(submission.periodStart), to: formatDate(submission.periodEnd) })}
              </p>
            )}

            {submission.trail?.length > 0 && (
              <div>
                <p className="mb-1 font-semibold">{t("pay.trail")}</p>
                <ul className="space-y-1 text-xs text-white/70">
                  {submission.trail.map((entry) => (
                    <li key={entry._id}>
                      {when(entry.createdAt)} · {t(`audit.${entry.action}`)} · {entry.actorName || t("audit.system")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {submission.history?.length > 0 && (
              <div>
                <p className="mb-1 font-semibold">{t("pay.history")}</p>
                <ul className="space-y-1 text-xs text-white/70">
                  {submission.history.map((entry) => (
                    <li key={entry._id}>
                      {formatDate(entry.createdAt)} · {formatPrice(entry.amount)} · <span className="font-mono">{entry.transactionId}</span> · {t(`pstatusShort.${entry.status}`)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Merchants' payment proofs, oldest waiting first. `?open=<id>` opens one (from a notification). */
export default function PaymentReviews() {
  const { t, apiMessage, formatPrice, formatNumber, formatDate } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const merchantFilter = searchParams.get("merchant") || "";
  const open = searchParams.get("open");
  // One merchant's proofs are few, so show all of them; otherwise start with the queue.
  const [tab, setTab] = useState(merchantFilter ? "all" : "new");
  const [data, setData] = useState(null);
  const [periodDays, setPeriodDays] = useState(30);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      api
        .get("/admin/payment-submissions", { params: { status: tab, ...(merchantFilter ? { merchant: merchantFilter } : {}) } })
        .then((response) => response.data.data),
    [tab, merchantFilter]
  );

  useEffect(() => {
    let active = true;
    load()
      .then((result) => active && setData(result))
      .catch((caught) => {
        if (!active) return;
        setData({ submissions: [], counts: {} });
        setError(apiMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [load, apiMessage]);

  useEffect(() => {
    api.get("/admin/settings")
      .then((response) => setPeriodDays(response.data.data.merchantBilling?.periodDays || 30))
      .catch(() => {});
  }, []);

  const refresh = () => load().then(setData).catch(() => {});
  const setOpen = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("open", id);
    else next.delete("open");
    setSearchParams(next, { replace: true });
  };

  return (
    <PageShell
      title={t("pay.title")}
      subtitle={t("pay.subtitle")}
      actions={
        <Link to="/merchants/audit?group=payment" className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25">
          {t("nav.auditLog")}
        </Link>
      }
    >
      <ErrorNote message={error} />

      <div className="mb-5 flex flex-wrap gap-2" role="group">
        {TABS.map((key) => (
          <button key={key} type="button" onClick={() => setTab(key)} aria-pressed={tab === key} className={chipClass(tab === key)}>
            {t(`pay.tab.${key}`)}
            {key !== "all" && data?.counts?.[key] !== undefined ? ` · ${formatNumber(data.counts[key])}` : ""}
          </button>
        ))}
      </div>

      {data === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : data.submissions.length ? (
        <div className="overflow-x-auto rounded-xl bg-white/5">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/10 text-white/70">
              <tr>
                <th className="p-3">{t("pay.merchant")}</th>
                <th className="p-3">{t("pay.amount")}</th>
                <th className="p-3">{t("pay.transactionId")}</th>
                <th className="p-3">{t("pay.submitted")}</th>
                <th className="p-3">{t("support.status")}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.submissions.map((submission) => (
                <tr key={submission._id} className="border-t border-white/10">
                  <td className="p-3">
                    <span className="block font-semibold">{submission.merchant?.name}</span>
                    <span className="block font-mono text-xs text-white/60">{merchantCode(submission.merchant?._id)}</span>
                    {submission.merchant && <StatusBadge kind="merchant" value={submission.merchant.status} />}
                  </td>
                  <td className="p-3">
                    <span className="block font-semibold">{formatPrice(submission.amount)}</span>
                    <span className="block text-xs text-white/60">{methodLabel(t, submission)}</span>
                  </td>
                  <td className="p-3 font-mono">{submission.transactionId}</td>
                  <td className="p-3">{formatDate(submission.createdAt)}</td>
                  <td className="p-3">
                    <StatusBadge kind="paymentShort" value={submission.status} />
                  </td>
                  <td className="p-3 text-right">
                    <button type="button" onClick={() => setOpen(submission._id)} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-400">
                      {t("pay.review")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyNote message={t("pay.none")} />
      )}

      {open && <PaymentDetail id={open} periodDays={periodDays} onClose={() => setOpen(null)} onChanged={refresh} />}
    </PageShell>
  );
}
