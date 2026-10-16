import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, Field, inputClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";
import Modal from "../common/Modal";
import NidReveal from "../common/NidReveal";
import { merchantCode } from "../../lib/merchantCode";

// "Pending approval" lives on the Applications page and is linked beside these.
const TABS = ["all", "active", "trial", "expiring", "payment_pending", "grace", "payment_due", "approved", "suspended", "locked"];

const chipClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"}`;

const actionClass = "rounded-lg px-3 py-2 text-sm font-semibold text-white transition disabled:opacity-40";

/** Everything about one merchant, and every action an administrator can take on the account. */
function MerchantDetail({ id, onClose, onChanged }) {
  const { t, apiMessage, formatDate, formatPrice, formatNumber } = useLanguage();
  const [merchant, setMerchant] = useState(null);
  const [payment, setPayment] = useState({ amount: "", months: "1", method: "", reference: "", note: "" });
  const [settings, setSettings] = useState({ monthlyFee: "", extendTrialDays: "" });
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const response = await api.get(`/admin/merchants/${id}`);
    setMerchant(response.data.data);
    setSettings({ monthlyFee: response.data.data.monthlyFee ?? "", extendTrialDays: "" });
  }, [id]);

  useEffect(() => {
    load().catch((caught) => setError(apiMessage(caught)));
  }, [load, apiMessage]);

  const run = async (request) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await request();
      setNotice(apiMessage({ response }));
      await load();
      onChanged();
      return true;
    } catch (caught) {
      setError(apiMessage(caught));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const recordPayment = async (event) => {
    event.preventDefault();
    if (await run(() => api.post(`/admin/merchants/${id}/payments`, payment))) {
      setPayment({ amount: "", months: "1", method: "", reference: "", note: "" });
    }
  };

  const saveSettings = (event) => {
    event.preventDefault();
    run(() => api.patch(`/admin/merchants/${id}`, settings));
  };

  return (
    <Modal title={merchant?.name || t("mlist.details")} onClose={onClose} wide>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />
      {!merchant ? (
        !error && <p className="text-white/70">{t("common.loading")}</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="account" value={merchant.accountStatus} />
            {merchant.locked && <StatusBadge kind="merchant" value="locked" />}
            <span className="text-sm text-white/70">{[merchant.email, merchant.phone].filter(Boolean).join(" · ")}</span>
            <span className="font-mono text-xs text-white/50">{merchantCode(merchant._id)}</span>
          </div>
          {(merchant.businessName || merchant.address) && (
            <p className="text-sm text-white/80">
              <span className="font-semibold">{merchant.businessName}</span>
              {merchant.address && <span className="block whitespace-pre-line text-white/60">{merchant.address}</span>}
            </p>
          )}
          {merchant.locked && merchant.lockedReason && <p className="text-sm text-white/70">{t("mapps.reason", { reason: merchant.lockedReason })}</p>}
          {merchant.status === "suspended" && merchant.suspendedReason && (
            <p className="text-sm text-white/70">{t("mapps.reason", { reason: merchant.suspendedReason })}</p>
          )}

          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg bg-white/5 p-3">
              <dt className="text-white/60">{t("mlist.trialEnds")}</dt>
              <dd>{merchant.trialEndsAt ? formatDate(merchant.trialEndsAt) : t("mlist.never")}</dd>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <dt className="text-white/60">{t("mlist.paidUntil")}</dt>
              <dd>{merchant.paidUntil ? formatDate(merchant.paidUntil) : t("mlist.never")}</dd>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <dt className="text-white/60">{t("mlist.fee")}</dt>
              <dd>{formatPrice(merchant.monthlyFee)}</dd>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <dt className="text-white/60">{t("mhome.products")}</dt>
              <dd>
                {t("mlist.productsCount", { total: formatNumber(merchant.summary.products.total), pending: formatNumber(merchant.summary.products.pending) })}
              </dd>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <dt className="text-white/60">{t("mhome.orders")}</dt>
              <dd>{t("mlist.ordersCount", { count: formatNumber(merchant.summary.orders.total) })}</dd>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <dt className="text-white/60">{t("mlist.sales")}</dt>
              <dd>{formatPrice(merchant.summary.sales.revenue)}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-2">
            <Link to={`/merchants/products?merchant=${merchant._id}&status=all`} className={`${actionClass} bg-white/15 hover:bg-white/25`}>
              {t("mlist.viewProducts")}
            </Link>
            <Link to={`/orders?merchant=${merchant._id}`} className={`${actionClass} bg-white/15 hover:bg-white/25`}>
              {t("mlist.viewOrders")}
            </Link>
            {merchant.facebookPage && (
              <a href={merchant.facebookPage} target="_blank" rel="noreferrer noopener" className={`${actionClass} bg-white/15 hover:bg-white/25`}>
                Facebook
              </a>
            )}
          </div>

          <section className="space-y-3 rounded-xl bg-white/5 p-4">
            <Field label={t("mlist.reason")} htmlFor="merchant-reason">
              <input id="merchant-reason" value={reason} onChange={(event) => setReason(event.target.value)} className={`${inputClass} !p-2`} />
            </Field>
            <div className="flex flex-wrap gap-2">
              {merchant.status === "suspended" ? (
                <button type="button" disabled={busy} onClick={() => run(() => api.post(`/admin/merchants/${id}/activate`))} className={`${actionClass} bg-green-500 hover:bg-green-400`}>
                  {t("mlist.activate")}
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={() => run(() => api.post(`/admin/merchants/${id}/suspend`, { reason }))} className={`${actionClass} bg-orange-500 hover:bg-orange-400`}>
                  {t("mlist.suspend")}
                </button>
              )}
              {merchant.locked ? (
                <button type="button" disabled={busy} onClick={() => run(() => api.post(`/admin/merchants/${id}/unlock`))} className={`${actionClass} bg-green-500 hover:bg-green-400`}>
                  {t("mlist.unlock")}
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={() => run(() => api.post(`/admin/merchants/${id}/lock`, { reason }))} className={`${actionClass} bg-red-600 hover:bg-red-500`}>
                  {t("mlist.lock")}
                </button>
              )}
            </div>
            <p className="text-xs text-white/50">
              {t("mlist.suspendedNote")} {t("mlist.lockedNote")}
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <form onSubmit={recordPayment} className="space-y-2 rounded-xl bg-green-500/10 p-4">
              <h3 className="font-semibold">{t("mlist.recordPayment")}</h3>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t("mlist.amount")} htmlFor="pay-amount">
                  <input id="pay-amount" required type="number" min="0" value={payment.amount} onChange={(event) => setPayment({ ...payment, amount: event.target.value })} className={`${inputClass} !p-2`} />
                </Field>
                <Field label={t("mlist.months")} htmlFor="pay-months">
                  <input id="pay-months" required type="number" min="1" max="24" value={payment.months} onChange={(event) => setPayment({ ...payment, months: event.target.value })} className={`${inputClass} !p-2`} />
                </Field>
                <Field label={t("mlist.method")} htmlFor="pay-method">
                  <input id="pay-method" value={payment.method} placeholder={t("mlist.methodPlaceholder")} onChange={(event) => setPayment({ ...payment, method: event.target.value })} className={`${inputClass} !p-2`} />
                </Field>
                <Field label={t("mlist.reference")} htmlFor="pay-reference">
                  <input id="pay-reference" value={payment.reference} onChange={(event) => setPayment({ ...payment, reference: event.target.value })} className={`${inputClass} !p-2`} />
                </Field>
              </div>
              <button disabled={busy} className="w-full rounded-lg bg-green-500 py-2 text-sm font-semibold text-white hover:bg-green-400 disabled:opacity-40">
                {t("mlist.recordPayment")}
              </button>
            </form>

            <form onSubmit={saveSettings} className="space-y-2 rounded-xl bg-white/5 p-4">
              <Field label={t("mapps.monthlyFee")} htmlFor="merchant-fee">
                <input id="merchant-fee" type="number" min="0" value={settings.monthlyFee} onChange={(event) => setSettings({ ...settings, monthlyFee: event.target.value })} className={`${inputClass} !p-2`} />
              </Field>
              <Field label={t("mlist.extendTrial")} htmlFor="merchant-extend">
                <input id="merchant-extend" type="number" min="0" max="365" value={settings.extendTrialDays} onChange={(event) => setSettings({ ...settings, extendTrialDays: event.target.value })} className={`${inputClass} !p-2`} />
              </Field>
              <button disabled={busy} className="w-full rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-40">
                {t("common.save")}
              </button>
            </form>
          </div>

          <section>
            <h3 className="mb-2 font-semibold">{t("mlist.subscriptionHistory")}</h3>
            {merchant.subscriptions?.length ? (
              <ul className="divide-y divide-white/10 rounded-xl bg-white/5 text-sm">
                {merchant.subscriptions.map((entry) => (
                  <li key={entry._id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <span className="font-semibold">{t(`subkind.${entry.kind}`)}</span>
                    <span className="text-white/70">{t("mhome.period", { from: formatDate(entry.startsAt), to: formatDate(entry.endsAt) })}</span>
                    <span className="text-white/50">
                      {[entry.amountPaid ? formatPrice(entry.amountPaid) : "", t(`subsource.${entry.source}`), entry.note, entry.createdBy?.fullname].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/60">{t("mhome.noPayments")}</p>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="font-semibold">{t("nav.paymentProofs")}</h3>
              <Link to={`/merchants/payments?merchant=${merchant._id}`} className="text-xs text-sky-200 underline">
                {t("mlist.openAll")}
              </Link>
            </div>
            {merchant.paymentProofs?.length ? (
              <ul className="divide-y divide-white/10 rounded-xl bg-white/5 text-sm">
                {merchant.paymentProofs.map((entry) => (
                  <li key={entry._id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <span className="font-semibold">{formatPrice(entry.amount)}</span>
                    <span className="font-mono text-xs text-white/70">{entry.transactionId}</span>
                    <span className="text-xs text-white/50">{formatDate(entry.createdAt)}</span>
                    <StatusBadge kind="paymentShort" value={entry.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/60">{t("billing.noHistory")}</p>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="font-semibold">{t("mlist.accountHistory")}</h3>
              <Link to={`/merchants/audit?merchant=${merchant._id}`} className="text-xs text-sky-200 underline">
                {t("nav.auditLog")}
              </Link>
            </div>
            {merchant.history?.length ? (
              <ul className="max-h-60 divide-y divide-white/10 overflow-y-auto rounded-xl bg-white/5 text-xs">
                {merchant.history.map((entry) => (
                  <li key={entry._id} className="flex flex-wrap justify-between gap-2 p-2">
                    <span className="font-semibold">{t(`audit.${entry.action}`)}</span>
                    <span className="text-white/60">{entry.actorType === "system" ? t("audit.system") : entry.actorName}</span>
                    <span className="text-white/50">{formatDate(entry.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/60">{t("audit.none")}</p>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold">
                {t("apply.nidNumber")}: <NidReveal masked={merchant.nidMasked} revealUrl={`/admin/merchants/${merchant._id}/nid`} />
              </h3>
              {merchant.application && (
                <div className="grid grid-cols-2 gap-2">
                  {[merchant.application.nidFrontUrl, merchant.application.nidBackUrl].map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noreferrer noopener" title={t("mapps.openFull")}>
                      <img src={url} alt={t(index ? "apply.nidBack" : "apply.nidFront")} className="h-28 w-full rounded-lg bg-white/5 object-contain" />
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="mb-2 font-semibold">{t("mlist.sameNid")}</h3>
              {merchant.sameNidMerchants.length ? (
                <ul className="space-y-1 text-sm">
                  {merchant.sameNidMerchants.map((other) => (
                    <li key={other._id} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 p-2">
                      <span className="truncate">
                        {other.name} · {other.businessName || other.email || ""}
                      </span>
                      <StatusBadge kind="merchant" value={other.locked ? "locked" : other.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/60">{t("mlist.never")}</p>
              )}
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}

/** Every approved merchant, with where each stands on payment. */
export default function MerchantList() {
  const { t, apiMessage, formatDate, formatPrice, formatNumber, language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.includes(searchParams.get("status")) ? searchParams.get("status") : "all";
  const setTab = (next) => setSearchParams(next === "all" ? {} : { status: next }, { replace: true });
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const params = tab === "locked" ? { locked: "true" } : tab === "all" ? {} : { status: tab };
    return api.get("/admin/merchants", { params }).then((response) => response.data.data);
  }, [tab]);

  useEffect(() => {
    let active = true;
    load()
      .then((result) => active && setData(result))
      .catch((caught) => {
        if (!active) return;
        setData({ merchants: [], counts: {} });
        setError(apiMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [load, apiMessage]);

  const refresh = () => load().then(setData).catch(() => {});

  return (
    <PageShell
      title={t("mlist.title")}
      actions={
        <Link to="/merchants/applications" className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-400">
          {t("astatus.pending_approval")}
          {data?.counts?.pendingApplications ? ` · ${formatNumber(data.counts.pendingApplications)}` : ""}
        </Link>
      }
    >
      <ErrorNote message={error} />

      <div className="mb-5 flex flex-wrap gap-2" role="group">
        {TABS.map((key) => (
          <button key={key} type="button" onClick={() => setTab(key)} aria-pressed={tab === key} className={chipClass(tab === key)}>
            {key === "all" ? t("common.all") : t(`mlist.tab.${key}`)}
            {key !== "all" && data?.counts?.[key] !== undefined ? ` · ${formatNumber(data.counts[key])}` : ""}
          </button>
        ))}
      </div>

      {data === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : data.merchants.length ? (
        <div className="overflow-x-auto rounded-xl bg-white/5">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-white/10 text-white/70">
              <tr>
                <th className="p-3">{t("orders.merchant")}</th>
                <th className="p-3">{t("mlist.accountStatus")}</th>
                <th className="p-3">{t("mlist.subscriptionStart")}</th>
                <th className="p-3">{t("mlist.expiry")}</th>
                <th className="p-3">{t("mlist.fee")}</th>
                <th className="p-3">{t("mlist.paymentStatus")}</th>
                <th className="p-3">{t("mlist.lastPayment")}</th>
                <th className="p-3">{t("mlist.nextDue")}</th>
                <th className="p-3">{t("mhome.products")}</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.merchants.map((merchant) => (
                <tr key={merchant._id} className="border-t border-white/10 align-top">
                  <td className="p-3">
                    <span className="block font-semibold">{merchant.name}</span>
                    {merchant.businessName && <span className="block text-xs text-white/80">{merchant.businessName}</span>}
                    <span className="block text-xs text-white/60">{merchant.phone}</span>
                    {merchant.email && <span className="block text-xs text-white/60">{merchant.email}</span>}
                    <span className="block font-mono text-[10px] text-white/40">{merchantCode(merchant._id)}</span>
                  </td>
                  <td className="p-3">
                    <span className="flex flex-wrap gap-1">
                      <StatusBadge kind="account" value={merchant.accountStatus} />
                      {merchant.locked && <StatusBadge kind="merchant" value="locked" />}
                    </span>
                    {merchant.accountStatus === "grace" && merchant.graceEndsAt && (
                      <span className="mt-1 block text-xs text-yellow-100">{t("mlist.graceUntil", { date: formatDate(merchant.graceEndsAt) })}</span>
                    )}
                  </td>
                  <td className="p-3">{merchant.subscriptionStart ? formatDate(merchant.subscriptionStart) : t("mlist.never")}</td>
                  <td className="p-3">{merchant.expiresAt ? formatDate(merchant.expiresAt) : t("mlist.never")}</td>
                  <td className="p-3">{formatPrice(merchant.monthlyFee)}</td>
                  <td className="p-3">
                    {merchant.paymentStatus === "none" ? <span className="text-white/50">{t("pstatusShort.none")}</span> : <StatusBadge kind="paymentShort" value={merchant.paymentStatus} />}
                  </td>
                  <td className="p-3">{merchant.lastPaymentAt ? formatDate(merchant.lastPaymentAt) : t("mlist.never")}</td>
                  <td className="p-3">{merchant.nextDueDate ? formatDate(merchant.nextDueDate) : t("mlist.never")}</td>
                  <td className="p-3 text-xs">
                    {t("mlist.productsCount", { total: formatNumber(merchant.products.total), pending: formatNumber(merchant.products.pending) })}
                    <span className="block text-white/60">{t("mlist.ordersCount", { count: formatNumber(merchant.orders) })}</span>
                  </td>
                  <td className="p-3 text-right">
                    <button type="button" onClick={() => setOpen(merchant._id)} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-400">
                      {t("mlist.details")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyNote message={t("mlist.none")} />
      )}

      {data?.billingJob && (
        <p className="mt-4 text-xs text-white/50">
          {t("mlist.lastCheck", {
            when: data.billingJob.lastFinishedAt
              ? new Date(data.billingJob.lastFinishedAt).toLocaleString(language === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
              : "—",
          })}
          {data.billingJob.lastError && <span className="text-red-200"> · {data.billingJob.lastError}</span>}
        </p>
      )}

      {open && <MerchantDetail id={open} onClose={() => setOpen(null)} onChanged={refresh} />}
    </PageShell>
  );
}
