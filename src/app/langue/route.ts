import { NextResponse, type NextRequest } from "next/server";
import { isSiteLocale } from "@/i18n/site-locale";
import { LOCALE_COOKIE } from "@/i18n/site-routes";

/** The page the visitor was reading, when it belongs to this site. */
function previousPage(request: NextRequest): string | null {
  try {
    const referer = new URL(request.headers.get("referer") ?? "");
    return referer.origin === request.nextUrl.origin ? referer.pathname + referer.search : null;
  } catch {
    return null;
  }
}

/**
 * Language switch of the public site (`/langue?vers=en`, optional `suite=/tarifs`): keeps the
 * choice for a year and goes back to the same page, now served in that language. Works without
 * JavaScript. `/en/tarifs` and `/fr/tarifs` lead here too, so a link can carry its language.
 */
export function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("vers");
  const next = request.nextUrl.searchParams.get("suite") ?? previousPage(request) ?? "/";
  // Only a page of this site, never another address (`//ailleurs.example`).
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const response = NextResponse.redirect(new URL(target, request.url), 303);
  if (isSiteLocale(locale)) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  response.headers.set("Cache-Control", "no-store");
  return response;
}
