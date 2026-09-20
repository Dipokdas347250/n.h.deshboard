import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../lib/api";

export default function Analytics() {
  const [data, setData] = useState({ visits: 0, uniqueVisitors: 0, topPaths: [] });
  const [error, setError] = useState("");
  useEffect(() => { api.get("/admin/analytics").then((response) => setData(response.data.data || {})).catch((err) => setError(getErrorMessage(err))); }, []);
  return <section className="min-h-screen bg-[#064e3b]/90 p-6 text-white"><h1 className="mb-6 text-2xl font-bold">Analytics</h1>{error && <p className="mb-4 rounded bg-red-500/20 p-3 text-red-200">{error}</p>}<div className="mb-8 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-white/10 p-5"><p className="text-sm text-gray-300">Total visits</p><p className="mt-2 text-3xl font-bold">{data.visits}</p></div><div className="rounded-xl bg-white/10 p-5"><p className="text-sm text-gray-300">Unique visitors</p><p className="mt-2 text-3xl font-bold">{data.uniqueVisitors}</p></div></div><div className="rounded-xl bg-white/10 p-5"><h2 className="mb-4 text-lg font-semibold">Most visited pages</h2>{data.topPaths.map((item) => <div key={item.path} className="flex justify-between border-b border-white/10 py-3"><span>{item.path}</span><span>{item.visitors} visitors / {item.visits} visits</span></div>)}</div></section>;
}
