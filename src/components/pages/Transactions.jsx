import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../lib/api";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { api.get("/admin/transactions").then((response) => setTransactions(response.data.data || [])).catch((err) => setError(getErrorMessage(err))); }, []);
  return <section className="min-h-screen bg-[#064e3b]/90 p-6 text-white"><h1 className="mb-6 text-2xl font-bold">Transactions</h1>{error && <p className="mb-4 rounded bg-red-500/20 p-3 text-red-200">{error}</p>}<div className="overflow-x-auto rounded-xl bg-white/10"><table className="w-full text-left"><thead><tr className="border-b border-white/20 text-gray-300"><th className="p-4">Transaction</th><th className="p-4">Customer</th><th className="p-4">Amount</th><th className="p-4">Status</th></tr></thead><tbody>{transactions.map((item) => <tr key={item._id} className="border-b border-white/10"><td className="p-4">{item.transaction_id}</td><td className="p-4">{item.user?.fullname || "Guest"}</td><td className="p-4">৳{(item.totalprice || 0).toLocaleString()}</td><td className="p-4">{item.paymentStatus}</td></tr>)}</tbody></table>{!transactions.length && <p className="p-8 text-center text-gray-300">No transactions found.</p>}</div></section>;
}
