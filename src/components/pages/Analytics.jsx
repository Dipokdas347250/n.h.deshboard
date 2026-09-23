import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";
import { PageShell, ErrorNote, EmptyNote } from "../common/PageShell";

export default function Analytics() {
  const { t, apiMessage, formatNumber } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api.get("/admin/analytics")
      .then((response) => {
        if (active) setData(response.data.data || { visits: 0, uniqueVisitors: 0, topPaths: [] });
      })
      .catch((caught) => {
        if (!active) return;
        setData({ visits: 0, uniqueVisitors: 0, topPaths: [] });
        setError(apiMessage(caught));
      });

    return () => {
      active = false;
    };
  }, [apiMessage]);

  return (
    <PageShell title={t("analytics.title")}>
      <ErrorNote message={error} />

      {data === null ? (
        <p className="text-white/70">{t("common.loading")}</p>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white/10 p-5">
              <h2 className="text-sm text-white/60">{t("analytics.visits")}</h2>
              <p className="mt-2 text-3xl font-bold">{formatNumber(data.visits)}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-5">
              <h2 className="text-sm text-white/60">{t("analytics.uniqueVisitors")}</h2>
              <p className="mt-2 text-3xl font-bold">{formatNumber(data.uniqueVisitors)}</p>
            </div>
          </div>

          <div className="rounded-xl bg-white/10 p-5">
            <h2 className="mb-4 text-lg font-semibold">{t("analytics.topPages")}</h2>
            {data.topPaths?.length ? (
              data.topPaths.map((item) => (
                <div key={item.path} className="flex flex-wrap justify-between gap-2 border-b border-white/10 py-3 last:border-0">
                  <span className="font-mono text-sm">{item.path}</span>
                  <span className="text-sm text-white/70">
                    {t("analytics.visitorsVisits", { visitors: formatNumber(item.visitors), visits: formatNumber(item.visits) })}
                  </span>
                </div>
              ))
            ) : (
              <EmptyNote message={t("common.none")} />
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
