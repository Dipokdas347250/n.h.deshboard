import { createContext, useContext } from "react";

/** Shared by `LanguageProvider` and the `useLanguage` hook below. */
export const LanguageContext = createContext(null);

/** Translation helpers and formatters for the active language. */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
