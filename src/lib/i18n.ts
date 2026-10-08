// Locale boundaries for future translated routes. English is the only public
// locale until the full catalog, policies, and checkout have approved translations.
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};
export const dictionaries = {
  en: {
    shop: "Shop",
    bag: "Bag",
    checkout: "Checkout",
    addToBag: "Add to bag",
    search: "Search",
    keepMashy: "KEEP MASHY.",
  },
  ar: {
    shop: "تسوق",
    bag: "الحقيبة",
    checkout: "إتمام الطلب",
    addToBag: "أضف إلى الحقيبة",
    search: "بحث",
    keepMashy: "خليك ماشي.",
  },
};
export function localeConfig(locale: Locale) {
  return {
    lang: locale,
    dir: localeDirection[locale],
    messages: dictionaries[locale],
  };
}
