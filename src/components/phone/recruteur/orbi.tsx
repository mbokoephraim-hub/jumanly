import "server-only";
import { getTranslations } from "next-intl/server";
import { db } from "@/server/db";
import type { HireContext } from "@/server/services/hire";
import { organizationCreditsLeft, recruiterOrbiActions } from "@/server/services/recruiter-orbi";
import { RhOrbiPage } from "./orbi-page";

/** Orbi's page for the recruiter on the phone (planche 184). */
export async function RhOrbi({ ctx, question }: { ctx: HireContext; question?: string }) {
  const t = await getTranslations("phoneRhOrbi");
  const tc = await getTranslations("rhOrbi.chat");
  const to = await getTranslations("talentOrbi");
  const tr = await getTranslations("phoneRh.orbi");
  const credits = await organizationCreditsLeft(db, ctx.organizationId);
  return (
    <RhOrbiPage
      question={question}
      hrefs={recruiterOrbiActions}
      texts={{
        back: t("back"),
        title: t("title"),
        line: credits === null ? t("lineNoCredits") : t("line", { count: credits }),
        clear: t("clear"),
        clearLabel: t("clearLabel"),
        hello: t("hello"),
        alsoAsk: t("alsoAsk"),
        input: t("input"),
        placeholder: t("placeholder"),
        send: t("send"),
        thinking: t("thinking"),
        failed: t("failed"),
        invalid: t("invalid"),
        decide: t("decide"),
        limits: {
          consent: to("limit.consent"),
          entitlement: tc("limit.entitlement"),
          quota: tc("limit.quota"),
          unavailable: to("limit.unavailable"),
        },
        limitLink: tr("plan"),
        actions: Object.fromEntries(
          Object.keys(recruiterOrbiActions).map((key) => [
            key,
            tc(`actions.${key}` as "actions.offers"),
          ]),
        ),
        questions: [
          { text: t("q1"), fact: "today" },
          { text: t("q2"), fact: "first" },
          { text: t("q3"), fact: "waiting" },
          { text: t("q4"), fact: "propose" },
        ],
      }}
    />
  );
}
