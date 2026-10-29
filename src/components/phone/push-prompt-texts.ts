import "server-only";
import { getTranslations } from "next-intl/server";
import type { PushLabels } from "./push-prompt";

/** The words of « Recevoir vos messages sur ce téléphone ». */
export async function pushLabels(): Promise<PushLabels> {
  const t = await getTranslations("pushPrompt");
  return {
    title: t("title"),
    text: t("text"),
    yes: t("yes"),
    later: t("later"),
    done: t("done"),
    blocked: t("blocked"),
    ios: t("ios"),
    failed: t("failed"),
  };
}
