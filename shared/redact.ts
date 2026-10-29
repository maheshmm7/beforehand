/**
 * Strips the personal details that tend to ride along in a pasted message
 * before it is sent anywhere. Applied in the browser and again on the server,
 * because the browser's copy can be bypassed.
 */

// Order matters: the longest and most specific shapes go first, so a card
// number is never half-eaten by the phone rule.
const RULES: readonly { readonly re: RegExp; readonly with: string }[] = [
  { re: /\bhttps?:\/\/\S+/gi, with: '[link]' },
  { re: /[\w.+-]+@[\w-]+\.[\w.-]+/g, with: '[email]' },
  { re: /\b[\w.-]{2,}@(?:ok\w+|paytm|ybl|upi|axl|apl)\b/gi, with: '[upi]' },
  { re: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}(?:[-\s]?\d{4})?\b/g, with: '[number]' },
  { re: /(?:\+?91[-\s]?)?\b[6-9]\d{9}\b/g, with: '[phone]' },
  { re: /\b[A-Z]{5}\d{4}[A-Z]\b/g, with: '[id]' },
];

export function redact(text: string): string {
  return RULES.reduce((carried, rule) => carried.replace(rule.re, rule.with), text);
}

/** True when redaction would change the text, so the UI can say it did. */
export function hasPersonalDetail(text: string): boolean {
  return redact(text) !== text;
}
