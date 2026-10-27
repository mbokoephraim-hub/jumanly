/**
 * Security headers (partie 10 § 10.5), applied to every response by `next.config.ts`.
 *
 * The content policy allows inline scripts: Next.js writes its page data in inline scripts, and a
 * per-request nonce would force every public page to be rendered on each request (no static pages,
 * slower on a slow network). Scripts, frames and connections are still limited to Jumanly itself
 * and the few services it uses (video CDN, error reporting). See docs/decisions/2026-10-14-e11.
 */
type Header = { key: string; value: string };

export function contentSecurityPolicy({ production }: { production: boolean }) {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'unsafe-eval' only in development: React uses it to rebuild error stacks.
    "script-src": ["'self'", "'unsafe-inline'", ...(production ? [] : ["'unsafe-eval'"])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    // Adaptive video (Bunny Stream CDN) and error reports (Sentry).
    "media-src": ["'self'", "blob:", "https://*.b-cdn.net"],
    "connect-src": ["'self'", "https://*.b-cdn.net", "https://*.sentry.io"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    // YouTube lessons, embedded with the privacy-enhanced player.
    "frame-src": ["https://www.youtube-nocookie.com"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    // Sign-in with a provider continues on its page (Google, Apple, LinkedIn).
    "form-action": [
      "'self'",
      "https://accounts.google.com",
      "https://appleid.apple.com",
      "https://www.linkedin.com",
    ],
    "frame-ancestors": ["'none'"],
  };
  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (production) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

/**
 * Microphone and camera off on the public pages; in the signed-in space, allowed to the site itself
 * (the browser still asks the person): the spoken interview simulation, the voice notes and the
 * photos of Messages. The space moves from page to page without reloading, so the policy of the
 * first page loaded stays: it is set for the whole space. No location or payment API.
 */
export function permissionsPolicy({ media }: { media: boolean }) {
  return [
    `camera=(${media ? "self" : ""})`,
    `microphone=(${media ? "self" : ""})`,
    "geolocation=()",
    "payment=()",
    "usb=()",
  ].join(", ");
}

/** The signed-in space: the only one allowed to use the microphone and the camera. */
export const MEDIA_ROUTE = "/app/:path*";

export function securityHeaders({ production }: { production: boolean }): {
  source: string;
  headers: Header[];
}[] {
  const common: Header[] = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy({ production }) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Permissions-Policy", value: permissionsPolicy({ media: false }) },
    ...(production
      ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
      : []),
  ];
  return [
    { source: "/:path*", headers: common },
    // Listed last: for the same header, the last matching rule wins.
    {
      source: MEDIA_ROUTE,
      headers: [{ key: "Permissions-Policy", value: permissionsPolicy({ media: true }) }],
    },
  ];
}
