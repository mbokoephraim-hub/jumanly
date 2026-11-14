"use server";

import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { hireOrbiPanel, type HireOrbiPanel } from "@/server/services/hire-v3-orbi";

/**
 * The facts of Orbi's panel (recruiter's web app v3), read when the panel opens. Order of
 * CLAUDE.md: session → organization (`requireHire`) → service. No credit: these are the
 * organization's own figures; the questions go through `askOrbiAction` (consent, rights, credits).
 */
export async function hireOrbiPanelAction(): Promise<HireOrbiPanel> {
  const { ctx } = await requireHire("/app/hire");
  return hireOrbiPanel(db, ctx);
}
