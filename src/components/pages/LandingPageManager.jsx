import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, Field, inputClass, selectClass } from "../common/PageShell";

const EMPTY_CONTENT = {
  bannerTitle: "",
  bannerText: "",
  bannerImage: "",
  bannerImages: [],
  deliveryZones: [],
  products: [
    { code: "15g", name: "", title: "", weight: "", price: "", image: "" },
    { code: "20g", name: "", title: "", weight: "", price: "", image: "" },
    { code: "50g", name: "", title: "", weight: "", price: "", image: "" },
  ],
};

const STATUSES = ["pending", "confirmed", "delivered", "cancelled"];

export default function LandingPageManager() {
  const { t, apiMessage, formatPrice, formatDate } = useLanguage();
  const [content, setContent] = useState(EMPTY_CONTENT);
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState("content");
  const bannerImageInput = useRef(null);
  const [bannerImageFiles, setBannerImageFiles] = useState([]);
  const [bannerImagePreviews, setBannerImagePreviews] = useState([]);
  const [removeBannerImages, setRemoveBannerImages] = useState(false);
  const [productImages, setProductImages] = useState([null, null, null]);
  const [productImagePreviews, setProductImagePreviews] = useState(["", "", ""]);
  const [removeProductImages, setRemoveProductImages] = useState([false, false, false]);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/landing-page"), api.get("/landing-page/orders")])
      .then(([contentResponse, ordersResponse]) => {
        if (!active) return;
        const page = contentResponse.data.data;
        setContent({
          bannerTitle: page.bannerTitle || "",
          bannerText: page.bannerText || "",
          bannerImage: page.bannerImage || "",
          bannerImages: page.bannerImages || (page.bannerImage ? [{ url: page.bannerImage }] : []),
          products: page.products || EMPTY_CONTENT.products,
          deliveryZones: page.deliveryZones || [],
        });
        setOrders(ordersResponse.data.data || []);
      })
      .catch((caught) => {
        if (!active) return;
        setError(apiMessage(caught));
        setOrders([]);
      });
    return () => {
      active = false;
    };
  }, [apiMessage]);

  useEffect(() => {
    const urls = bannerImageFiles.map((file) => URL.createObjectURL(file));
    setBannerImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [bannerImageFiles]);

  useEffect(() => {
    const urls = productImages.map((file) => file ? URL.createObjectURL(file) : "");
    setProductImagePreviews(urls);
    return () => urls.forEach((url) => url && URL.revokeObjectURL(url));
  }, [productImages]);

  const displayedBannerImages = bannerImagePreviews.length
    ? bannerImagePreviews
    : content.bannerImages.map((item) => item.url);

  const updateProduct = (index, key, value) => {
    setContent((current) => ({
      ...current,
      products: current.products.map((product, productIndex) =>
        productIndex === index ? { ...product, [key]: value } : product
      ),
    }));
  };

  const saveContent = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData();
    form.append("bannerTitle", content.bannerTitle);
    form.append("bannerText", content.bannerText);
    form.append("products", JSON.stringify(content.products));
    form.append("deliveryZones", JSON.stringify(content.deliveryZones));
    bannerImageFiles.forEach((file) => form.append("bannerImages", file));
    if (removeBannerImages && !bannerImageFiles.length) form.append("removeBannerImages", "true");
    productImages.forEach((file, index) => {
      if (file) form.append(`productImage${index}`, file);
      if (removeProductImages[index]) form.append(`removeProductImage${index}`, "true");
    });

    try {
      const response = await api.patch("/landing-page", form);
      const page = response.data.data;
      setContent({
        bannerTitle: page.bannerTitle,
        bannerText: page.bannerText,
        bannerImage: page.bannerImage,
        bannerImages: page.bannerImages || [],
        products: page.products,
        deliveryZones: page.deliveryZones || [],
      });
      setBannerImageFiles([]);
      if (bannerImageInput.current) bannerImageInput.current.value = "";
      setRemoveBannerImages(false);
      setProductImages([null, null, null]);
      setRemoveProductImages([false, false, false]);
      setNotice(t("landing.saved"));
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const saveStatus = async (order) => {
    setError("");
    setNotice("");
    const status = statusDrafts[order._id] || order.status;
    try {
      const response = await api.patch(`/landing-page/orders/${order._id}`, { status });
      setOrders((current) => current.map((item) => item._id === order._id ? response.data.data : item));
      setNotice(t("landing.orderUpdated"));
    } catch (caught) {
      setError(apiMessage(caught));
    }
  };

  return (
    <PageShell title={t("landing.title")} subtitle={t("landing.subtitle")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      <div className="mb-6 flex gap-2" role="tablist" aria-label={t("landing.title")}>
        {["content", "orders"].map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={`rounded-lg px-4 py-2 font-semibold transition ${tab === item ? "bg-white text-[#062B63]" : "bg-white/10 text-white hover:bg-white/20"}`}
          >
            {t(`landing.tab.${item}`)}
          </button>
        ))}
      </div>

      {tab === "content" ? (
        <form onSubmit={saveContent} className="max-w-4xl space-y-6">
          <section className="space-y-4 rounded-2xl bg-white/10 p-5">
            <h2 className="text-lg font-semibold">{t("landing.banner")}</h2>
            <Field label={t("landing.bannerTitle")} htmlFor="landing-banner-title">
              <input
                id="landing-banner-title"
                maxLength={200}
                required
                value={content.bannerTitle}
                onChange={(event) => setContent((current) => ({ ...current, bannerTitle: event.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label={t("landing.bannerText")} htmlFor="landing-banner-text">
              <textarea
                id="landing-banner-text"
                maxLength={1000}
                required
                rows={4}
                value={content.bannerText}
                onChange={(event) => setContent((current) => ({ ...current, bannerText: event.target.value }))}
                className={inputClass}
              />
            </Field>
            <Field label={t("landing.bannerImage")} htmlFor="landing-banner-image" hint={t("landing.bannerImagesHint")}>
              <input
                id="landing-banner-image"
                ref={bannerImageInput}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  if (files.length > 10) {
                    setError(t("landing.bannerImagesLimit"));
                    event.target.value = "";
                    return;
                  }
                  setBannerImageFiles(files);
                  setError("");
                  setRemoveBannerImages(false);
                }}
                className="w-full cursor-pointer rounded-lg bg-white/15 p-2 text-white file:mr-3 file:rounded-md file:border-none file:bg-green-500 file:px-4 file:py-2 file:text-white"
              />
            </Field>
            {displayedBannerImages.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {displayedBannerImages.map((src, index) => (
                  <img key={`${src}-${index}`} src={src} alt={`${content.bannerTitle} ${index + 1}`} className="h-24 w-36 rounded-lg object-cover" />
                ))}
              </div>
            )}
            {content.bannerImages.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  checked={removeBannerImages}
                  onChange={(event) => setRemoveBannerImages(event.target.checked)}
                  type="checkbox"
                />
                {t("landing.removeBannerImages")}
              </label>
            )}
          </section>

          <section className="space-y-4 rounded-2xl bg-white/10 p-5">
            <div>
              <h2 className="text-lg font-semibold">{t("landing.products")}</h2>
              <p className="mt-1 text-sm text-white/60">{t("landing.productsHint")}</p>
            </div>
            {content.products.map((product, index) => (
              <fieldset key={product.code || index} className="grid gap-4 rounded-xl border border-white/15 p-4 sm:grid-cols-2">
                <legend className="px-2 font-semibold">{t("landing.productNumber", { number: index + 1 })}</legend>
                <Field label={t("landing.productName")} htmlFor={`landing-name-${index}`}>
                  <input id={`landing-name-${index}`} maxLength={120} required value={product.name} onChange={(event) => updateProduct(index, "name", event.target.value)} className={inputClass} />
                </Field>
                <Field label={t("landing.productTitle")} htmlFor={`landing-title-${index}`}>
                  <input id={`landing-title-${index}`} maxLength={120} required value={product.title} onChange={(event) => updateProduct(index, "title", event.target.value)} className={inputClass} />
                </Field>
                <Field label={t("landing.weight")} htmlFor={`landing-weight-${index}`}>
                  <input id={`landing-weight-${index}`} maxLength={50} required value={product.weight || ""} onChange={(event) => updateProduct(index, "weight", event.target.value)} className={inputClass} />
                </Field>
                <Field label={t("landing.price")} htmlFor={`landing-price-${index}`}>
                  <input id={`landing-price-${index}`} type="number" min="0" step="0.01" required value={product.price} onChange={(event) => updateProduct(index, "price", event.target.value)} className={inputClass} />
                </Field>
                <Field label={t("landing.productImage")} htmlFor={`landing-product-image-${index}`} hint={t("landing.imageHint")}>
                  <input
                    id={`landing-product-image-${index}`}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setProductImages((current) => current.map((item, itemIndex) => itemIndex === index ? file : item));
                      setRemoveProductImages((current) => current.map((removed, itemIndex) => itemIndex === index ? false : removed));
                    }}
                    className="w-full cursor-pointer rounded-lg bg-white/15 p-2 text-white file:mr-3 file:rounded-md file:border-none file:bg-green-500 file:px-4 file:py-2 file:text-white"
                  />
                </Field>
                {(productImagePreviews[index] || (!removeProductImages[index] && product.image)) && (
                  <img
                    src={productImagePreviews[index] || product.image}
                    alt={product.name}
                    className="max-h-40 w-full rounded-lg object-cover sm:col-span-2"
                  />
                )}
                {product.image && (
                  <label className="flex items-center gap-2 text-sm text-white/80 sm:col-span-2">
                    <input
                      checked={removeProductImages[index]}
                      onChange={(event) => {
                        setRemoveProductImages((current) => current.map((removed, itemIndex) => itemIndex === index ? event.target.checked : removed));
                        if (event.target.checked) {
                          setProductImages((current) => current.map((file, itemIndex) => itemIndex === index ? null : file));
                        }
                      }}
                      type="checkbox"
                    />
                    {t("landing.removeProductImage")}
                  </label>
                )}
              </fieldset>
            ))}
          </section>

          <section className="space-y-4 rounded-2xl bg-white/10 p-5">
            <div>
              <h2 className="text-lg font-semibold">{t("landing.deliveryCharges")}</h2>
              <p className="mt-1 text-sm text-white/60">{t("landing.deliveryChargesHint")}</p>
            </div>
            {content.deliveryZones.map((zone, index) => (
              <fieldset key={zone.key} className="grid gap-4 rounded-xl border border-white/15 p-4 sm:grid-cols-2">
                <legend className="px-2 font-semibold">{zone.key}</legend>
                <Field label={t("landing.deliveryLabel")} htmlFor={`landing-zone-label-${index}`}>
                  <input id={`landing-zone-label-${index}`} maxLength={100} required value={zone.label} onChange={(event) => setContent((current) => ({ ...current, deliveryZones: current.deliveryZones.map((item, zoneIndex) => zoneIndex === index ? { ...item, label: event.target.value } : item) }))} className={inputClass} />
                </Field>
                <Field label={t("landing.deliveryLabelBn")} htmlFor={`landing-zone-label-bn-${index}`}>
                  <input id={`landing-zone-label-bn-${index}`} maxLength={100} required value={zone.labelBn} onChange={(event) => setContent((current) => ({ ...current, deliveryZones: current.deliveryZones.map((item, zoneIndex) => zoneIndex === index ? { ...item, labelBn: event.target.value } : item) }))} className={inputClass} />
                </Field>
                <Field label={t("landing.deliveryCharge")} htmlFor={`landing-zone-charge-${index}`}>
                  <input id={`landing-zone-charge-${index}`} type="number" min="0" step="0.01" required value={zone.charge} onChange={(event) => setContent((current) => ({ ...current, deliveryZones: current.deliveryZones.map((item, zoneIndex) => zoneIndex === index ? { ...item, charge: event.target.value } : item) }))} className={inputClass} />
                </Field>
              </fieldset>
            ))}
          </section>

          <button disabled={busy} className="rounded-lg bg-green-500 px-6 py-3 font-semibold text-white transition hover:bg-green-400 disabled:opacity-50">
            {busy ? t("common.saving") : t("common.save")}
          </button>
        </form>
      ) : orders === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : orders.length ? (
        <div className="grid gap-4">
          {orders.map((order) => (
            <article key={order._id} className="rounded-2xl bg-white/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{order.orderNumber}</h2>
                  <p className="mt-1 text-sm text-white/60">{formatDate(order.createdAt)}</p>
                </div>
                <strong>{formatPrice(order.total)}</strong>
              </div>
              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-semibold">{order.customer.name}</p>
                  <a className="mt-1 inline-block underline" href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
                  <p className="mt-1 text-white/70">{order.customer.address}, {order.customer.city}</p>
                </div>
                <div className="text-white/80">
                  <p>{order.product.name} — {order.product.title}</p>
                  <p>{t("landing.quantity")}: {order.quantity} · {formatPrice(order.product.unitPrice)} each</p>
                  <p>{order.deliveryZoneLabel}: {formatPrice(order.deliveryCharge)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-white/10 pt-4">
                <Field label={t("landing.status")} htmlFor={`landing-order-status-${order._id}`}>
                  <select
                    id={`landing-order-status-${order._id}`}
                    value={statusDrafts[order._id] || order.status}
                    onChange={(event) => setStatusDrafts((current) => ({ ...current, [order._id]: event.target.value }))}
                    className={`${selectClass} min-w-48`}
                  >
                    {STATUSES.map((status) => <option key={status} value={status}>{t(`landing.status.${status}`)}</option>)}
                  </select>
                </Field>
                <button type="button" onClick={() => saveStatus(order)} className="rounded-lg bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-400">
                  {t("common.save")}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyNote message={t("landing.ordersEmpty")} />
      )}
    </PageShell>
  );
}
