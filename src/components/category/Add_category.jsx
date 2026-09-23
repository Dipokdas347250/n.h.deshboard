import { useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, Field, inputClass } from "../common/PageShell";

export default function AddCategory() {
  const { t, apiMessage } = useLanguage();
  const [name, setName] = useState("");
  const [discount, setDiscount] = useState("0");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    const data = new FormData();
    data.append("name", name);
    data.append("discount", discount);
    data.append("image", image);

    try {
      await api.post("/products/allproducts", data);
      setName("");
      setDiscount("0");
      setImage(null);
      setNotice(t("category.created"));
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title={t("category.addTitle")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      <form onSubmit={submit} className="max-w-xl space-y-4 rounded-2xl bg-white/10 p-6">
        <Field label={t("category.name")} htmlFor="category-name">
          <input id="category-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder={t("category.namePlaceholder")} className={inputClass} />
        </Field>

        <Field label={t("category.discount")} htmlFor="category-discount">
          <input id="category-discount" type="number" min="0" max="100" value={discount} onChange={(event) => setDiscount(event.target.value)} className={inputClass} />
        </Field>

        <Field label={t("common.uploadImage")} htmlFor="category-image">
          <input
            id="category-image"
            required
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setImage(event.target.files?.[0] || null)}
            className="w-full cursor-pointer rounded-lg bg-white/15 p-2 text-white file:mr-3 file:rounded-md file:border-none file:bg-green-500 file:px-4 file:py-2 file:text-white"
          />
        </Field>

        {image && (
          <div>
            <p className="mb-2 text-sm text-white/60">{t("common.preview")}</p>
            <img src={URL.createObjectURL(image)} alt="" className="h-40 w-full rounded-lg object-cover" />
          </div>
        )}

        <button disabled={busy} className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white transition hover:bg-green-400 disabled:opacity-50">
          {busy ? t("common.saving") : t("category.addTitle")}
        </button>
      </form>
    </PageShell>
  );
}
