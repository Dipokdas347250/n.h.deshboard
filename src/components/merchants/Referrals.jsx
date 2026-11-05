import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "../../lib/api";
import { merchantCode } from "../../lib/merchantCode";
import { ledgerAmount, REFERRAL_STYLE } from "../../lib/referrals";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, Field, inputClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";
import Modal from "../common/Modal";

const VIEWS = ["accounts", "referrals"];
const REFERRAL_FILTERS = ["all", "pending", "credited", "void"];

const chipClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"}`;

function Stat({ label, value, tone = "" }) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <p className="text-sm text-white/60">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function MerchantCell({ merchant }) {
  if (!merchant) return <span className="text-white/50">—</span>;
  return (
    <>
      <span className="block font-semibold">{merchant.businessName || merchant.name}</span>
      <span className="block font-mono text-xs text-white/60">
        {merchantCode(merchant._id)}
        {merchant.referralCode && ` · ${merchant.referralCode}`}
      </span>
    </>
  );
}

/** One merchant's credit account: balances, full history, referrals both ways, and a correction form. */
function CreditDetail({ id, onClose, onChanged }) {
  const { t, apiMessage, formatDate, formatPrice, language } = useLanguage();
  const [data, setData] = useState(null);
  const [adjustment, setAdjustment] = useState({ amount: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => api.get(`/admin/merchants/${id}/referral-credit`).then((response) => setData(response.data.data)), [id]);

  useEffect(() => {
    load().catch((caught) => setError(apiMessage(caught)));
  }, [load, apiMessage]);

  const adjust = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post(`/admin/merchants/${id}/referral-credit/adjust`, adjustment);
      setNotice(apiMessage({ response }));
      setAdjustment({ amount: "", reason: "" });
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

  return (
    <Modal title={data ? data.merchant.businessName || data.merchant.name : t("refAdmin.account")} onClose={onClose} wide>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />
      {!data ? (
        !error && <p className="text-white/70">{t("common.loading")}</p>
      ) : (
        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-white/70">
              {merchantCode(data.merchant._id)} · {t("ref.code")}: {data.merchant.referralCode}
            </span>
            <StatusBadge kind="merchant" value={data.merchant.status} />
            {data.merchant.locked && <StatusBadge kind="merchant" value="locked" />}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label={t("ref.earned")} value={formatPrice(data.credit.earned)} />
            <Stat label={t("ref.used")} value={formatPrice(data.credit.used)} />
            <Stat label={t("refAdmin.unused")} value={formatPrice(data.credit.unused)} tone="text-green-200" />
            <Stat label={t("refAdmin.adjusted")} value={formatPrice(data.credit.adjusted)} />
          </div>
          {data.credit.reserved > 0 && <p className="text-xs text-white/60">{t("billing.creditReserved", { amount: formatPrice(data.credit.reserved) })}</p>}

          {data.referredBy && (
            <p className="rounded-lg bg-white/5 p-3">
              {t("refAdmin.referredBy", { name: data.referredBy.referrer?.businessName || data.referredBy.referrer?.name || "—" })} ·{" "}
              {t(`ref.status.${data.referredBy.status}`)}
              {data.referredBy.voidReason && ` (${t(`ref.void.${data.referredBy.voidReason}`)})`}
            </p>
          )}

          <form onSubmit={adjust} className="grid gap-3 rounded-xl bg-white/5 p-4 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
            <Field label={t("refAdmin.adjustAmount")} htmlFor="adjust-amount">
              <input
                id="adjust-amount"
                required
                type="number"
                step="any"
                value={adjustment.amount}
                onChange={(event) => setAdjustment({ ...adjustment, amount: event.target.value })}
                className={`${inputClass} !p-2`}
              />
            </Field>
            <Field label={t("refAdmin.adjustReason")} htmlFor="adjust-reason">
              <input
                id="adjust-reason"
                required
                minLength={3}
                maxLength={500}
                value={adjustment.reason}
                onChange={(event) => setAdjustment({ ...adjustment, reason: event.target.value })}
                className={`${inputClass} !p-2`}
              />
            </Field>
            <button disabled={busy} className="rounded-lg bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-400 disabled:opacity-40">
              {t("refAdmin.adjust")}
            </button>
            <p className="text-xs text-white/50 sm:col-span-3">{t("refAdmin.adjustHint")}</p>
          </form>

          <div className="grid gap-5 md:grid-cols-2">
            <section>
              <h3 className="mb-2 font-semibold">{t("ref.history")}</h3>
              {data.ledger.length ? (
                <ul className="max-h-80 divide-y divide-white/10 overflow-y-auto rounded-xl bg-white/5">
                  {data.ledger.map((entry) => (
                    <li key={entry._id} className="flex justify-between gap-3 p-3">
                      <div>
                        <p className="font-semibold">{t(`ledger.${entry.type}`)}</p>
                        <p className="text-xs text-white/50">
                          {when(entry.createdAt)}
                          {entry.createdBy?.fullname && ` · ${entry.createdBy.fullname}`}
                        </p>
                        {entry.note && <p className="text-xs text-white/70">{entry.note}</p>}
                        {entry.paymentSubmission && (
                          <Link to={`/merchants/payments?open=${entry.paymentSubmission}`} className="text-xs text-sky-200 underline">
                            {t("refAdmin.openPayment")}
                          </Link>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold">{ledgerAmount(entry, formatPrice)}</p>
                        <p className="text-xs text-white/50">{t("ref.balanceAfter", { amount: formatPrice(entry.availableAfter) })}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/60">{t("ref.noHistory")}</p>
              )}
            </section>
            <section>
              <h3 className="mb-2 font-semibold">{t("ref.referred")}</h3>
              {data.referrals.length ? (
                <ul className="max-h-80 divide-y divide-white/10 overflow-y-auto rounded-xl bg-white/5">
                  {data.referrals.map((referral) => (
                    <li key={referral._id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                      <div>
                        <p className="font-semibold">{referral.referred?.businessName || referral.referred?.name}</p>
                        <p className="text-xs text-white/50">{formatDate(referral.createdAt)}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${REFERRAL_STYLE[referral.status]}`}>
                        {referral.status === "credited" ? t("ref.status.creditedAmount", { amount: formatPrice(referral.creditAmount) }) : t(`ref.status.${referral.status}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/60">{t("ref.noneReferred")}</p>
              )}
            </section>
          </div>
        </div>
      )}
    </Modal>
  );
}

/**
 * Admin: merchant referrals and referral credit accounts, with store-wide
 * earned / used / unused totals. `?merchant=<id>` opens that merchant's account.
 */
export default function Referrals() {
  const { t, apiMessage, formatPrice, formatNumber, formatDate } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const open = searchParams.get("merchant");
  const [view, setView] = useState("accounts");
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(
    () => api.get("/admin/referrals", { params: filter === "all" ? {} : { status: filter } }).then((response) => response.data.data),
    [filter]
  );

  useEffect(() => {
    let active = true;
    load()
      .then((result) => active && setData(result))
      .catch((caught) => active && setError(apiMessage(caught)));
    return () => {
      active = false;
    };
  }, [load, apiMessage]);

  const refresh = () => load().then(setData).catch(() => {});
  const setOpen = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set("merchant", id);
    else next.delete("merchant");
    setSearchParams(next, { replace: true });
  };

  const totals = data?.totals;

  return (
    <PageShell
      title={t("refAdmin.title")}
      subtitle={data ? t("refAdmin.subtitle", { amount: formatPrice(data.creditPerReferral) }) : undefined}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link to="/settings" className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25">
            {t("nav.settings")}
          </Link>
          <Link to="/merchants/audit?group=referral" className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/25">
            {t("nav.auditLog")}
          </Link>
        </div>
      }
    >
      <ErrorNote message={error} />

      {totals && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label={t("refAdmin.totalEarned")} value={formatPrice(totals.earned)} />
          <Stat label={t("refAdmin.totalUsed")} value={formatPrice(totals.used)} />
          <Stat label={t("refAdmin.totalUnused")} value={formatPrice(totals.unused)} tone="text-green-200" />
          <Stat label={t("refAdmin.totalReferrals")} value={`${formatNumber(data.counts.credited)} / ${formatNumber(data.counts.pending + data.counts.credited)}`} />
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2" role="group">
        {VIEWS.map((key) => (
          <button key={key} type="button" onClick={() => setView(key)} aria-pressed={view === key} className={chipClass(view === key)}>
            {t(`refAdmin.view.${key}`)}
          </button>
        ))}
        {view === "referrals" && (
          <span className="ml-auto flex flex-wrap gap-2">
            {REFERRAL_FILTERS.map((key) => (
              <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key} className={chipClass(filter === key)}>
                {key === "all" ? t("common.all") : t(`ref.status.${key}`)}
                {key !== "all" && data?.counts?.[key] !== undefined ? ` · ${formatNumber(data.counts[key])}` : ""}
              </button>
            ))}
          </span>
        )}
      </div>

      {data === null ? (
        !error && <p className="text-white/70">{t("common.loading")}</p>
      ) : view === "accounts" ? (
        data.accounts.length ? (
          <div className="overflow-x-auto rounded-xl bg-white/5">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/10 text-white/70">
                <tr>
                  <th className="p-3">{t("pay.merchant")}</th>
                  <th className="p-3">{t("ref.earned")}</th>
                  <th className="p-3">{t("ref.used")}</th>
                  <th className="p-3">{t("ref.available")}</th>
                  <th className="p-3">{t("ref.reserved")}</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {data.accounts.map((account) => (
                  <tr key={account.merchant?._id} className="border-t border-white/10">
                    <td className="p-3">
                      <MerchantCell merchant={account.merchant} />
                    </td>
                    <td className="p-3">{formatPrice(account.earned)}</td>
                    <td className="p-3">{formatPrice(account.used)}</td>
                    <td className="p-3 font-semibold text-green-200">{formatPrice(account.available)}</td>
                    <td className="p-3">{formatPrice(account.reserved)}</td>
                    <td className="p-3 text-right">
                      <button type="button" onClick={() => setOpen(account.merchant?._id)} className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-400">
                        {t("refAdmin.history")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyNote message={t("refAdmin.noAccounts")} />
        )
      ) : data.referrals.length ? (
        <div className="overflow-x-auto rounded-xl bg-white/5">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/10 text-white/70">
              <tr>
                <th className="p-3">{t("refAdmin.referrer")}</th>
                <th className="p-3">{t("refAdmin.newMerchant")}</th>
                <th className="p-3">{t("refAdmin.registered")}</th>
                <th className="p-3">{t("support.status")}</th>
                <th className="p-3">{t("refAdmin.credit")}</th>
              </tr>
            </thead>
            <tbody>
              {data.referrals.map((referral) => (
                <tr key={referral._id} className="border-t border-white/10">
                  <td className="p-3">
                    <button type="button" onClick={() => setOpen(referral.referrer?._id)} className="text-left hover:underline">
                      <MerchantCell merchant={referral.referrer} />
                    </button>
                  </td>
                  <td className="p-3">
                    <button type="button" onClick={() => setOpen(referral.referred?._id)} className="text-left hover:underline">
                      <MerchantCell merchant={referral.referred} />
                    </button>
                  </td>
                  <td className="p-3">{formatDate(referral.createdAt)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${REFERRAL_STYLE[referral.status]}`}>{t(`ref.status.${referral.status}`)}</span>
                    {referral.voidReason && <span className="mt-1 block text-xs text-white/50">{t(`ref.void.${referral.voidReason}`)}</span>}
                  </td>
                  <td className="p-3">
                    {referral.status === "credited" ? (
                      <>
                        <span className="block font-semibold">{formatPrice(referral.creditAmount)}</span>
                        <span className="block text-xs text-white/50">{formatDate(referral.creditedAt)}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyNote message={t("refAdmin.noReferrals")} />
      )}

      {open && <CreditDetail id={open} onClose={() => setOpen(null)} onChanged={refresh} />}
    </PageShell>
  );
}
