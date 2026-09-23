import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, SuccessNote, EmptyNote, Field, inputClass } from "../common/PageShell";

const EMPTY = { title: "", titleBn: "", description: "", descriptionBn: "" };

export default function VideoManager() {
  const { t, apiMessage, pick } = useLanguage();
  const [videos, setVideos] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get("/video/admin/all-video")
      .then((response) => setVideos(response.data.data || []))
      .catch((caught) => {
        setVideos([]);
        setError(apiMessage(caught));
      });

  useEffect(() => {
    load();
    // `load` only closes over stable helpers, so running once on mount is right.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const upload = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    const data = new FormData();
    data.append("video", file);
    Object.entries(form).forEach(([key, value]) => data.append(key, value));

    try {
      await api.post("/video/add-video", data);
      setForm(EMPTY);
      setFile(null);
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

        <Field label={t("video.file")} htmlFor="video-file">
          <input
            id="video-file"
            required
            type="file"
            accept="video/*"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="w-full cursor-pointer rounded-lg bg-white/15 p-2 text-white file:mr-3 file:rounded-md file:border-none file:bg-green-500 file:px-4 file:py-2 file:text-white"
          />
        </Field>

        <button disabled={busy} className="w-full rounded-lg bg-green-500 py-3 font-semibold text-white transition hover:bg-green-400 disabled:opacity-50">
          {busy ? t("video.uploading") : t("video.add")}
        </button>
      </form>

      {videos === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : videos.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <article key={video._id} className="overflow-hidden rounded-xl bg-white/10 shadow-lg">
              <video src={video.video} controls preload="metadata" className="aspect-video w-full bg-black object-cover" />
              <div className="p-4">
                <h3 className="font-semibold">{pick(video.title, video.titleBn)}</h3>
                {(video.description || video.descriptionBn) && (
                  <p className="mt-1 line-clamp-2 text-sm text-white/60">{pick(video.description, video.descriptionBn)}</p>
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
