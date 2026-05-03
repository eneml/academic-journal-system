import en from "./en.json" with { type: "json" };
import ro from "./ro.json" with { type: "json" };

export const locales = ["en", "ro"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type Messages = typeof en;

export const messages: Record<Locale, Messages> = {
  en,
  ro: ro as Messages,
};

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
