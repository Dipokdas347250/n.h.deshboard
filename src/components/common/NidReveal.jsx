import { useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../i18n/useLanguage";

/**
 * The NID as "••••••7890", with a button that fetches the full number from
 * `revealUrl`. Each reveal is recorded in the audit log by the API.
 */
export default function NidReveal({ masked, revealUrl }) {
  const { t, apiMessage } = useLanguage();
  const [full, setFull] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const reveal = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await api.get(revealUrl);
      setFull(response.data.data.nidNumber);
    } catch (caught) {
      setError(apiMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="font-mono">{full || masked || "—"}</span>
      {full ? (
        <button type="button" onClick={() => setFull("")} className="text-xs text-white/60 underline">
          {t("nid.hide")}
        </button>
      ) : (
        masked && (
          <button type="button" disabled={busy} onClick={reveal} className="text-xs text-sky-200 underline disabled:opacity-50" title={t("nid.revealHint")}>
            {t("nid.reveal")}
          </button>
        )
      )}
      {error && <span className="text-xs text-red-200">{error}</span>}
    </span>
  );
}
