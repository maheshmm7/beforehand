/**
 * The headers the API and the static host must both send. They are declared
 * once here because the two are configured in different files — Helmet for
 * the API, `vercel.json` for everything else — and a header that is set in
 * one place and forgotten in the other is the usual way a policy rots. A test
 * asserts both sides against this list.
 */
export const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'camera=()',
  'display-capture=()',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'payment=()',
  'usb=()',
].join(', ');

export const HSTS_MAX_AGE_SECONDS = 31_536_000;

/** Every header that carries a security decision, and the value both sides
 *  must agree on. The content security policy is compared separately, as a
 *  set of directives rather than a string. */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'strict-transport-security': `max-age=${String(HSTS_MAX_AGE_SECONDS)}; includeSubDomains`,
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'x-frame-options': 'DENY',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'x-permitted-cross-domain-policies': 'none',
  'permissions-policy': PERMISSIONS_POLICY,
};
