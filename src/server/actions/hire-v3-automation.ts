"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import {
  AUTOMATION_KEYS,
  setMorningDigest,
  setRule,
  type AutomationRuleKey,
} from "@/server/services/hire-v3-automation";

const PAGE = "/app/hire/suivi";

const input = z.object({
  key: z.string().max(40),
  on: z.enum(["0", "1"]),
});

/** A switch of « Suivi automatique »: validate → session → role → service (which checks again). */
export async function toggleAutomationAction(formData: FormData) {
  const parsed = input.safeParse({ key: formData.get("key"), on: formData.get("on") });
  if (!parsed.success) redirect(`${PAGE}?erreur=invalid`);
  const on = parsed.data.on === "1";
  if (parsed.data.key === "morningDigest") {
    const { ctx } = await requireHire(PAGE);
    await setMorningDigest(db, ctx.userId, on);
    refresh();
    redirect(`${PAGE}?ok=${on ? "on" : "off"}`);
  }
  if (!AUTOMATION_KEYS.includes(parsed.data.key as AutomationRuleKey))
    redirect(`${PAGE}?erreur=invalid`);
  const { ctx } = await requireHire(PAGE, "manage");
  try {
    await setRule(db, ctx, parsed.data.key as AutomationRuleKey, on);
  } catch (error) {
    if (error instanceof HireError) redirect(`${PAGE}?erreur=${error.code}`);
    throw error;
  }
  refresh();
  redirect(`${PAGE}?ok=${on ? "on" : "off"}`);
}
