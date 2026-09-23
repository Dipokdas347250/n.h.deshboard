import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, Field, inputClass, selectClass } from "../common/PageShell";

const BLANK_VARIANT = { size: "", color: "", sku: "" };

export default function AddProduct() {
  const { t, apiMessage } = useLanguage();
  const [form, setForm] = useState({ title: "", description: "", price: "", discountPrice: "", offer: "", sku: "", category: "" });
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([{ ...BLANK_VARIANT }]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    api.get("/products/allCategory")
      .then((response) => {
        if (active) setCategories(response.data.data || []);
      })
      .catch((caught) => {
        if (active) setError(apiMessage(caught, "product.categoriesFailed"));
      });

    return () => {
      active = false;
    };
  }, [apiMessage]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const updateVariant = (index, patch) =>
    setVariants((current) => current.map((variant, variantIndex) => (variantIndex === index ? { ...variant, ...patch } : variant)));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    // Only variants with a size or a colour are worth saving.
    data.append("variants", JSON.stringify(variants.filter((variant) => variant.size.trim() || variant.color.trim())));
    images.forEach((file) => data.append("images", file));

    try {
      await api.post("/mainproduct/all-main-product", data);
      setForm({ title: "", description: "", price: "", discountPrice: "", offer: "", sku: "", category: "" });
      setImages([]);
      setVariants([{ ...BLANK_VARIANT }]);
      setNotice(t("product.created"));
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title={t("product.addTitle")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-2xl bg-white/10 p-6">
        <Field label={t("product.name")} htmlFor="product-title">
          <input id="product-title" required name="title" value={form.title} onChange={change} placeholder={t("product.namePlaceholder")} className={inputClass} />
        </Field>

        <Field label={t("product.description")} htmlFor="product-description">
          <textarea id="product-description" required name="description" rows={4} value={form.description} onChange={change} placeholder={t("product.descriptionPlaceholder")} className={inputClass} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("product.price")} htmlFor="product-price">
            <input id="product-price" required type="number" min="0" name="price" value={form.price} onChange={change} className={inputClass} />
          </Field>
          <Field label={t("product.offerPrice")} hint={t("product.offerPriceHint")} htmlFor="product-discount">
            <input id="product-discount" type="number" min="0" max={form.price || undefined} name="discountPrice" value={form.discountPrice} onChange={change} className={inputClass} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("product.offerLabel")} htmlFor="product-offer">
            <input id="product-offer" name="offer" value={form.offer} onChange={change} placeholder={t("product.offerLabelPlaceholder")} className={inputClass} />
          </Field>
          <Field label={t("product.sku")} htmlFor="product-sku">
            <input id="product-sku" name="sku" value={form.sku} onChange={change} className={inputClass} />
          </Field>
        </div>

        <Field label={t("product.category")} htmlFor="product-category">
          <select id="product-category" required name="category" value={form.category} onChange={change} className={selectClass}>
            <option value="">{t("product.selectCategory")}</option>
            {categories.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <p className="mb-1.5 text-sm text-white/80">{t("product.variants")}</p>
          <div className="space-y-2">
            {variants.map((variant, index) => (
              <div key={index} className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <input
                  value={variant.size}
                  onChange={(event) => updateVariant(index, { size: event.target.value })}
                  placeholder={t("product.size")}
                  aria-label={t("product.size")}
                  className={`${inputClass} !p-2`}
                />
                <input
                  value={variant.color}
                  onChange={(event) => updateVariant(index, { color: event.target.value })}
                  placeholder={t("product.color")}
                  aria-label={t("product.color")}
                  className={`${inputClass} !p-2`}
                />
                <input
                  value={variant.sku}
                  onChange={(event) => updateVariant(index, { sku: event.target.value })}
                  placeholder={t("product.sku")}
                  aria-label={t("product.sku")}
                  className={`${inputClass} !p-2`}
                />
                <button
                  type="button"
                  onClick={() => setVariants((current) => current.filter((_, variantIndex) => variantIndex !== index))}
                  disabled={variants.length === 1}
                  className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white disabled:opacity-40"
                >
                  {t("common.delete")}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setVariants((current) => [...current, { ...BLANK_VARIANT }])}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition hover:bg-blue-400"
            >
              {t("product.addVariant")}
            </button>
          </div>
        </div>

        <Field label={t("product.images")} htmlFor="product-images">
          <input
            id="product-images"
            required
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(event) => setImages(Array.from(event.target.files || []))}
            className="w-full cursor-pointer rounded-lg bg-white/15 p-2 text-white file:mr-3 file:rounded-md file:border-none file:bg-green-500 file:px-4 file:py-2 file:text-white"
          />
        </Field>

        {images.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-white/60">{t("common.preview")}</p>
            <div className="flex gap-3 overflow-x-auto">
              {images.map((file) => (
                <img key={file.name} src={URL.createObjectURL(file)} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" />
              ))}
            </div>
          </div>
        )}

        <button disabled={busy} className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white transition hover:bg-green-400 disabled:opacity-50">
          {busy ? t("common.saving") : t("product.addTitle")}
        </button>
      </form>
    </PageShell>
  );
}
