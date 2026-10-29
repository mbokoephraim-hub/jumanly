import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { ADMIN_SHELL_ROLES } from "@/server/auth/roles";
import { db } from "@/server/db";
import { bootstrapAdminIfListed } from "@/server/services/admin-bootstrap";
import { PHONE_AGENT } from "@/lib/view";

/**
 * Quick check before the signed-in space: without a session cookie, go to sign-in and come back
 * afterwards (`suite`). The real session check is done by each page on the server.
 * Jumanly Admin answers a true 404 to anyone without an admin role (administrator, support, content
 * editor), so it is not revealed. An address named in ADMIN_BOOTSTRAP_EMAIL that is already
 * signed in becomes administrator here, without having to sign out and in again.
 * On a phone, the space itself (`/app`) opens on « Bienvenue » for a signed-out person (Modèle B).
 */
export async function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const agent = request.headers.get("user-agent") ?? "";
    if (request.nextUrl.pathname === "/app" && PHONE_AGENT.test(agent)) {
      return NextResponse.redirect(new URL("/decouvrir", request.url));
    }
    const url = new URL("/connexion", request.url);
    url.searchParams.set("suite", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user as
      { id: string; email: string; emailVerified: boolean; platformRole?: string } | undefined;
    let role = user?.platformRole ?? "";
    if (user && (await bootstrapAdminIfListed(db, { ...user, platformRole: role }))) {
      role = "platform_admin";
    }
    if (!(ADMIN_SHELL_ROLES as readonly string[]).includes(role)) {
      return NextResponse.rewrite(new URL("/introuvable", request.url), { status: 404 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*", "/admin/:path*"] };
