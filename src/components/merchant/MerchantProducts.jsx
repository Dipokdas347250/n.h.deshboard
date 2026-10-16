import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { useMerchantStore } from "../zustendstore/MerchantStore";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, Field, inputClass, selectClass } from "../common/PageShell";
import StatusBadge from "../common/StatusBadge";
import { SubscriptionNotice } from "./MerchantLayout";

const TABS = ["all", "pending", "approved", "rejected"];

const formFrom = (product) => ({
  title: product.title || "",
  description: product.description || "",
  price: product.price ?? "",
  discountPrice: product.discountPrice ?? "",
  offer: product.offer || "",
  sku: product.sku || "",
  stock: product.stock ?? "",
  category: product.category?._id || "",
  images: [],
});

const chipClass = (active) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"}`;

/** The merchant's own catalogue. Only their products ever come back from the API. */
export default function MerchantProducts() {
  const { t, apiMessage, formatPrice, formatNumber } = useLanguage();
  const merchant = useMerchantStore((state) => state.merchant);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.includes(searchParams.get("status")) ? searchParams.get("status") : "all";
  const search = (searchParams.get("search") || "").toLowerCase();

  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [stockDraft, setStockDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const canEdit = merchant?.canEditProducts;

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/merchant/products"), api.get("/products/allCategory")])
      .then(([productResponse, categoryResponse]) => {
        if (!active) return;
        setProducts(productResponse.data.data || []);
        setCategories(categoryResponse.data.data || []);
      })
      .catch((caught) => {
        if (!active) return;
        setProducts([]);
        setError(apiMessage(caught));
      });
    return () => {
      active = false;
    };
  }, [apiMessage]);

  const replace = (updated) =>
    setProducts((current) => current.map((item) => (item._id === updated._id ? { ...item, ...updated, category: categories.find((c) => c._id === String(updated.category)) || item.category } : item)));

  const startEdit = (product) => {
    setError("");
    setNotice("");
    setEditing(product._id);
    setForm(formFrom(product));
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => key !== "images" && data.append(key, value));
    form.images.forEach((image) => data.append("images", image));

    setBusy(true);
    setError("");
    try {
      const response = await api.patch(`/merchant/products/${editing}`, data);
      replace(response.data.data);
      setEditing(null);
      setNotice(apiMessage({ response }));
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const saveStock = async (product) => {
    const value = stockDraft[product._id];
    setError("");
    setNotice("");
    try {
      const response = await api.patch(`/merchant/products/${product._id}`, { stock: value ?? "" });
      replace(response.data.data);
      setStockDraft((current) => ({ ...current, [product._id]: undefined }));
      setNotice(t("product.updated"));
    } catch (caught) {
      setError(apiMessage(caught));
    }
  };

  /** Hide a product from the website, or show it again. Hidden products stay hidden after a suspension is lifted. */
  const setListing = async (product, listingStatus) => {
    setError("");
    setNotice("");
    try {
      const response = await api.patch(`/merchant/products/${product._id}/listing`, { listingStatus });
      replace({ ...product, listingStatus: response.data.data.listingStatus });
      setNotice(apiMessage({ response }));
    } catch (caught) {
      setError(apiMessage(caught));
    }
  };

  const setTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === "all") params.delete("status");
    else params.set("status", next);
    setSearchParams(params);
  };

  const visible = (products || []).filter(
    (product) =>
      (tab === "all" || (product.approvalStatus || "approved") === tab) &&
      (!search || product.title?.toLowerCase().includes(search) || product.sku?.toLowerCase().includes(search))
  );
  const countOf = (key) => (products || []).filter((product) => key === "all" || (product.approvalStatus || "approved") === key).length;

  return (
    <PageShell
      title={t("mproduct.title")}
      subtitle={t("mproduct.reviewNote")}
      actions={
        canEdit && (
          <Link to="/merchant/products/new" className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-400">
            {t("mnav.addProduct")}
          </Link>
        )
      }
    >
      <SubscriptionNotice merchant={merchant} />
      {!canEdit && <p className="mb-4 text-sm text-white/70">{t("mproduct.readOnly")}</p>}
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      <div className="mb-5 flex flex-wrap gap-2" role="group">
        {TABS.map((key) => (
          <button key={key} type="button" onClick={() => setTab(key)} aria-pressed={tab === key} className={chipClass(tab === key)}>
            {key === "all" ? t("common.all") : t(`approval.${key}`)} · {formatNumber(countOf(key))}
          </button>
        ))}
      </div>

      {products === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : visible.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((product) => (
            <article key={product._id} className="rounded-xl bg-white/10 p-4 shadow-lg">
              <div className="relative">
                <img src={product.image?.[0]} alt={product.title} className="h-40 w-full rounded-lg bg-white/5 object-cover" />
                <span className="absolute left-2 top-2 flex flex-wrap gap-1">
                  <StatusBadge kind="approval" value={product.approvalStatus} />
                  {product.listingStatus === "hidden" && (
                    <span className="rounded-full bg-gray-900/70 px-2.5 py-1 text-xs font-semibold text-white">{t("visibility.hidden")}</span>
                  )}
                </span>
              </div>

              {editing === product._id ? (
                <form onSubmit={saveEdit} className="mt-3 space-y-2">
                  <Field label={t("product.name")} htmlFor={`m-title-${product._id}`}>
                    <input id={`m-title-${product._id}`} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={`${inputClass} !p-2`} />
                  </Field>
                  <Field label={t("product.description")} htmlFor={`m-description-${product._id}`}>
                    <textarea id={`m-description-${product._id}`} required rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${inputClass} !p-2`} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label={t("product.price")} htmlFor={`m-price-${product._id}`}>
                      <input id={`m-price-${product._id}`} required type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className={`${inputClass} !p-2`} />
                    </Field>
                    <Field label={t("product.offerPrice")} htmlFor={`m-discount-${product._id}`}>
                      <input id={`m-discount-${product._id}`} type="number" min="0" max={form.price || undefined} value={form.discountPrice} onChange={(event) => setForm({ ...form, discountPrice: event.target.value })} className={`${inputClass} !p-2`} />
                    </Field>
                    <Field label={t("product.offerLabel")} htmlFor={`m-offer-${product._id}`}>
                      <input id={`m-offer-${product._id}`} value={form.offer} onChange={(event) => setForm({ ...form, offer: event.target.value })} className={`${inputClass} !p-2`} />
                    </Field>
                    <Field label={t("mproduct.stock")} htmlFor={`m-stock-${product._id}`}>
                      <input id={`m-stock-${product._id}`} type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className={`${inputClass} !p-2`} />
                    </Field>
                  </div>
                  <Field label={t("product.sku")} htmlFor={`m-sku-${product._id}`}>
                    <input id={`m-sku-${product._id}`} value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} className={`${inputClass} !p-2`} />
                  </Field>
                  <Field label={t("product.category")} htmlFor={`m-category-${product._id}`}>
                    <select id={`m-category-${product._id}`} required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={`${selectClass} !p-2`}>
                      <option value="">{t("product.selectCategory")}</option>
                      {categories.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("mproduct.replaceImages")} htmlFor={`m-images-${product._id}`}>
                    <input
                      id={`m-images-${product._id}`}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={(event) => setForm({ ...form, images: Array.from(event.target.files || []) })}
                      className="w-full text-sm text-white"
                    />
                  </Field>
                  <div className="flex gap-2">
                    <button type="submit" disabled={busy} className="flex-1 rounded bg-green-500 py-2 text-white disabled:opacity-50">
                      {busy ? t("common.saving") : t("common.save")}
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded bg-white/20 py-2 text-white">
                      {t("common.cancel")}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="mt-3 truncate text-lg font-semibold">{product.title}</h2>
                  {product.approvalStatus === "rejected" && product.rejectionReason && (
                    <p className="mt-2 rounded-lg bg-red-500/20 p-2 text-xs text-red-100">{t("mproduct.rejectedBecause", { reason: product.rejectionReason })}</p>
                  )}
                  <dl className="mt-2 space-y-1 text-sm text-white/70">
                    <div className="flex justify-between gap-2">
                      <dt>{t("product.price")}</dt>
                      <dd>{formatPrice(product.price)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t("product.offerPrice")}</dt>
                      <dd>
                        {product.discountPrice != null ? formatPrice(product.discountPrice) : "—"}
                        {product.offer ? ` (${product.offer})` : ""}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t("product.category")}</dt>
                      <dd className="truncate">{product.category?.name || "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t("mproduct.stock")}</dt>
                      <dd className={product.stock === 0 ? "font-semibold text-red-300" : ""}>
                        {typeof product.stock === "number"
                          ? product.stock === 0
                            ? t("mproduct.outOfStock")
                            : formatNumber(product.stock)
                          : t("mproduct.notTracked")}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      aria-label={t("mproduct.quickStock")}
                      placeholder={t("mproduct.stock")}
                      value={stockDraft[product._id] ?? product.stock ?? ""}
                      onChange={(event) => setStockDraft((current) => ({ ...current, [product._id]: event.target.value }))}
                      className={`${inputClass} !p-2 text-sm`}
                    />
                    <button
                      type="button"
                      onClick={() => saveStock(product)}
                      disabled={stockDraft[product._id] === undefined}
                      className="shrink-0 rounded-lg bg-white/20 px-3 text-sm text-white transition hover:bg-white/30 disabled:opacity-40"
                    >
                      {t("mproduct.quickStock")}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => startEdit(product)}
                    disabled={!canEdit}
                    className="mt-2 w-full rounded-lg bg-blue-500 py-2 text-sm text-white transition hover:bg-blue-400 disabled:opacity-40"
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setListing(product, product.listingStatus === "hidden" ? "active" : "hidden")}
                    className="mt-2 w-full rounded-lg bg-white/15 py-2 text-sm text-white transition hover:bg-white/25"
                  >
                    {t(product.listingStatus === "hidden" ? "mproduct.show" : "mproduct.hide")}
                  </button>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyNote message={t("mproduct.none")} />
      )}
    </PageShell>
  );
}
