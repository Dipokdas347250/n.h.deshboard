import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, Field, inputClass } from "../common/PageShell";

const FIELDS = [
  ["title", "banner.heading"],
  ["titleBn", "banner.headingBn"],
  ["subtitle", "banner.subtitle"],
  ["subtitleBn", "banner.subtitleBn"],
  ["description", "banner.description"],
  ["descriptionBn", "banner.descriptionBn"],
  ["buttonLabel", "banner.buttonLabel"],
  ["buttonLabelBn", "banner.buttonLabelBn"],
  ["url", "banner.url"],
];

export default function GetBanner() {
  const { t, apiMessage, pick } = useLanguage();
  const [banners, setBanners] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    api.get("/banner/all-banner")
      .then((response) => {
        if (active) setBanners(response.data.data || []);
      })
      .catch((caught) => {
        if (!active) return;
        setBanners([]);
        setError(apiMessage(caught));
      });

    return () => {
      active = false;
    };
  }, [apiMessage]);

  const remove = async (id) => {
    if (!window.confirm(t("common.confirmDelete"))) return;
    try {
      await api.delete(`/banner/delete-banner/${id}`);
      setBanners((current) => current.filter((item) => item._id !== id));
      setNotice(t("banner.deleted"));
    } catch (caught) {
      setError(apiMessage(caught));
    }
  };

  const startEdit = (banner) => {
    setError("");
    setNotice("");
    setEditing(banner._id);
    setForm(Object.fromEntries(FIELDS.map(([key]) => [key, banner[key] || ""])));
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.patch(`/banner/update-banner/${editing}`, form);
      setBanners((current) => current.map((item) => (item._id === editing ? response.data.data : item)));
      setEditing(null);
      setNotice(t("banner.updated"));
    } catch (caught) {
      setError(apiMessage(caught));
    }
  };

  return (
    <PageShell title={t("banner.allTitle")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      {banners === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : banners.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {banners.map((banner) => (
            <article key={banner._id} className="rounded-xl bg-white/10 p-4 shadow-lg">
              <img src={banner.image} alt={banner.title || ""} className="h-44 w-full rounded-lg bg-white/5 object-cover" />

              {editing === banner._id ? (
                <form onSubmit={saveEdit} className="mt-3 space-y-2">
                  {FIELDS.map(([key, labelKey]) => (
                    <Field key={key} label={t(labelKey)} htmlFor={`banner-${key}-${banner._id}`}>
                      <input
                        id={`banner-${key}-${banner._id}`}
                        value={form[key] ?? ""}
                        onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                        className={`${inputClass} !p-2`}
                      />
                    </Field>
                  ))}
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 rounded bg-green-500 py-2 text-white">{t("common.save")}</button>
                    <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded bg-white/20 py-2 text-white">{t("common.cancel")}</button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="mt-3 text-lg font-semibold">{pick(banner.title, banner.titleBn) || "—"}</h2>
                  <p className="mt-1 text-sm text-white/70">{pick(banner.subtitle, banner.subtitleBn)}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-white/60">{pick(banner.description, banner.descriptionBn)}</p>
                  <p className="mt-2 truncate font-mono text-xs text-white/50">{banner.url || "—"}</p>

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => startEdit(banner)} className="flex-1 rounded-lg bg-blue-500 py-2 text-sm text-white transition hover:bg-blue-400">
                      {t("common.edit")}
                    </button>
                    <button onClick={() => remove(banner._id)} className="flex-1 rounded-lg bg-red-500 py-2 text-sm text-white transition hover:bg-red-400">
                      {t("common.delete")}
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyNote message={t("banner.none")} />
      )}
    </PageShell>
  );
}
