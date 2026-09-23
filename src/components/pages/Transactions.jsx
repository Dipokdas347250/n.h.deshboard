import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, EmptyNote } from "../common/PageShell";

export default function Transactions() {
  const { t, apiMessage, formatPrice, formatDate } = useLanguage();
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api.get("/admin/transactions")
      .then((response) => {
        if (active) setTransactions(response.data.data || []);
      })
      .catch((caught) => {
        if (!active) return;
        setTransactions([]);
        setError(apiMessage(caught));
      });

    return () => {
      active = false;
    };
  }, [apiMessage]);

  return (
    <PageShell title={t("transactions.title")}>
      <ErrorNote message={error} />

      {transactions === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : transactions.length ? (
        <div className="overflow-x-auto rounded-xl bg-white/10">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-white/20 text-sm text-white/70">
                <th className="p-4">{t("transactions.reference")}</th>
                <th className="p-4">{t("orders.orderNumber")}</th>
                <th className="p-4">{t("orders.customer")}</th>
                <th className="p-4">{t("orders.amount")}</th>
                <th className="p-4">{t("orders.payment")}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item._id} className="border-b border-white/10 last:border-0">
                  <td className="p-4 font-mono text-sm">{item.transaction_id}</td>
                  <td className="p-4 font-mono text-sm">{item.orderNumber}</td>
                  <td className="p-4">
                    <span className="block">{item.customer?.name || item.user?.fullname || t("orders.guest")}</span>
                    <span className="block text-xs text-white/50">{formatDate(item.createdAt)}</span>
                  </td>
                  <td className="p-4">{formatPrice(item.totalprice)}</td>
                  <td className="p-4">
                    <span className="block">{item.paymentMethod === "online" ? t("orders.online") : t("orders.cod")}</span>
                    <span className="block text-xs text-white/60">{t(`orders.${item.paymentStatus || "unpaid"}`)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyNote message={t("transactions.none")} />
      )}
    </PageShell>
  );
}
