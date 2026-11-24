/**
 * Support contacts, from the CONTACT_MAIL and CONTACT_NUMBER env vars.
 * next.config.ts inlines them at build time, so changing them needs a
 * rebuild (or a dev server restart).
 */
export const CONTACT_MAIL = process.env.CONTACT_MAIL?.trim() || null;

/** Digits only, with the country code (e.g. 5511912345678). */
export const CONTACT_NUMBER =
  process.env.CONTACT_NUMBER?.replace(/\D/g, "") || null;

const HELP_MESSAGE = "Olá! Preciso de ajuda com o MATIAS.";

export function mailtoUrl(mail: string) {
  return `mailto:${mail}?subject=${encodeURIComponent("Ajuda com o MATIAS")}`;
}

export function whatsappUrl(number: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(HELP_MESSAGE)}`;
}

/** 5511912345678 → "+55 (11) 91234-5678"; other formats stay as digits. */
export function formatPhone(number: string) {
  const br = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(number);
  if (br) return `+55 (${br[1]}) ${br[2]}-${br[3]}`;
  return `+${number}`;
}
