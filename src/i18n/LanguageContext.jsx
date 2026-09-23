import { useCallback, useEffect, useMemo, useState } from "react";
import { dictionary, LANGUAGES } from "./dictionary";
import { LanguageContext } from "./useLanguage";

const STORAGE_KEY = "nh-dashboard-language";
const DEFAULT_LANGUAGE = "bn";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const readStoredLanguage = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && dictionary[saved] ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // The choice will not persist, but the dashboard still switches.
    }
  }, [language]);

  const setLanguage = useCallback((next) => {
    if (dictionary[next]) setLanguageState(next);
  }, []);

  /** Looks up `key`, substituting `{placeholders}` from `values`. */
  const t = useCallback(
    (key, values) => {
      const template = dictionary[language]?.[key] ?? dictionary.en[key] ?? key;
      if (!values) return template;
      return template.replace(/\{(\w+)\}/g, (match, name) =>
        values[name] === undefined ? match : String(values[name])
      );
    },
    [language]
  );

  const formatNumber = useCallback(
    (value) => {
      const text = Number(value || 0).toLocaleString("en-US");
      return language === "bn" ? text.replace(/\d/g, (digit) => BN_DIGITS[Number(digit)]) : text;
    },
    [language]
  );

  const formatPrice = useCallback((value) => `৳${formatNumber(value)}`, [formatNumber]);

  const formatDate = useCallback(
    (value) => {
      if (!value) return "";
      return new Date(value).toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    [language]
  );

  /** Picks the Bangla field when the reader uses Bangla and one exists. */
  const pick = useCallback(
    (enValue, bnValue) => (language === "bn" && String(bnValue || "").trim() ? bnValue : enValue),
    [language]
  );

  /** The server's own message, in whichever language is active. */
  const apiMessage = useCallback(
    (error, fallbackKey = "common.retry") => {
      const payload = error?.response?.data;
      if (!payload) return error?.message || t(fallbackKey);
      return (language === "bn" ? payload.messageBn : payload.message) || payload.message || t(fallbackKey);
    },
    [language, t]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, formatNumber, formatPrice, formatDate, pick, apiMessage, languages: LANGUAGES }),
    [language, setLanguage, t, formatNumber, formatPrice, formatDate, pick, apiMessage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
