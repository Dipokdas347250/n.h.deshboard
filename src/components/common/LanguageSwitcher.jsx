import { useLanguage } from "../../i18n/useLanguage";

/** Two-way language toggle for the dashboard chrome. */
export default function LanguageSwitcher({ className = "" }) {
  const { language, setLanguage, languages, t } = useLanguage();

  return (
    <div role="group" aria-label={t("common.language")} className={`flex items-center gap-1 rounded-full bg-white/15 p-1 ${className}`}>
      {languages.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => setLanguage(item.code)}
          aria-pressed={language === item.code}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
            language === item.code ? "bg-white text-[#062B63]" : "text-white/80 hover:bg-white/20"
          }`}
        >
          {item.short}
        </button>
      ))}
    </div>
  );
}
