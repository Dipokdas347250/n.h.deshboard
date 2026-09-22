import React, { useEffect, useState } from "react";
import { FaPlay, FaTrash, FaUpload } from "react-icons/fa";
import { api, getErrorMessage } from "../../lib/api";

const VideoManager = () => {
  const [videos, setVideos] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await api.get("/video/admin/all-video");
      setVideos(response.data.data || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return setError("Choose a video before uploading.");

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title);
    formData.append("description", description);

    try {
      setSubmitting(true);
      setError("");
      await api.post("/video/add-video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setTitle("");
      setDescription("");
      setMessage("Video uploaded successfully.");
      await loadVideos();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const updateVideo = async (video, updates) => {
    try {
      const response = await api.patch(`/video/update-video/${video._id}`, updates);
      setVideos((current) => current.map((item) => item._id === video._id ? response.data.data : item));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const deleteVideo = async (id) => {
    if (!window.confirm("Delete this video?")) return;
    try {
      await api.delete(`/video/delete-video/${id}`);
      setVideos((current) => current.filter((video) => video._id !== id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <main className="min-h-screen bg-[#062B63]/95 p-4 text-white sm:p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-200">Content studio</p>
          <h1 className="mt-2 text-3xl font-bold">Video library</h1>
          <p className="mt-2 text-emerald-100">Upload product stories and control what appears above the store footer.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-5 text-gray-900 shadow-xl sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 p-3 text-emerald-700"><FaUpload /></span>
            <div><h2 className="text-xl font-bold">Add a video</h2><p className="text-sm text-gray-500">MP4, WebM, or another supported video format up to 100 MB.</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Video title" className="rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-emerald-500" />
            <input type="file" accept="video/*" onChange={(event) => setFile(event.target.files?.[0] || null)} required className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm" />
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description (optional)" rows="3" className="rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-emerald-500 md:col-span-2" />
          </div>
          <button disabled={submitting} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
            <FaUpload /> {submitting ? "Uploading..." : "Upload video"}
          </button>
          {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </form>

        <section>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-bold">All videos</h2><span className="rounded-full bg-white/15 px-3 py-1 text-sm">{videos.length} total</span></div>
          {loading ? <p className="text-emerald-100">Loading videos...</p> : videos.length === 0 ? <p className="rounded-xl bg-white/10 p-6 text-emerald-100">No videos uploaded yet.</p> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => (
              <article key={video._id} className="overflow-hidden rounded-xl bg-white text-gray-900 shadow-lg">
                <video src={video.video} controls preload="metadata" className="aspect-video w-full bg-black object-cover" />
                <div className="p-4">
                  <input value={video.title} onChange={(event) => setVideos((current) => current.map((item) => item._id === video._id ? { ...item, title: event.target.value } : item))} onBlur={(event) => updateVideo(video, { title: event.target.value })} className="w-full border-b border-gray-200 pb-2 text-lg font-bold outline-none focus:border-emerald-500" />
                  <textarea value={video.description || ""} onChange={(event) => setVideos((current) => current.map((item) => item._id === video._id ? { ...item, description: event.target.value } : item))} onBlur={(event) => updateVideo(video, { description: event.target.value })} rows="2" placeholder="Description" className="mt-3 w-full resize-none text-sm text-gray-600 outline-none" />
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button onClick={() => updateVideo(video, { isPublished: !video.isPublished })} className={`rounded-full px-3 py-1 text-xs font-bold ${video.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}><FaPlay className="mr-1 inline" />{video.isPublished ? "Published" : "Hidden"}</button>
                    <button onClick={() => deleteVideo(video._id)} className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"><FaTrash /> Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>}
        </section>
      </div>
    </main>
  );
};

export default VideoManager;
