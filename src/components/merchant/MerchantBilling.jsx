import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { useMerchantStore } from "../zustendstore/MerchantStore";
import { PageShell, ErrorNote, SuccessNote, Field, inputClass, selectClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";
import { IMAGE_TYPES, useFileCheck, withPreview } from "../support/attachmentFiles";

const BLANK = { method: "bkash", methodOther: "", amount: "", transactionId: "", message: "" };

function Fact({ label, children }) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <p className="text-sm text-white/60">{label}</p>
      <div className="mt-1 font-semibold">{children}</div>
    </div>
  );
}

/**
 * The merchant's subscription, where to pay, the "Submit payment proof" form
 * and every proof they have sent. Open even while the account is suspended.
 */
export default function MerchantBilling() {
  const { t, apiMessage, formatDate, formatPrice, formatNumber } = useLanguage();
  const setMerchant = useMerchantStore((state) => state.setMerchant);
  const checkFile = useFileCheck();
  const [billing, setBilling] = useState(null);
  const [form, setForm] = useState(BLANK);
  // `{ file, url }` with a local preview, or null.
  const [screenshot, setScreenshot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => api.get("/merchant/billing").then((response) => setBilling(response.data.data)), []);

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

  const submit = async (event) => {
    event.preventDefault();
    if (!screenshot) return setError(t("billing.screenshotHint"));
    setBusy(true);
    setError("");
    setNotice("");
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    data.append("screenshot", screenshot.file);
    try {
      const response = await api.post("/merchant/payment-submissions", data);
      setNotice(apiMessage({ response }));
      setForm(BLANK);
      URL.revokeObjectURL(screenshot.url);
      setScreenshot(null);
      await load();
      api.get("/merchant/me").then((me) => setMerchant(me.data.data)).catch(() => {});
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  if (!billing) {
    return (
      <PageShell title={t("billing.title")}>
        <ErrorNote message={error} />
        {!error && <p className="text-white/70">{t("common.loading")}</p>}
      </PageShell>
    );
  }

  return (
    <PageShell title={t("billing.title")} subtitle={t("billing.subtitle")} actions={<StatusBadge kind="account" value={billing.accountStatus} />}>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Fact label={t("billing.status")}>
          <StatusBadge kind="account" value={billing.accountStatus} />
        </Fact>
        <Fact label={t("billing.fee")}>{formatPrice(billing.monthlyFee)}</Fact>
        <Fact label={t("billing.expires")}>{billing.expiresAt ? formatDate(billing.expiresAt) : "—"}</Fact>
        {billing.graceEndsAt && (
          <Fact label={t("billing.graceEnds")}>
            <span className="text-orange-200">{formatDate(billing.graceEndsAt)}</span>
          </Fact>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="rounded-2xl bg-white/10 p-5">
            <h2 className="text-lg font-bold">{t("billing.howToPay")}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/80">{billing.instructions || t("billing.noInstructions")}</p>
            <p className="mt-3 text-xs text-white/50">{t("billing.period", { days: formatNumber(billing.periodDays) })}</p>
          </div>

          <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white/10 p-5">
            <h2 className="text-lg font-bold">{t("billing.submitTitle")}</h2>
            <ErrorNote message={error} />
            <SuccessNote message={notice} />

            {billing.hasPending ? (
              <p className="rounded-lg bg-amber-500/20 p-3 text-sm text-amber-100">{t("billing.pendingNote")}</p>
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
                  <Field label={t("billing.amount")} htmlFor="pay-amount">
                    <input id="pay-amount" required type="number" min="1" step="any" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className={inputClass} />
                  </Field>
                </div>
                {form.method === "other" && (
                  <Field label={t("billing.methodOther")} htmlFor="pay-method-other">
                    <input id="pay-method-other" required maxLength={50} value={form.methodOther} onChange={(event) => setForm({ ...form, methodOther: event.target.value })} className={inputClass} />
                  </Field>
                )}
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
                  <p className="mt-2 text-white/70">
                    {submission.method === "other" ? submission.methodOther : t(`method.${submission.method}`)} ·{" "}
                    <span className="font-mono">{submission.transactionId}</span>
                  </p>
                  <p className="text-xs text-white/50">{t("billing.submittedOn", { date: formatDate(submission.createdAt) })}</p>
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
