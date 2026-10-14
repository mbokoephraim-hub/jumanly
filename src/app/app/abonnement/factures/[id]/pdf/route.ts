import { NextResponse } from "next/server";
import { ADMIN_ROLES } from "@/server/auth/roles";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import type { Subject } from "@/server/entitlements";
import { renderInvoicePdf } from "@/server/pdf/invoice-document";
import { invoiceLabels } from "@/server/pdf/invoice-labels";
import { ownedOrganization } from "@/server/services/accounts";
import { invoiceFor } from "@/server/services/invoices";

/**
 * An invoice as a PDF: for the user it bills, the owner of the organization it bills, or an
 * administrator (« Voir la facture » in /admin/abonnements).
 */
export async function GET(
  _: Request,
  { params }: RouteContext<"/app/abonnement/factures/[id]/pdf">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const isAdmin =
    (ADMIN_ROLES as readonly string[]).includes(user.platformRole) &&
    (user.platformRole !== "platform_admin" || user.twoFactorEnabled);
  const org = await ownedOrganization(db, user.id);
  const subjects: Subject[] = [{ type: "user", id: user.id }];
  if (org) subjects.push({ type: "organization", id: org.id });
  const invoice = isAdmin
    ? await db.invoice.findUnique({ where: { id }, include: { payment: true } })
    : await invoiceFor(db, id, subjects);
  if (!invoice) return new NextResponse(null, { status: 404 });
  const pdf = await renderInvoicePdf(await invoiceLabels(invoice));
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="facture-${invoice.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
