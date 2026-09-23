import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, Field, inputClass } from "../common/PageShell";

const BLANK_FORM = { title: "", description: "", price: "", discountPrice: "", offer: "", sku: "", images: [] };

export default function AllProduct() {
  const { t, apiMessage, formatPrice } = useLanguage();
  const [searchParams] = useSearchParams();
  const search = (searchParams.get("search") || "").toLowerCase();

  const [products, setProducts] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    api.get("/mainproduct/all-product")
      .then((response) => {
        if (active) setProducts(response.data.data || []);
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

  const remove = async (id) => {
    if (!window.confirm(t("common.confirmDelete"))) return;
    try {
      await api.delete(`/mainproduct/delete-product/${id}`);
      setProducts((current) => current.filter((item) => item._id !== id));
      setNotice(t("product.deleted"));
    } catch (caught) {
      setError(apiMessage(caught));
    }
  };

  const startEdit = (product) => {
    setError("");
    setNotice("");
    setEditing(product._id);
    setForm({
      title: product.title || "",
      description: product.description || "",
      price: product.price ?? "",
      discountPrice: product.discountPrice ?? product.diccountprice ?? "",
      offer: product.offer || "",
      sku: product.sku || "",
      images: [],
    });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key !== "images") data.append(key, value);
    });
    form.images.forEach((image) => data.append("images", image));

    try {
      const response = await api.patch(`/mainproduct/update-product/${editing}`, data);
      setProducts((current) => current.map((item) => (item._id === editing ? { ...item, ...response.data.data } : item)));
      setEditing(null);
      setNotice(t("product.updated"));
    } catch (caught) {
      setError(apiMessage(caught));
    }
  };

  const visible = (products || []).filter((product) =>
    !search || product.title?.toLowerCase().includes(search) || product.sku?.toLowerCase().includes(search)
  );

  return (
    <PageShell title={t("product.allTitle")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      {products === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : visible.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((product) => (
            <article key={product._id} className="rounded-xl bg-white/10 p-4 shadow-lg">
              <img src={product.image?.[0]} alt={product.title} className="h-40 w-full rounded-lg bg-white/5 object-cover" />

              {editing === product._id ? (
                <form onSubmit={saveEdit} className="mt-3 space-y-2">
                  <Field label={t("product.name")} htmlFor={`edit-title-${product._id}`}>
                    <input id={`edit-title-${product._id}`} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={`${inputClass} !p-2`} />
                  </Field>
                  <Field label={t("product.description")} htmlFor={`edit-description-${product._id}`}>
                    <textarea id={`edit-description-${product._id}`} required rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${inputClass} !p-2`} />
                  </Field>
                  <Field label={t("product.price")} htmlFor={`edit-price-${product._id}`}>
                    <input id={`edit-price-${product._id}`} required type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className={`${inputClass} !p-2`} />
                  </Field>
                  <Field label={t("product.offerPrice")} htmlFor={`edit-discount-${product._id}`}>
                    <input id={`edit-discount-${product._id}`} type="number" min="0" max={form.price || undefined} value={form.discountPrice} onChange={(event) => setForm({ ...form, discountPrice: event.target.value })} className={`${inputClass} !p-2`} />
                  </Field>
                  <Field label={t("product.offerLabel")} htmlFor={`edit-offer-${product._id}`}>
                    <input id={`edit-offer-${product._id}`} value={form.offer} onChange={(event) => setForm({ ...form, offer: event.target.value })} className={`${inputClass} !p-2`} />
                  </Field>
                  <Field label={t("product.sku")} htmlFor={`edit-sku-${product._id}`}>
                    <input id={`edit-sku-${product._id}`} value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} className={`${inputClass} !p-2`} />
                  </Field>
                  <Field label={t("product.images")} htmlFor={`edit-images-${product._id}`}>
                    <input
                      id={`edit-images-${product._id}`}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={(event) => setForm({ ...form, images: Array.from(event.target.files || []) })}
                      className="w-full text-sm text-white"
                    />
                  </Field>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 rounded bg-green-500 py-2 text-white">{t("common.save")}</button>
                    <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded bg-white/20 py-2 text-white">{t("common.cancel")}</button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="mt-3 truncate text-lg font-semibold">{product.title}</h2>
                  <dl className="mt-2 space-y-1 text-sm text-white/70">
                    <div className="flex justify-between gap-2">
                      <dt>{t("product.sku")}</dt>
                      <dd className="truncate">{product.sku || product.slug}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t("product.price")}</dt>
                      <dd>{formatPrice(product.price)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t("product.offerPrice")}</dt>
                      <dd>
                        {product.discountPrice ?? product.diccountprice ? formatPrice(product.discountPrice ?? product.diccountprice) : "—"}
                        {product.offer ? ` (${product.offer})` : ""}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t("product.category")}</dt>
                      <dd className="truncate">{product.category?.name || "—"}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => startEdit(product)} className="flex-1 rounded-lg bg-blue-500 py-2 text-sm text-white transition hover:bg-blue-400">
                      {t("common.edit")}
                    </button>
                    <button onClick={() => remove(product._id)} className="flex-1 rounded-lg bg-red-500 py-2 text-sm text-white transition hover:bg-red-400">
                      {t("common.delete")}
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyNote message={t("product.none")} />
      )}
    </PageShell>
  );
}
