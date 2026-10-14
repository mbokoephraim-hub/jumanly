import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { TabRailClient } from "./tab-rail-client";

/** Rail of tabs (docs/experience-animee § 7); see `TabRailClient` for the behaviour. */
export async function TabRail(props: {
  /** Identifies the rail across pages, so the active pill can slide from the previous tab. */
  name: string;
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const t = await getTranslations("common.rail");
  return <TabRailClient {...props} labels={{ previous: t("previous"), next: t("next") }} />;
}
