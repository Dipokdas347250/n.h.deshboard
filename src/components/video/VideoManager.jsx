import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, Field, inputClass } from "../common/PageShell";

const EMPTY = { youtubeUrl: "", title: "", titleBn: "", description: "", descriptionBn: "", products: [] };

/** Same rules as the server: the 11-character id from any common YouTube link. */
const youtubeIdOf = (value) => {
  const text = String(value || "").trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;
  const match = text.match(/(?:youtu\.be\/|[?&]v=|\/(?:shorts|embed|live|v)\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/);
  return match ? match[1] : "";
};

export default function VideoManager() {
  const { t, apiMessage, pick } = useLanguage();
  const [videos, setVideos] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [products, setProducts] = useState([]);
  // Id of the video whose product list is open for editing, and the draft picks.
  const [editing, setEditing] = useState(null);
  const [editPicks, setEditPicks] = useState([]);

  const load = () =>
    api.get("/video/admin/all-video")
      .then((response) => setVideos(response.data.data || []))
      .catch((caught) => {
        setVideos([]);
        setError(apiMessage(caught));
      });

  useEffect(() => {
    load();
    api.get("/mainproduct/all-product")
      .then((response) => setProducts(response.data.data || []))
      .catch((caught) => setError(apiMessage(caught)));
    // `load` only closes over stable helpers, so running once on mount is right.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewId = youtubeIdOf(form.youtubeUrl);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const upload = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api.post("/video/add-video", form);
      setForm(EMPTY);
      setNotice(t("video.created"));
      await load();
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (video) => {
    try {
      const response = await api.patch(`/video/update-video/${video._id}`, { isPublished: !video.isPublished });
      setVideos((current) => current.map((item) => (item._id === video._id ? response.data.data : item)));
      setNotice(t("video.updated"));
    } catch (caught) {
      setError(apiMessage(caught));
    }
  };

  const startEditing = (video) => {
    setEditing(video._id);
    setEditPicks((video.products || []).map((product) => product._id));
  };

  const saveProducts = async (video) => {
    try {
      const response = await api.patch(`/video/update-video/${video._id}`, { products: editPicks });
      setVideos((current) => current.map((item) => (item._id === video._id ? response.data.data : item)));
      setEditing(null);
      setNotice(t("video.updated"));
    } catch (caught) {
      setError(apiMessage(caught));
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("common.confirmDelete"))) return;
    try {
      await api.delete(`/video/delete-video/${id}`);
      setVideos((current) => current.filter((item) => item._id !== id));
      setNotice(t("video.deleted"));
    } catch (caught) {
      setError(apiMessage(caught));
    }
  };

  return (
    <PageShell title={t("video.title")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      <form onSubmit={upload} className="mb-8 max-w-3xl space-y-4 rounded-2xl bg-white/10 p-6">
        <h2 className="text-lg font-bold">{t("video.add")}</h2>

        <Field label={t("video.youtubeUrl")} hint={t("video.youtubeHint")} htmlFor="video-url">
          <input
            id="video-url"
            required
            type="url"
            name="youtubeUrl"
            value={form.youtubeUrl}
            onChange={change}
            placeholder="https://www.youtube.com/watch?v=..."
            className={inputClass}
          />
        </Field>

        {previewId && (
          <img
            src={`https://i.ytimg.com/vi/${previewId}/mqdefault.jpg`}
            alt={t("common.preview")}
            className="aspect-video w-full max-w-xs rounded-lg bg-black object-cover"
          />
        )}
        {form.youtubeUrl.trim() && !previewId && <p className="text-sm text-amber-200">{t("video.youtubeInvalid")}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("video.videoTitle")} htmlFor="video-title">
            <input id="video-title" required name="title" value={form.title} onChange={change} className={inputClass} />
          </Field>
          <Field label={t("video.videoTitleBn")} htmlFor="video-title-bn">
            <input id="video-title-bn" name="titleBn" value={form.titleBn} onChange={change} className={inputClass} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("video.description")} htmlFor="video-description">
            <textarea id="video-description" rows={2} name="description" value={form.description} onChange={change} className={inputClass} />
          </Field>
          <Field label={t("video.descriptionBn")} htmlFor="video-description-bn">
            <textarea id="video-description-bn" rows={2} name="descriptionBn" value={form.descriptionBn} onChange={change} className={inputClass} />
          </Field>
        </div>

        <Field label={t("video.products")} hint={t("video.productsHint")}>
          <ProductPicker
            products={products}
            selected={form.products}
            onChange={(picks) => setForm((current) => ({ ...current, products: picks }))}
          />
        </Field>

        <button disabled={busy || !previewId} className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white transition hover:bg-green-400 disabled:opacity-50">
          {busy ? t("common.saving") : t("video.add")}
        </button>
      </form>

      {videos === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : videos.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <article key={video._id} className="overflow-hidden rounded-xl bg-white/10 shadow-lg">
              {video.source === "youtube" && video.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0`}
                  title={pick(video.title, video.titleBn)}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="aspect-video w-full bg-black"
                />
              ) : (
                <video src={video.video} controls preload="metadata" className="aspect-video w-full bg-black object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-semibold">{pick(video.title, video.titleBn)}</h3>
                {(video.description || video.descriptionBn) && (
                  <p className="mt-1 line-clamp-2 text-sm text-white/60">{pick(video.description, video.descriptionBn)}</p>
                )}

                {editing === video._id ? (
                  <div className="mt-3 space-y-2">
                    <ProductPicker products={products} selected={editPicks} onChange={setEditPicks} />
                    <div className="flex gap-2">
                      <button onClick={() => saveProducts(video)} className="flex-1 rounded-lg bg-green-500 py-2 text-sm text-white transition hover:bg-green-400">
                        {t("common.save")}
                      </button>
                      <button onClick={() => setEditing(null)} className="flex-1 rounded-lg bg-white/15 py-2 text-sm text-white transition hover:bg-white/25">
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/50">{t("video.products")}</p>
                    {video.products?.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {video.products.map((product) => (
                          <span key={product._id} className="flex items-center gap-1.5 rounded-full bg-white/10 py-1 pl-1 pr-2.5 text-xs">
                            {product.image?.[0] && <img src={product.image[0]} alt="" className="h-5 w-5 rounded-full object-cover" />}
                            <span className="max-w-[10rem] truncate">{product.title}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/50">{t("video.noProducts")}</p>
                    )}
                    <button onClick={() => startEditing(video)} className="mt-2 text-sm font-semibold text-green-300 hover:text-green-200">
                      {t("video.editProducts")}
                    </button>
                  </div>
                )}

                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={video.isPublished} onChange={() => togglePublished(video)} className="h-4 w-4 accent-green-500" />
                  {t("video.published")}
                </label>

                <button onClick={() => remove(video._id)} className="mt-3 w-full rounded-lg bg-red-500 py-2 text-sm text-white transition hover:bg-red-400">
                  {t("common.delete")}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyNote message={t("video.none")} />
      )}
    </PageShell>
  );
}

/**
 * Searchable checklist of products. Selected ones stay pinned at the top so the
 * admin can see what is linked without scrolling through the catalogue.
 */
function ProductPicker({ products, selected, onChange }) {
  const { t, formatNumber, formatPrice } = useLanguage();
  const [query, setQuery] = useState("");

  const chosen = new Set(selected);
  const needle = query.trim().toLowerCase();
  const matches = products
    .filter((product) => !needle || `${product.title} ${product.sku || ""}`.toLowerCase().includes(needle))
    .sort((a, b) => chosen.has(b._id) - chosen.has(a._id));

  const toggle = (id) => onChange(chosen.has(id) ? selected.filter((item) => item !== id) : [...selected, id]);

  return (
    <div className="rounded-lg bg-white/5 p-3">
      <div className="mb-2 flex items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("video.productsSearch")}
          className={`${inputClass} py-2`}
        />
        <span className="shrink-0 text-xs text-white/60">{t("video.productsSelected", { count: formatNumber(selected.length) })}</span>
      </div>
      <ul className="max-h-60 space-y-1 overflow-y-auto pr-1">
        {matches.map((product) => (
          <li key={product._id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-md p-1.5 transition hover:bg-white/10">
              <input type="checkbox" checked={chosen.has(product._id)} onChange={() => toggle(product._id)} className="h-4 w-4 shrink-0 accent-green-500" />
              {product.image?.[0] ? (
                <img src={product.image[0]} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
              ) : (
                <span className="h-9 w-9 shrink-0 rounded bg-white/10" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm">{product.title}</span>
              <span className="shrink-0 text-xs text-white/60">{formatPrice(product.discountPrice ?? product.diccountprice ?? product.price)}</span>
            </label>
          </li>
        ))}
        {!matches.length && <li className="p-2 text-sm text-white/50">{t("video.productsNone")}</li>}
      </ul>
    </div>
  );
}
