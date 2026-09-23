import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, EmptyNote } from "../common/PageShell";

export default function Customers() {
  const { t, apiMessage, formatDate } = useLanguage();
  const [customers, setCustomers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api.get("/auth/alluser")
      .then((response) => {
        if (active) setCustomers(response.data.data || []);
      })
      .catch((caught) => {
        if (!active) return;
        setCustomers([]);
        setError(apiMessage(caught));
      });

    return () => {
      active = false;
    };
  }, [apiMessage]);

  return (
    <PageShell title={t("customers.title")}>
      <ErrorNote message={error} />

      {customers === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : customers.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => (
            <article key={customer._id} className="rounded-xl bg-white/10 p-5">
              <h2 className="font-semibold">{customer.fullname}</h2>
              <p className="mt-2 text-sm text-white/70">{customer.email}</p>
              {customer.phone && <p className="text-sm text-white/70">{customer.phone}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs uppercase text-emerald-300">{customer.role}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs ${customer.verified ? "bg-green-400/20 text-green-200" : "bg-amber-400/20 text-amber-200"}`}>
                  {customer.verified ? t("customers.verified") : t("customers.unverified")}
                </span>
              </div>
              <p className="mt-3 text-xs text-white/50">
                {t("customers.joined")}: {formatDate(customer.createdAt)}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyNote message={t("customers.none")} />
      )}
    </PageShell>
  );
}
