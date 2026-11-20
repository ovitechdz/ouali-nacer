/** Contact-link URI builders used by the team page (S-07). */

const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

/** Validate an address and encode its local part; invalid input gets no link. */
export function mailtoHref(email: string): string | null {
  const value = email.trim();
  if (!EMAIL_PATTERN.test(value)) return null;
  const at = value.lastIndexOf('@');
  return `mailto:${encodeURIComponent(value.slice(0, at))}@${value.slice(at + 1)}`;
}

/** Digits plus one optional leading +; encodeURIComponent would turn + into %2B. */
export function telHref(phone: string): string | null {
  const value = phone.trim();
  const digits = value.replace(/\D/g, '');
  if (digits === '') return null;
  return `tel:${value.startsWith('+') ? '+' : ''}${digits}`;
}

/** The archived deep links stay scheme-less in the data and gain https:// here. */
export function whatsappHref(link: string): string {
  return `https://${link}`;
}
