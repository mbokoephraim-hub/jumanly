import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { renderInvoicePdf } from "@/server/pdf/invoice-document";
import { invoiceLabels } from "@/server/pdf/invoice-labels";
import { getActiveSpace } from "@/server/hire-context";
import { orgInvoice } from "@/server/services/org-billing";
import { HireError } from "@/server/services/hire";

/**
 * An invoice of the organization as a PDF (« Factures » of Formule et facturation, étape 3, A4):
 * for its owner and its administrators, in the organization of their active space only.
 */
export async function GET(
  _: Request,
  { params }: RouteContext<"/app/organisation/facturation/factures/[id]/pdf">,
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const space = await getActiveSpace(user.id);
  if (!space) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const ctx = { userId: user.id, organizationId: space.organizationId, role: space.role };
  const invoice = await orgInvoice(db, ctx, id.slice(0, 60)).catch((error: unknown) => {
    if (error instanceof HireError) return null;
    throw error;
  });
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
