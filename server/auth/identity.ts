// Contact details for identities (ADR 0007): phone numbers in E.164, emails
// lowercased, and the placeholder email Better Auth needs for phone-only
// identities.

const E164 = /^\+[1-9]\d{7,14}$/;
const PLACEHOLDER_DOMAIN = "@phone.invalid";

// Accepts what staff actually type for Somali numbers ("061 234 5678",
// "252612345678", "+252 61-234-5678") and international numbers with a
// leading "+". Returns null for anything that isn't a phone number.
export function normalizePhone(input: string): string | null {
  const compact = input.replace(/[\s\-().]/g, "");
  let phone: string;
  if (compact.startsWith("+")) phone = compact;
  else if (compact.startsWith("00")) phone = `+${compact.slice(2)}`;
  else if (compact.startsWith("252")) phone = `+${compact}`;
  else if (compact.startsWith("0")) phone = `+252${compact.slice(1)}`;
  else return null;
  return E164.test(phone) ? phone : null;
}

export function isE164(phone: string): boolean {
  return E164.test(phone);
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

// The .invalid TLD is reserved (RFC 2606), so this address can never receive mail.
export function placeholderEmail(phone: string): string {
  return `${phone.slice(1)}${PLACEHOLDER_DOMAIN}`;
}

export function isPlaceholderEmail(email: string): boolean {
  return email.endsWith(PLACEHOLDER_DOMAIN);
}

export function phoneFromPlaceholderEmail(email: string): string | null {
  if (!isPlaceholderEmail(email)) return null;
  const phone = `+${email.slice(0, -PLACEHOLDER_DOMAIN.length)}`;
  return isE164(phone) ? phone : null;
}
