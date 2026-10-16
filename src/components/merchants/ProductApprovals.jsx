import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, inputClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";

const TABS = ["pending", "approved", "rejected", "all"];

const chipClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"}`;

/**
 * Merchant products waiting for a decision. Nothing a merchant uploads
 * reaches the storefront until it is approved here.
 */
export default function ProductApprovals() {
  const { t, apiMessage, formatPrice, formatNumber, formatDate } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.includes(searchParams.get("status")) ? searchParams.get("status") : "pending";
  const merchant = searchParams.get("merchant") || "";

  const [data, setData] = useState(null);
  const [reasons, setReasons] = useState({});
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(
    () => api.get("/admin/merchant-products", { params: { status: tab, merchant: merchant || undefined } }).then((response) => response.data.data),
    [tab, merchant]
  );

  useEffect(() => {
    let active = true;
    load()
      .then((result) => active && setData(result))
      .catch((caught) => {
        if (!active) return;
        setData({ products: [], pending: 0 });
        setError(apiMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [load, apiMessage]);

  const setTab = (next) => {
    const params = new URLSearchParams(searchParams);
    params.set("status", next);
    setSearchParams(params);
  };

  const decide = async (product, action) => {
    setBusy(product._id);
    setError("");
    setNotice("");
    try {
      const response = await api.post(`/admin/merchant-products/${product._id}/${action}`, { reason: reasons[product._id] || "" });
      setNotice(apiMessage({ response }));
      setData(await load());
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(null);
    }
  };

  const merchantName = data?.products[0]?.merchant?.name;

  return (
    <PageShell title={t("mprod.title")} subtitle={merchant && merchantName ? t("mprod.by", { name: merchantName }) : t("mprod.subtitle")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      <div className="mb-5 flex flex-wrap gap-2" role="group">
        {TABS.map((key) => (
          <button key={key} type="button" onClick={() => setTab(key)} aria-pressed={tab === key} className={chipClass(tab === key)}>
            {key === "all" ? t("common.all") : t(`approval.${key}`)}
            {key === "pending" && data?.pending ? ` · ${formatNumber(data.pending)}` : ""}
          </button>
        ))}
        {merchant && (
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.delete("merchant");
              setSearchParams(params);
            }}
            className={chipClass(false)}
          >
            {t("orders.allMerchants")} ✕
          </button>
        )}
      </div>

      {data === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : data.products.length ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {data.products.map((product) => {
            const hidden = product.merchant?.locked || product.merchant?.status === "suspended";
            return (
              <article key={product._id} className="rounded-xl bg-white/10 p-5">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(product.image || []).map((src) => (
                    <a key={src} href={src} target="_blank" rel="noreferrer noopener" className="shrink-0">
                      <img src={src} alt="" className="h-28 w-28 rounded-lg bg-white/5 object-cover" />
                    </a>
                  ))}
                </div>

                <div className="mt-3 flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold">{product.title}</h2>
                  <StatusBadge kind="approval" value={product.approvalStatus} />
                </div>
                <p className="text-sm text-white/70">
                  {t("mprod.by", { name: product.merchant?.name || "—" })} · {product.merchant?.phone}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm">{product.description}</p>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-white/70">
                  <div>
                    <dt className="text-white/50">{t("product.price")}</dt>
                    <dd>
                      {formatPrice(product.price)}
                      {product.discountPrice != null && ` → ${formatPrice(product.discountPrice)}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-white/50">{t("product.category")}</dt>
                    <dd>{product.category?.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-white/50">{t("mproduct.stock")}</dt>
                    <dd>{typeof product.stock === "number" ? formatNumber(product.stock) : t("mproduct.notTracked")}</dd>
                  </div>
                  <div>
                    <dt className="text-white/50">{t("product.variants")}</dt>
                    <dd>{(product.variant || []).map((variant) => [variant.size, variant.color].filter(Boolean).join("/")).join(", ") || "—"}</dd>
                  </div>
                </dl>

                {product.offer && <p className="mt-2 text-sm text-amber-200">{product.offer}</p>}
                {hidden && <p className="mt-3 rounded-lg bg-orange-500/20 p-2 text-xs text-orange-100">{t("mprod.merchantHidden")}</p>}
                {product.rejectionReason && <p className="mt-3 text-sm text-red-200">{t("mapps.reason", { reason: product.rejectionReason })}</p>}
                {product.reviewedBy && (
                  <p className="mt-1 text-xs text-white/50">{t("mapps.reviewedBy", { name: product.reviewedBy.fullname, date: formatDate(product.reviewedAt) })}</p>
                )}

                <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {product.approvalStatus !== "rejected" && (
                    <input
                      value={reasons[product._id] || ""}
                      onChange={(event) => setReasons((current) => ({ ...current, [product._id]: event.target.value }))}
                      placeholder={t("mprod.rejectReason")}
                      aria-label={t("mprod.rejectReason")}
                      className={`${inputClass} !p-2 text-sm`}
                    />
                  )}
                  <div className="flex gap-2">
                    {product.approvalStatus !== "approved" && (
                      <button
                        type="button"
                        disabled={busy === product._id}
                        onClick={() => decide(product, "approve")}
                        className="flex-1 rounded-lg bg-green-500 py-2 text-sm font-semibold text-white transition hover:bg-green-400 disabled:opacity-40"
                      >
                        {t("mprod.approve")}
                      </button>
                    )}
                    {product.approvalStatus !== "rejected" && (
                      <button
                        type="button"
                        disabled={busy === product._id}
                        onClick={() => decide(product, "reject")}
                        className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-40"
                      >
                        {t("mprod.reject")}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyNote message={t("mprod.none")} />
      )}
    </PageShell>
  );
}
