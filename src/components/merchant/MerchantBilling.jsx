import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../../lib/api";
import { todayInDhaka, shiftDate } from "../../lib/dates";
import { useLanguage } from "../../i18n/useLanguage";
import { useMerchantStore } from "../zustendstore/MerchantStore";
import { PageShell, ErrorNote, SuccessNote, Field, inputClass, selectClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";
import CopyButton from "../common/CopyButton";
import { IMAGE_TYPES, useFileCheck, withPreview } from "../support/attachmentFiles";

const blankForm = (method = "bkash", amount = "") => ({ method, amount, transactionId: "", paidAt: todayInDhaka(), message: "" });

function Fact({ label, children }) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <p className="text-sm text-white/60">{label}</p>
      <div className="mt-1 font-semibold">{children}</div>
    </div>
  );
}

/** Fee, referral credit taken off it, and what is left to pay. */
function Invoice({ invoice, credit }) {
  const { t, formatPrice } = useLanguage();
  return (
    <div className="rounded-2xl bg-white/10 p-5">
      <h2 className="text-lg font-bold">{t("billing.invoiceTitle")}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-white/70">{t("billing.fee")}</dt>
          <dd className="font-semibold">{formatPrice(invoice.fee)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/70">{t("billing.creditApplied")}</dt>
          <dd className="font-semibold text-green-200">{invoice.creditApplied > 0 ? `− ${formatPrice(invoice.creditApplied)}` : formatPrice(0)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-white/20 pt-2 text-base">
          <dt className="font-bold">{t("billing.payable")}</dt>
          <dd className="font-bold">{formatPrice(invoice.payable)}</dd>
        </div>
      </dl>
      {invoice.creditLeft > 0 && <p className="mt-3 text-xs text-green-100">{t("billing.creditLeft", { amount: formatPrice(invoice.creditLeft) })}</p>}
      {credit.reserved > 0 && <p className="mt-1 text-xs text-white/60">{t("billing.creditReserved", { amount: formatPrice(credit.reserved) })}</p>}
      <p className="mt-3 text-xs text-white/50">
        {t("billing.creditNote")}{" "}
        <Link to="/merchant/referrals" className="text-sky-200 underline">
          {t("mnav.referrals")}
        </Link>
      </p>
    </div>
  );
}

/**
 * The merchant's Subscription Payment page: subscription status, the bKash /
 * Nagad numbers to pay to, the invoice after referral credit, the "Submit
 * payment request" form and every payment they have sent. Open even while the
 * account is suspended.
 */
export default function MerchantBilling() {
  const { t, apiMessage, formatDate, formatPrice, formatNumber } = useLanguage();
  const setMerchant = useMerchantStore((state) => state.setMerchant);
  const checkFile = useFileCheck();
  const [billing, setBilling] = useState(null);
  const [form, setForm] = useState(blankForm);
  // `{ file, url }` with a local preview, or null.
  const [screenshot, setScreenshot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(
    () =>
      api.get("/merchant/billing").then((response) => {
        const data = response.data.data;
        setBilling(data);
        // Start the form on an offered wallet with the amount due filled in.
        setForm((current) => ({
          ...current,
          method: data.methods.includes(current.method) ? current.method : data.methods[0],
          amount: current.amount || (data.invoice.payable > 0 ? String(data.invoice.payable) : ""),
        }));
      }),
    []
  );

  useEffect(() => {
    load().catch((caught) => setError(apiMessage(caught)));
  }, [load, apiMessage]);

  const pickScreenshot = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const problem = checkFile(file, "image");
    if (problem) return setError(problem);
    setError("");
    if (screenshot) URL.revokeObjectURL(screenshot.url);
    setScreenshot(withPreview(file));
  };

  const send = async (data) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/merchant/payment-submissions", data);
      setNotice(apiMessage({ response }));
      setForm(blankForm(form.method));
      if (screenshot) URL.revokeObjectURL(screenshot.url);
      setScreenshot(null);
      await load();
      api.get("/merchant/me").then((me) => setMerchant(me.data.data)).catch(() => {});
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (!screenshot) return setError(t("billing.screenshotHint"));
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    data.append("screenshot", screenshot.file);
    send(data);
  };

  const payWithCredit = () => {
    const data = new FormData();
    data.append("method", "credit");
    if (form.message) data.append("message", form.message);
    send(data);
  };

  if (!billing) {
    return (
      <PageShell title={t("billing.title")}>
        <ErrorNote message={error} />
        {!error && <p className="text-white/70">{t("common.loading")}</p>}
      </PageShell>
    );
  }

  const { invoice, credit } = billing;
  const creditCoversFee = invoice.fee > 0 && invoice.payable === 0;
  const payTo = billing.paymentAccounts.find((account) => account.method === form.method);
  const today = todayInDhaka();

  return (
    <PageShell title={t("billing.title")} subtitle={t("billing.subtitle")} actions={<StatusBadge kind="account" value={billing.accountStatus} />}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Fact label={t("billing.status")}>
          <StatusBadge kind="account" value={billing.accountStatus} />
        </Fact>
        <Fact label={t("billing.fee")}>{formatPrice(billing.monthlyFee)}</Fact>
        <Fact label={t("billing.expires")}>{billing.expiresAt ? formatDate(billing.expiresAt) : "—"}</Fact>
        {billing.graceEndsAt ? (
          <Fact label={t("billing.graceEnds")}>
            <span className="text-orange-200">{formatDate(billing.graceEndsAt)}</span>
          </Fact>
        ) : (
          <Fact label={t("billing.creditAvailable")}>
            <span className="text-green-200">{formatPrice(credit.available)}</span>
          </Fact>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="rounded-2xl bg-white/10 p-5">
            <h2 className="text-lg font-bold">{t("billing.howToPay")}</h2>
            {billing.paymentAccounts.length > 0 && (
              <ul className="mt-3 space-y-2">
                {billing.paymentAccounts.map((account) => (
                  <li key={account.method} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/10 p-3">
                    <div>
                      <p className="text-sm text-white/70">
                        {t(`method.${account.method}`)} · {t(`wallet.${account.type}`)}
                      </p>
                      <p className="font-mono text-xl font-bold tracking-wide">{account.number}</p>
                    </div>
                    <CopyButton text={account.number} />
                  </li>
                ))}
              </ul>
            )}
            {(billing.instructions || !billing.paymentAccounts.length) && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/80">{billing.instructions || t("billing.noInstructions")}</p>
            )}
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-white/70">
              <li>{t("billing.step1", { amount: formatPrice(invoice.payable) })}</li>
              <li>{t("billing.step2")}</li>
              <li>{t("billing.step3")}</li>
            </ol>
            <p className="mt-3 text-xs text-white/50">{t("billing.period", { days: formatNumber(billing.periodDays) })}</p>
          </div>

          <Invoice invoice={invoice} credit={credit} />

          <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white/10 p-5">
            <h2 className="text-lg font-bold">{t("billing.submitTitle")}</h2>
            <ErrorNote message={error} />
            <SuccessNote message={notice} />

            {billing.hasPending ? (
              <p className="rounded-lg bg-amber-500/20 p-3 text-sm text-amber-100">{t("billing.pendingNote")}</p>
            ) : creditCoversFee ? (
              <>
                <p className="rounded-lg bg-green-500/20 p-3 text-sm text-green-100">{t("billing.creditCoversFee", { amount: formatPrice(invoice.creditApplied) })}</p>
                <Field label={t("billing.message")} htmlFor="pay-message">
                  <textarea id="pay-message" rows={2} maxLength={1000} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className={inputClass} />
                </Field>
                <p className="text-xs text-white/60">{t("billing.notActiveYet")}</p>
                <button type="button" disabled={busy} onClick={payWithCredit} className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white hover:bg-green-400 disabled:opacity-40">
                  {busy ? t("billing.submitting") : t("billing.payWithCredit")}
                </button>
              </>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t("billing.method")} htmlFor="pay-method">
                    <select id="pay-method" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })} className={selectClass}>
                      {billing.methods.map((method) => (
                        <option key={method} value={method}>
                          {t(`method.${method}`)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("billing.payTo")} htmlFor="pay-to">
                    <p id="pay-to" className="rounded-lg bg-white/5 p-3 font-mono font-semibold">
                      {payTo?.number || "—"}
                    </p>
                  </Field>
                  <Field
                    label={t("billing.amount")}
                    hint={invoice.creditApplied > 0 ? t("billing.amountHint", { amount: formatPrice(invoice.payable) }) : undefined}
                    htmlFor="pay-amount"
                  >
                    <input id="pay-amount" required type="number" min="1" step="any" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className={inputClass} />
                  </Field>
                  <Field label={t("billing.paidAt")} htmlFor="pay-date">
                    <input
                      id="pay-date"
                      required
                      type="date"
                      max={today}
                      min={shiftDate(today, -90)}
                      value={form.paidAt}
                      onChange={(event) => setForm({ ...form, paidAt: event.target.value })}
                      className={`${inputClass} [color-scheme:dark]`}
                    />
                  </Field>
                </div>
                <Field label={t("billing.transactionId")} hint={t("billing.transactionHint")} htmlFor="pay-txn">
                  <input
                    id="pay-txn"
                    required
                    minLength={4}
                    maxLength={60}
                    autoComplete="off"
                    value={form.transactionId}
                    onChange={(event) => setForm({ ...form, transactionId: event.target.value })}
                    className={`${inputClass} font-mono uppercase`}
                  />
                </Field>
                <Field label={t("billing.screenshot")} hint={t("billing.screenshotHint")} htmlFor="pay-screenshot">
                  <input id="pay-screenshot" type="file" accept={IMAGE_TYPES.join(",")} onChange={pickScreenshot} className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-white/20 file:px-3 file:py-1 file:text-white`} />
                </Field>
                {screenshot && <img src={screenshot.url} alt="" className="max-h-56 rounded-lg bg-white/5 object-contain" />}
                <Field label={t("billing.message")} htmlFor="pay-message">
                  <textarea id="pay-message" rows={2} maxLength={1000} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className={inputClass} />
                </Field>
                <p className="text-xs text-white/60">{t("billing.notActiveYet")}</p>
                <button disabled={busy} className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white hover:bg-green-400 disabled:opacity-40">
                  {busy ? t("billing.submitting") : t("billing.submit")}
                </button>
              </>
            )}
          </form>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">{t("billing.history")}</h2>
          {billing.submissions.length ? (
            <ul className="space-y-3">
              {billing.submissions.map((submission) => (
                <li key={submission._id} className="rounded-xl bg-white/10 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-base font-semibold">{formatPrice(submission.amount)}</span>
                    <StatusBadge kind="payment" value={submission.status} />
                  </div>
                  {submission.creditApplied > 0 && (
                    <p className="mt-1 text-green-200">{t("billing.historyCredit", { fee: formatPrice(submission.fee), credit: formatPrice(submission.creditApplied) })}</p>
                  )}
                  <p className="mt-2 text-white/70">
                    {submission.method === "other" ? submission.methodOther : t(`method.${submission.method}`)}
                    {submission.transactionId && (
                      <>
                        {" · "}
                        <span className="font-mono">{submission.transactionId}</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-white/50">
                    {submission.paidAt && `${t("billing.paidOn", { date: formatDate(submission.paidAt) })} · `}
                    {t("billing.submittedOn", { date: formatDate(submission.createdAt) })}
                    {submission.reviewedAt && ` · ${t("billing.verifiedOn", { date: formatDate(submission.reviewedAt) })}`}
                  </p>
                  {submission.status === "activated" && submission.periodEnd && (
                    <p className="mt-1 text-green-200">{t("billing.activePeriod", { from: formatDate(submission.periodStart), to: formatDate(submission.periodEnd) })}</p>
                  )}
                  {submission.status === "rejected" && submission.rejectionReason && (
                    <p className="mt-2 rounded-lg bg-red-500/20 p-2 text-red-100">{t("billing.rejectedBecause", { reason: submission.rejectionReason })}</p>
                  )}
                  {submission.screenshot?.url && (
                    <a href={submission.screenshot.url} target="_blank" rel="noreferrer noopener" className="mt-2 inline-block text-xs text-sky-200 underline">
                      {t("billing.viewScreenshot")}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-white/5 p-4 text-sm text-white/60">{t("billing.noHistory")}</p>
          )}
        </section>
      </div>
    </PageShell>
  );
}
