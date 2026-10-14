import { describe, expect, it } from "vitest";
import {
  contentSecurityPolicy,
  MICROPHONE_ROUTE,
  permissionsPolicy,
  securityHeaders,
} from "@/lib/security-headers";

const header = (rules: ReturnType<typeof securityHeaders>, source: string, key: string) =>
  rules.find((rule) => rule.source === source)?.headers.find((item) => item.key === key)?.value;

describe("security headers (partie 10 § 10.5)", () => {
  it("blocks framing, plugins and foreign scripts", () => {
    const csp = contentSecurityPolicy({ production: true });
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toMatch(/script-src 'self' 'unsafe-inline'(;|$)/);
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("keeps development usable over http", () => {
    const csp = contentSecurityPolicy({ production: false });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("sends HSTS only in production", () => {
    expect(
      header(securityHeaders({ production: true }), "/:path*", "Strict-Transport-Security"),
    ).toBeTruthy();
    expect(
      header(securityHeaders({ production: false }), "/:path*", "Strict-Transport-Security"),
    ).toBeUndefined();
  });

  it("allows the microphone only on the voice simulation page", () => {
    const rules = securityHeaders({ production: true });
    expect(header(rules, "/:path*", "Permissions-Policy")).toContain("microphone=()");
    expect(header(rules, MICROPHONE_ROUTE, "Permissions-Policy")).toContain("microphone=(self)");
    // The page rule comes last, so it wins over the general one.
    expect(rules.at(-1)?.source).toBe(MICROPHONE_ROUTE);
    expect(permissionsPolicy({ microphone: false })).toContain("camera=()");
  });
});
