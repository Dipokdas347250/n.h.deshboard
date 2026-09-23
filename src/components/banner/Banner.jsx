import { useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, Field, inputClass } from "../common/PageShell";

const EMPTY = {
  url: "",
  title: "", titleBn: "",
  subtitle: "", subtitleBn: "",
  description: "", descriptionBn: "",
  buttonLabel: "", buttonLabelBn: "",
};

/**
 * Uploads a home-page banner. Every piece of copy is captured in both English
 * and Bangla so the slide reads naturally whichever language a visitor picked.
 */
export default function AddBanner() {
  const { t, apiMessage } = useLanguage();
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    const data = new FormData();
    data.append("image", image);
    Object.entries(form).forEach(([key, value]) => data.append(key, value));

    try {
      await api.post("/banner/add-banner", data);
      setForm(EMPTY);
      setImage(null);
      setNotice(t("banner.created"));
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const pairs = [
    ["title", "titleBn", "banner.heading", "banner.headingBn"],
    ["subtitle", "subtitleBn", "banner.subtitle", "banner.subtitleBn"],
    ["description", "descriptionBn", "banner.description", "banner.descriptionBn"],
    ["buttonLabel", "buttonLabelBn", "banner.buttonLabel", "banner.buttonLabelBn"],
  ];

  return (
    <PageShell title={t("banner.addTitle")}>
      <ErrorNote message={error} />
      <SuccessNote message={notice} />

      <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-2xl bg-white/10 p-6">
        <Field label={t("banner.image")} htmlFor="banner-image">
          <input
            id="banner-image"
            required
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setImage(event.target.files?.[0] || null)}
            className="w-full cursor-pointer rounded-lg bg-white/15 p-2 text-white file:mr-3 file:rounded-md file:border-none file:bg-green-500 file:px-4 file:py-2 file:text-white"
          />
        </Field>

        {image && <img src={URL.createObjectURL(image)} alt="" className="h-40 w-full rounded-lg object-cover" />}

        {pairs.map(([enKey, bnKey, enLabel, bnLabel]) => (
          <div key={enKey} className="grid gap-4 sm:grid-cols-2">
            <Field label={t(enLabel)} htmlFor={`banner-${enKey}`}>
              <input id={`banner-${enKey}`} name={enKey} value={form[enKey]} onChange={change} className={inputClass} />
            </Field>
            <Field label={t(bnLabel)} htmlFor={`banner-${bnKey}`}>
              <input id={`banner-${bnKey}`} name={bnKey} value={form[bnKey]} onChange={change} className={inputClass} />
            </Field>
          </div>
        ))}

        <Field label={t("banner.url")} htmlFor="banner-url">
          <input id="banner-url" name="url" value={form.url} onChange={change} placeholder={t("banner.urlPlaceholder")} className={inputClass} />
        </Field>

        <button disabled={busy} className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white transition hover:bg-green-400 disabled:opacity-50">
          {busy ? t("common.saving") : t("banner.addTitle")}
        </button>
      </form>
    </PageShell>
  );
}
