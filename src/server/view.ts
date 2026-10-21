import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { PHONE_AGENT, VIEW_COOKIE, type View } from "@/lib/view";

/**
 * Which talent interface a request gets (Modèle B, docs/modele-b § 0): the phone one (dark, five
 * tabs) or the computer and tablet one (docs/refonte-web). A phone always gets the phone one, even
 * turned sideways; another browser narrower than 768 px gets it too, once `ViewSync` has measured
 * its width (cookie).
 */
export const currentView = cache(async (): Promise<View> => {
  const agent = (await headers()).get("user-agent") ?? "";
  if (PHONE_AGENT.test(agent)) return "phone";
  const kept = (await cookies()).get(VIEW_COOKIE)?.value;
  return kept === "phone" ? "phone" : "wide";
});

export async function isPhone() {
  return (await currentView()) === "phone";
}
