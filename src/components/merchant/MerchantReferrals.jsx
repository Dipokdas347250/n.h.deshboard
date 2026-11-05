import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote } from "../common/PageShell";
import CopyButton from "../common/CopyButton";
import { ledgerAmount, REFERRAL_STYLE } from "../../lib/referrals";

function Stat({ label, value, tone = "" }) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <p className="text-sm text-white/60">{label}</p>
      <p className={`mt-1 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

/**
 * The merchant's referral code and link, their referral credit (earned, used,
 * unused) with its full history, and the merchants who joined through them.
 */
export default function MerchantReferrals() {
  const { t, apiMessage, formatDate, formatPrice } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/merchant/referrals")
      .then((response) => setData(response.data.data))
      .catch((caught) => setError(apiMessage(caught)));
  }, [apiMessage]);

  if (!data) {
    return (
      <PageShell title={t("ref.title")}>
        <ErrorNote message={error} />
        {!error && <p className="text-white/70">{t("common.loading")}</p>}
      </PageShell>
    );
  }

  const link = `${window.location.origin}/apply?ref=${encodeURIComponent(data.referralCode)}`;
  const { credit } = data;

  return (
    <PageShell title={t("ref.title")} subtitle={t("ref.subtitle", { amount: formatPrice(data.creditPerReferral) })}>
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white/10 p-5">
          <p className="text-sm text-white/60">{t("ref.code")}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="select-all font-mono text-2xl font-bold tracking-widest">{data.referralCode}</p>
            <CopyButton text={data.referralCode} />
          </div>
          <p className="mt-4 text-sm text-white/60">{t("ref.link")}</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="min-w-0 select-all break-all font-mono text-sm">{link}</p>
            <CopyButton text={link} />
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 p-5 text-sm leading-6 text-white/80">
          <h2 className="mb-2 text-lg font-bold text-white">{t("ref.howTitle")}</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>{t("ref.how1")}</li>
            <li>{t("ref.how2", { amount: formatPrice(data.creditPerReferral) })}</li>
            <li>{t("ref.how3")}</li>
          </ol>
          <p className="mt-3 text-xs text-white/50">{t("ref.noCash")}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("ref.available")} value={formatPrice(credit.available)} tone="text-green-200" />
        <Stat label={t("ref.reserved")} value={formatPrice(credit.reserved)} />
        <Stat label={t("ref.earned")} value={formatPrice(credit.earned)} />
        <Stat label={t("ref.used")} value={formatPrice(credit.used)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-bold">{t("ref.referred")}</h2>
          {data.referrals.length ? (
            <ul className="space-y-2">
              {data.referrals.map((referral) => (
                <li key={referral._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/10 p-3 text-sm">
                  <div>
                    <p className="font-semibold">{referral.businessName}</p>
                    <p className="text-xs text-white/50">{t("ref.joined", { date: formatDate(referral.createdAt) })}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${REFERRAL_STYLE[referral.status]}`}>
                    {referral.status === "credited"
                      ? t("ref.status.creditedAmount", { amount: formatPrice(referral.creditAmount) })
                      : t(`ref.status.${referral.status}`)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-white/5 p-4 text-sm text-white/60">{t("ref.noneReferred")}</p>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">{t("ref.history")}</h2>
          {data.ledger.length ? (
            <ul className="space-y-2">
              {data.ledger.map((entry) => (
                <li key={entry._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/10 p-3 text-sm">
                  <div>
                    <p className="font-semibold">{t(`ledger.${entry.type}`)}</p>
                    <p className="text-xs text-white/50">
                      {formatDate(entry.createdAt)}
                      {entry.note && ` · ${entry.note}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{ledgerAmount(entry, formatPrice)}</p>
                    <p className="text-xs text-white/50">{t("ref.balanceAfter", { amount: formatPrice(entry.availableAfter) })}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl bg-white/5 p-4 text-sm text-white/60">{t("ref.noHistory")}</p>
          )}
        </section>
      </div>
    </PageShell>
  );
}

