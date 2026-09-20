import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../lib/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try { setOrders((await api.get("/checkout/all-orders")).data.data || []); }
    catch (err) { setError(getErrorMessage(err)); }
  };
  useEffect(() => {
    api.get("/checkout/all-orders")
      .then((response) => setOrders(response.data.data || []))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const update = async (id, deliveryStatus) => {
    try { await api.patch(`/admin/orders/${id}`, { deliveryStatus }); await load(); }
    catch (err) { setError(getErrorMessage(err)); }
  };

  return <section className="min-h-screen bg-[#064e3b]/90 p-6 text-white"><h1 className="mb-6 text-2xl font-bold">Orders</h1>{error && <p className="mb-4 rounded bg-red-500/20 p-3 text-red-200">{error}</p>}<div className="overflow-x-auto rounded-xl bg-white/10"><table className="w-full text-left"><thead><tr className="border-b border-white/20 text-gray-300"><th className="p-4">Customer</th><th className="p-4">Amount</th><th className="p-4">Payment</th><th className="p-4">Delivery</th><th className="p-4">Action</th></tr></thead><tbody>{orders.map((order) => <tr key={order._id} className="border-b border-white/10"><td className="p-4">{order.user?.fullname || "Guest"}<span className="block text-xs text-gray-400">{order.user?.email}</span></td><td className="p-4">৳{(order.totalprice || 0).toLocaleString()}</td><td className="p-4">{order.paymentStatus}</td><td className="p-4">{order.deliveryStatus}</td><td className="p-4"><select value={order.deliveryStatus} onChange={(event) => update(order._id, event.target.value)} className="rounded bg-white/10 p-2"><option value="pending">Pending</option><option value="confirm">Confirmed</option><option value="deliverd">Delivered</option><option value="cenceled">Cancelled</option></select></td></tr>)}</tbody></table>{!orders.length && <p className="p-8 text-center text-gray-300">No orders found.</p>}</div></section>;
}
