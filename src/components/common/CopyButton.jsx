import { useState } from "react";
import { useLanguage } from "../../i18n/useLanguage";

/** Copies `text` to the clipboard and says so for a moment. */
export default function CopyButton({ text, className = "" }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // No clipboard access (old browser or insecure page): the text is still selectable.
    }
  };

  return (
    <button type="button" onClick={copy} className={`shrink-0 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25 ${className}`}>
      {copied ? t("common.copied") : t("common.copy")}
    </button>
  );
}
