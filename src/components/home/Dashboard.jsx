import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { api, getErrorMessage } from "../../lib/api";

const money = (value) => `BDT ${Number(value || 0).toLocaleString()}`;

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/dashboard")
      .then((response) => setDashboard(response.data.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <div className="min-h-screen bg-[#064e3b]/90 p-6 text-red-200">Unable to load dashboard: {error}</div>;
  if (!dashboard) return <div className="min-h-screen bg-[#064e3b]/90 p-6 text-white">Loading dashboard...</div>;

  const { metrics, revenueTrend, recentOrders, topSelling = [] } = dashboard;
  const cards = [["Revenue", money(metrics.revenue)], ["Orders", metrics.orders], ["Users", metrics.users], ["Growth", `${metrics.growth >= 0 ? "+" : ""}${metrics.growth}%`]];

  return <div className="min-h-screen bg-[#064e3b]/90 p-6 text-white">
    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">{cards.map(([title, value]) => <Card key={title} title={title} value={value} />)}</div>
    <div className="mb-8 grid gap-6 md:grid-cols-2">
      <Chart title="Revenue Trend"><LineChart data={revenueTrend}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="name" stroke="#94a3b8" /><Tooltip formatter={(value) => money(value)} /><Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} /></LineChart></Chart>
      <Chart title="Orders Overview"><BarChart data={revenueTrend}><CartesianGrid stroke="#334155" strokeDasharray="3 3" /><XAxis dataKey="name" stroke="#94a3b8" /><Tooltip /><Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} /></BarChart></Chart>
    </div>
    <div className="mb-8 rounded-2xl bg-white/5 p-6"><h2 className="mb-4 text-lg">Top Selling Products</h2><div className="space-y-3">{topSelling.map((item) => <div key={item._id} className="flex items-center justify-between border-b border-gray-800 py-3"><span>{item.title}</span><span className="text-green-300">{item.sold} sold</span></div>)}{!topSelling.length && <p className="py-8 text-center text-gray-300">No sales yet.</p>}</div></div>
    <div className="rounded-2xl bg-white/5 p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg">Recent Orders</h2><span className="text-sm text-gray-300">{metrics.uniqueVisitors} unique visitors</span></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-gray-700 text-gray-400"><th className="pb-2">Customer</th><th className="pb-2">Status</th><th className="pb-2">Amount</th></tr></thead><tbody>{recentOrders.map((order) => <tr key={order._id} className="border-b border-gray-800"><td className="py-3">{order.user?.fullname || "Guest"}</td><td className="capitalize text-green-300">{order.deliveryStatus}</td><td>{money(order.totalprice)}</td></tr>)}</tbody></table>{!recentOrders.length && <p className="py-8 text-center text-gray-300">No orders yet.</p>}</div></div>
  </div>;
}

function Chart({ title, children }) {
  return <div className="rounded-2xl bg-white/5 p-6"><h2 className="mb-4">{title}</h2><div className="h-64"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div></div>;
}

function Card({ title, value }) {
  return <div className="rounded-2xl bg-white/5 p-5 transition hover:scale-105"><h4 className="text-sm text-gray-400">{title}</h4><p className="mt-2 text-2xl font-bold">{value}</p></div>;
}
