"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  formatCurrency,
  isLocale,
  LANGUAGE_OPTIONS,
  LOCALE_TAGS,
  localizeDomainValue,
  translate,
  type Locale,
} from "../lib/i18n";

const STORAGE_KEY = "veylora.locale";

type I18nContextValue = {
  locale: Locale;
  localeTag: string;
  setLocale: (locale: Locale) => void;
  t: (source: string, variables?: Record<string, string | number>) => string;
  domain: (value: string) => string;
  money: (minorUnits: number, currency?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!isLocale(saved)) return;
    const restore = window.setTimeout(() => setLocale(saved), 0);
    return () => window.clearTimeout(restore);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (source: string, variables: Record<string, string | number> = {}) => translate(locale, source, variables),
    [locale],
  );
  const domain = useCallback((value: string) => localizeDomainValue(locale, value), [locale]);
  const money = useCallback((minorUnits: number, currency = "RON") => formatCurrency(minorUnits, locale, currency), [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    localeTag: LOCALE_TAGS[locale],
    setLocale,
    t,
    domain,
    money,
  }), [domain, locale, money, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="language-selector">
      <span className="sr-only">{t("Language")}</span>
      <span aria-hidden="true">◎</span>
      <select
        aria-label={t("Language")}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
