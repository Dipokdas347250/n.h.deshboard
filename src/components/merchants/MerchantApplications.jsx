import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, Field, inputClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";
import NidReveal from "../common/NidReveal";
import Modal from "../common/Modal";

const TABS = ["pending", "approved", "rejected", "all"];
const TRIAL_DAYS = 7;

const chipClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"}`;

/** One application opened for review: NID photos, same-NID accounts, approve or reject. */
/** Whether the NID number typed matched the number read off the card photo. Older applications have no check. */
function NidCheckNote({ check, detailed = false }) {
  const { t } = useLanguage();
  if (!check?.status) return null;
  const matched = check.status === "matched";
  return (
    <p className={`mt-2 rounded-lg px-2 py-1 text-xs ${matched ? "bg-green-500/20 text-green-100" : "bg-amber-500/20 text-amber-100"}`}>
      {t(matched ? "nidcheck.matched" : "nidcheck.notVerified")}
      {detailed && !matched && ` ${t("nidcheck.checkByEye")}`}
    </p>
  );
}

function ApplicationReview({ id, onClose, onDecided }) {
  const { t, apiMessage, formatDate, formatNumber } = useLanguage();
  const [application, setApplication] = useState(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [grantTrial, setGrantTrial] = useState(true);
  const [monthlyFee, setMonthlyFee] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get(`/admin/merchant-applications/${id}`)
      .then((response) => {
        if (!active) return;
        const data = response.data.data;
        setApplication(data);
        // A second account on the same NID gets no trial unless you choose it.
        setGrantTrial(!data.sameNidMerchants.length);
      })
      .catch((caught) => active && setError(apiMessage(caught)));
    return () => {
      active = false;
    };
  }, [id, apiMessage]);

  const duplicate = application?.sameNidMerchants.length > 0;

  const decide = async (action) => {
    setBusy(true);
    setError("");
    try {
      const response =
        action === "approve"
          ? await api.post(`/admin/merchant-applications/${id}/approve`, { allowDuplicateNid: allowDuplicate, grantTrial, monthlyFee })
          : await api.post(`/admin/merchant-applications/${id}/reject`, { reason });
      onDecided(apiMessage({ response }));
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={application?.fullname || t("mapps.view")} onClose={onClose} wide>
      <ErrorNote message={error} />
      {!application ? (
        !error && <p className="text-white/70">{t("common.loading")}</p>
      ) : (
        <div className="space-y-5">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-white/60">{t("apply.phone")}</dt>
              <dd>{application.phone}</dd>
            </div>
            <div>
              <dt className="text-white/60">{t("apply.email")}</dt>
              <dd className="break-all">{application.email || t("apply.noEmail")}</dd>
            </div>
            <div>
              <dt className="text-white/60">{t("apply.businessName")}</dt>
              <dd>{application.businessName || "—"}</dd>
            </div>
            <div>
              <dt className="text-white/60">{t("apply.address")}</dt>
              <dd className="whitespace-pre-line">{application.address || "—"}</dd>
            </div>
            {application.facebookPage && (
              <div className="sm:col-span-2">
                <dt className="text-white/60">{t("apply.facebookPage")}</dt>
                <dd>
                  <a href={application.facebookPage} target="_blank" rel="noreferrer noopener" className="break-all text-green-300 hover:underline">
                    {application.facebookPage}
                  </a>
                </dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-white/60">{t("apply.productType")}</dt>
              <dd className="whitespace-pre-line">{application.productType}</dd>
            </div>
            <div>
              <dt className="text-white/60">{t("apply.nidNumber")}</dt>
              <dd>
                <NidReveal masked={application.nidMasked} revealUrl={`/admin/merchant-applications/${application._id}/nid`} />
              </dd>
            </div>
            <div>
              <dt className="text-white/60">{t("mapps.appliedLabel")}</dt>
              <dd>{formatDate(application.createdAt)}</dd>
            </div>
          </dl>

          <div>
            <p className="mb-2 text-sm text-white/60">{t("mapps.nidPhotos")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[application.nidFrontUrl, application.nidBackUrl].map((url, index) => (
                <a key={index} href={url} target="_blank" rel="noreferrer noopener" title={t("mapps.openFull")} className="block">
                  <img src={url} alt={t(index ? "apply.nidBack" : "apply.nidFront")} className="h-48 w-full rounded-lg bg-white/5 object-contain" />
                </a>
              ))}
            </div>
          </div>

          <NidCheckNote check={application.nidCheck} detailed />
          {duplicate && (
            <div className="rounded-lg bg-orange-500/20 p-3 text-sm text-orange-50">
              <p className="font-semibold">{t("mapps.duplicate")}</p>
              <p className="mt-1">
                {t("mapps.duplicateDetail", {
                  names: application.sameNidMerchants.map((merchant) => `${merchant.name} (${merchant.businessName || merchant.email || merchant.phone || ""})`).join(", "),
                })}
              </p>
            </div>
          )}

          {application.status === "pending" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-xl bg-green-500/10 p-4">
                {duplicate && (
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" checked={allowDuplicate} onChange={(event) => setAllowDuplicate(event.target.checked)} className="mt-1" />
                    {t("mapps.allowDuplicate")}
                  </label>
                )}
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={grantTrial} onChange={(event) => setGrantTrial(event.target.checked)} className="mt-1" />
                  <span>
                    {t("mapps.grantTrial", { days: formatNumber(TRIAL_DAYS) })}
                    {duplicate && <span className="block text-xs text-white/60">{t("mapps.noTrialForDuplicate")}</span>}
                  </span>
                </label>
                <Field label={t("mapps.monthlyFee")} htmlFor="app-fee">
                  <input id="app-fee" type="number" min="0" value={monthlyFee} onChange={(event) => setMonthlyFee(event.target.value)} className={`${inputClass} !p-2`} />
                </Field>
                <button
                  type="button"
                  disabled={busy || (duplicate && !allowDuplicate)}
                  onClick={() => decide("approve")}
                  className="w-full rounded-lg bg-green-500 py-2 font-semibold text-white transition hover:bg-green-400 disabled:opacity-40"
                >
                  {t("mapps.approve")}
                </button>
              </div>

              <div className="space-y-3 rounded-xl bg-red-500/10 p-4">
                <Field label={t("mapps.rejectReason")} htmlFor="app-reason">
                  <textarea id="app-reason" rows={4} value={reason} onChange={(event) => setReason(event.target.value)} className={`${inputClass} !p-2`} />
                </Field>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => decide("reject")}
                  className="w-full rounded-lg bg-red-500 py-2 font-semibold text-white transition hover:bg-red-400 disabled:opacity-40"
                >
                  {t("mapps.reject")}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 text-sm text-white/70">
              <StatusBadge kind="merchant" value={application.status} />
              {application.reviewedBy && (
                <p>{t("mapps.reviewedBy", { name: application.reviewedBy.fullname, date: formatDate(application.reviewedAt) })}</p>
              )}
              {application.rejectionReason && <p>{t("mapps.reason", { reason: application.rejectionReason })}</p>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/** Everyone who has asked to sell on N H Shop, newest first. */
export default function MerchantApplications() {
  const { t, apiMessage, formatDate, formatNumber } = useLanguage();
  const [tab, setTab] = useState("pending");
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(() => api.get("/admin/merchant-applications", { params: { status: tab } }).then((response) => response.data.data), [tab]);

  useEffect(() => {
    let active = true;
    load()
      .then((result) => active && setData(result))
      .catch((caught) => {
        if (!active) return;
        setData({ applications: [], pending: 0 });
        setError(apiMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [load, apiMessage]);

  const decided = async (message) => {
    setOpen(null);
    setNotice(message);
    setData(await load());
  };

  return (
    <PageShell title={t("mapps.title")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      <div className="mb-5 flex flex-wrap gap-2" role="group">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (key === tab) return;
              setData(null);
              setTab(key);
            }}
            aria-pressed={tab === key}
            className={chipClass(tab === key)}
          >
            {key === "all" ? t("common.all") : t(`mstatus.${key}`)}
            {key === "pending" && data?.pending ? ` · ${formatNumber(data.pending)}` : ""}
          </button>
        ))}
      </div>

      {data === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : data.applications.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.applications.map((application) => (
            <article key={application._id} className="flex flex-col rounded-xl bg-white/10 p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{application.fullname}</h2>
                <StatusBadge kind="merchant" value={application.status} />
              </div>
              {application.businessName && <p className="mt-2 text-sm font-semibold">{application.businessName}</p>}
              <p className="mt-1 break-all text-sm text-white/70">{application.email || application.phone}</p>
              <p className="text-sm text-white/70">{application.phone}</p>
              <p className="mt-2 line-clamp-2 text-sm">{application.productType}</p>
              <NidCheckNote check={application.nidCheck} />
              {application.duplicateNid && (
                <p className="mt-2 rounded-lg bg-orange-500/20 px-2 py-1 text-xs text-orange-100">{t("mapps.duplicate")}</p>
              )}
              <p className="mt-3 text-xs text-white/50">{t("mapps.applied", { date: formatDate(application.createdAt) })}</p>
              <button
                type="button"
                onClick={() => setOpen(application._id)}
                className="mt-4 rounded-lg bg-blue-500 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                {t("mapps.view")}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyNote message={t("mapps.none")} />
      )}

      {open && <ApplicationReview id={open} onClose={() => setOpen(null)} onDecided={decided} />}
    </PageShell>
  );
}
