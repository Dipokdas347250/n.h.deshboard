import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../lib/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { api.get("/auth/alluser").then((response) => setCustomers(response.data.data || [])).catch((err) => setError(getErrorMessage(err))); }, []);
  return <section className="min-h-screen bg-[#064e3b]/90 p-6 text-white"><h1 className="mb-6 text-2xl font-bold">Customers</h1>{error && <p className="mb-4 rounded bg-red-500/20 p-3 text-red-200">{error}</p>}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{customers.map((customer) => <div key={customer._id} className="rounded-xl bg-white/10 p-5"><h2 className="font-semibold">{customer.fullname}</h2><p className="mt-2 text-sm text-gray-300">{customer.email}</p><p className="mt-1 text-xs uppercase text-green-300">{customer.role}</p></div>)}</div></section>;
}
