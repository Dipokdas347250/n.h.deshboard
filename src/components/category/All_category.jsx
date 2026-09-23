import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, Field, inputClass } from "../common/PageShell";

export default function AllCategory() {
  const { t, apiMessage, formatNumber } = useLanguage();
  const [categories, setCategories] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", discount: 0, image: null });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    api.get("/products/allCategory")
      .then((response) => {
        if (active) setCategories(response.data.data || []);
      })
      .catch((caught) => {
        if (!active) return;
        setCategories([]);
        setError(apiMessage(caught));
      });

    return () => {
      active = false;
    };
  }, [apiMessage]);

  const remove = async (id) => {
    if (!window.confirm(t("common.confirmDelete"))) return;
    try {
      await api.delete(`/products/delete-category/${id}`);
      setCategories((current) => current.filter((item) => item._id !== id));
      setNotice(t("category.deleted"));
    } catch (caught) {
      setError(apiMessage(caught));
    }
  };

  const startEdit = (category) => {
    setError("");
    setNotice("");
    setEditing(category._id);
    setForm({ name: category.name || "", discount: category.discount || 0, image: null });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    const data = new FormData();
    data.append("name", form.name);
    data.append("discount", form.discount);
    if (form.image) data.append("image", form.image);

    try {
      const response = await api.patch(`/products/update-category/${editing}`, data);
      setCategories((current) => current.map((item) => (item._id === editing ? { ...item, ...response.data.data } : item)));
      setEditing(null);
      setNotice(t("category.updated"));
    } catch (caught) {
      setError(apiMessage(caught));
    }
  };

  return (
    <PageShell title={t("category.allTitle")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      {categories === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : categories.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article key={category._id} className="rounded-xl bg-white/10 p-4 shadow-lg">
              <img src={category.image} alt={category.name} className="h-40 w-full rounded-lg bg-white/5 object-cover" />

              {editing === category._id ? (
                <form onSubmit={saveEdit} className="mt-3 space-y-2">
                  <Field label={t("category.name")} htmlFor={`edit-name-${category._id}`}>
                    <input id={`edit-name-${category._id}`} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={`${inputClass} !p-2`} />
                  </Field>
                  <Field label={t("category.discount")} htmlFor={`edit-discount-${category._id}`}>
                    <input id={`edit-discount-${category._id}`} type="number" min="0" max="100" value={form.discount} onChange={(event) => setForm({ ...form, discount: event.target.value })} className={`${inputClass} !p-2`} />
                  </Field>
                  <Field label={t("common.uploadImage")} htmlFor={`edit-image-${category._id}`}>
                    <input
                      id={`edit-image-${category._id}`}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => setForm({ ...form, image: event.target.files?.[0] || null })}
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
                  <h2 className="mt-3 truncate text-lg font-semibold">{category.name}</h2>
                  <dl className="mt-2 space-y-1 text-sm text-white/70">
                    <div className="flex justify-between gap-2">
                      <dt>{t("category.slug")}</dt>
                      <dd className="truncate font-mono">{category.slug}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{t("category.discount")}</dt>
                      <dd>{formatNumber(category.discount || 0)}%</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => startEdit(category)} className="flex-1 rounded-lg bg-blue-500 py-2 text-sm text-white transition hover:bg-blue-400">
                      {t("common.edit")}
                    </button>
                    <button onClick={() => remove(category._id)} className="flex-1 rounded-lg bg-red-500 py-2 text-sm text-white transition hover:bg-red-400">
                      {t("common.delete")}
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyNote message={t("category.none")} />
      )}
    </PageShell>
  );
}
