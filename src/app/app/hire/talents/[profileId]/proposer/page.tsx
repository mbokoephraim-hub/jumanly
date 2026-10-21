import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { avatarTone, initialsOf, ScoreRing } from "@/components/recruiter/candidates";
import { DecisionMessage } from "@/components/recruiter/candidates-client";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { pickMessages } from "@/i18n/client-messages";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import { proposeOfferAction } from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { matchesForUser } from "@/server/matching/service";
import type { MatchExplanation } from "@/server/matching/types";
import {
  decisionParagraphs,
  highlightSegments,
  strongestSkill,
  tidyText,
} from "@/server/services/message-templates";
import {
  CONTACT_COOLDOWN_DAYS,
  CONTACT_EXPIRY_DAYS,
  CONTACT_MESSAGE_MIN,
  searchQuotas,
  viewTalentProfile,
} from "@/server/services/talent-search";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireTalents.propose");
  return { title: t("title"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
const tones = ["chaleureux", "court", "formel"] as const;

/**
 * « Proposer l'offre » to a visible talent (brief recruteur § 4 item 4, planche r2plus CONTACT):
 * the offer, a message prepared from templates and read before it leaves, the announcement joined
 * or not, and the month's proposals. The talent decides; nothing is sent before « Envoyer ».
 */
export default async function ProposeOfferPage({
  params,
  searchParams,
}: PageProps<"/app/hire/talents/[profileId]/proposer">) {
  const [{ profileId }, query] = await Promise.all([params, searchParams]);
  const profilePage = `/app/hire/talents/${profileId}`;
  const page = `${profilePage}/proposer`;
  const { user, space, ctx } = await requireHire(page, "manage");
  const t = await getTranslations("hireTalents.propose");
  const ui = await getTranslations("ui");
  const now = new Date();
  const view = await viewTalentProfile(db, ctx, profileId, now);
  if (view.status === "notFound") notFound();
  if (view.status === "blocked") redirect(profilePage);
  const { profile } = view;
  // Already in touch (an application, an accepted or pending proposal): nothing to propose.
  if (view.applied || view.contact?.status === "accepted" || view.contact?.status === "pending")
    redirect(profilePage);

  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [offers, quotas, matchingLevel, messages] = await Promise.all([
    db.job.findMany({
      where: { organizationId: ctx.organizationId, status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 30,
      select: { id: true, title: true, city: true },
    }),
    searchQuotas(db, ctx.organizationId, now),
    level(db, subject, "hire.matching.level"),
    getMessages(),
  ]);
  const offer = offers.find((item) => item.id === one(query.offre)) ?? offers[0] ?? null;
  let explanation: MatchExplanation | null = null;
  if (offer && matchingLevel !== "none" && profile.matchingEnabled) {
    const match = (await matchesForUser(db, profile.userId, [offer.id], now)).get(offer.id);
    if (match?.state === "ok") explanation = match.explanation;
  }
  const strength = strongestSkill(explanation);
  const named = !view.anonymous;
  const firstName = named ? profile.user.firstName || profile.user.name.split(/\s+/)[0]! : "";
  const title = named
    ? profile.user.name
    : t("anonymous", { headline: profile.headline || t("noHeadline") });
  const tone = tones.find((value) => value === one(query.ton)) ?? "chaleureux";
  const company = space.organization.name;
  const jobTitle = offer?.title ?? t("noOfferTitle");
  const body = tidyText(
    t(`message.${tone}`, {
      named: named ? "yes" : "no",
      firstName,
      jobTitle,
      company,
      signer: user.name,
      strengthLine: strength ? t(`strength.${tone}`, { strength }) : "",
    }).replaceAll("\\n", "\n"),
  );
  const segments = decisionParagraphs(body).map((paragraph) =>
    highlightSegments(paragraph, [firstName, offer?.title, company, strength]),
  );
  const contacts = quotas.contacts;
  const left = contacts.limit < 0 ? null : Math.max(0, contacts.limit - contacts.used);
  const link = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams();
    const state: Record<string, string | null> = {
      offre: offer?.id ?? null,
      ton: tone === "chaleureux" ? null : tone,
      ...changes,
    };
    for (const [key, value] of Object.entries(state)) if (value) next.set(key, value);
    const search = next.toString();
    return search ? `${page}?${search}` : page;
  };

  const erreur = one(query.erreur);
  const errorText = !erreur
    ? null
    : erreur === "quota"
      ? t("error.quota", { date: formatDayMonth(contacts.resetsAt) })
      : erreur === "cooldown"
        ? t("error.cooldown", { days: CONTACT_COOLDOWN_DAYS })
        : erreur === "blocked"
          ? t("error.blocked")
          : erreur === "invalid"
            ? t("error.invalid", { min: CONTACT_MESSAGE_MIN })
            : erreur === "locked"
              ? t("error.locked")
              : t("error.other");

  return (
    <div className="t-flux t-ri-prop t-rw-prop">
      <FlowHead back={profilePage} backLabel={t("back")} title={t("title")} />
      {/* Web: a centred card over the profile (planche `.dlg`), the same form. */}
      <div className="t-rw-h t-rw-web">
        <div className="t-t">
          <Link href={profilePage} className="t-rw-crumb">
            <TalentIcon name="suivant" size="xs" />
            {t("back")}
          </Link>
          <h1>{t("title")}</h1>
        </div>
      </div>

      <div className="t-verre t-ri-mini">
        <span className={cx("t-rc-av", avatarTone(profile.id))} aria-hidden>
          {named ? initialsOf(profile.user.name) : "?"}
        </span>
        <span className="t-t">
          <b>{title}</b>
          <span>
            {[named ? profile.headline : null, profile.user.city].filter(Boolean).join(" · ")}
          </span>
        </span>
        {explanation && (
          <ScoreRing
            score={explanation.score}
            size="s"
            text={ui("percent", { value: explanation.score })}
            label={t("scoreAria", { score: explanation.score })}
          />
        )}
      </div>

      {errorText && (
        <p className="t-gar t-err" role="alert">
          <TalentIcon name="pourquoi" size="s" />
          <span>{errorText}</span>
        </p>
      )}

      <form action={proposeOfferAction} className="t-ri-pf">
        <input type="hidden" name="profile" value={profile.id} />
        {offer && <input type="hidden" name="job" value={offer.id} />}

        <div className="t-verre t-ri-offre">
          <span className="t-cases t-g-oppo" aria-hidden>
            <TalentIcon name="offre" size="s" />
          </span>
          <span className="t-t">
            <small>{t("offer")}</small>
            <b>{offer?.title ?? t("noOffer")}</b>
          </span>
          {offers.length > 1 && (
            <SheetButton target="ri-offres" className="t-ri-lien t-press">
              {t("change")}
            </SheetButton>
          )}
        </div>

        <NextIntlClientProvider messages={pickMessages(messages, ["hireCandidates"])}>
          <DecisionMessage
            key={`${offer?.id}-${tone}`}
            body={body}
            segments={segments}
            firstName={firstName || t("anonymousShort")}
            title={t("prepared")}
            edited={t("edited")}
            fieldId="ri-proposition"
            editLabel={t("messageLabel")}
            editText={t("edit")}
          />
        </NextIntlClientProvider>

        <ul className="t-rc-tons" aria-label={t("tones")}>
          {tones.map((chip) => (
            <li key={chip}>
              <Link
                href={link({ ton: chip === "chaleureux" ? null : chip })}
                aria-current={chip === tone ? "true" : undefined}
                className="t-press"
                scroll={false}
                replace
              >
                {t(`tone.${chip}`)}
              </Link>
            </li>
          ))}
        </ul>

        {offer && (
          <label className="t-verre t-li t-ri-joindre">
            <span className="t-t">
              <b>{t("attach")}</b>
              <span>{t("attachText")}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              name="annonce"
              defaultChecked
              className="sr-only"
            />
            <span aria-hidden className="t-sw" />
          </label>
        )}

        {left !== null && (
          <div className="t-verre t-ri-quota">
            <p>
              <b>{t("quota")}</b>
              <span>{t("quotaValue", { used: contacts.used, max: contacts.limit })}</span>
            </p>
            <span
              className="t-ri-barre"
              role="img"
              aria-label={t("quotaValue", { used: contacts.used, max: contacts.limit })}
            >
              <i
                style={{
                  width: `${Math.min(100, (contacts.used / Math.max(1, contacts.limit)) * 100)}%`,
                }}
              />
            </span>
          </div>
        )}

        <p className="t-gar">
          <TalentIcon name="confidentialite" size="s" />
          <span>{t("guard", { days: CONTACT_EXPIRY_DAYS })}</span>
        </p>

        <div className="t-verre t-fort t-bas-f t-ri-bas t-rw-st">
          <Link href={profilePage} className="t-bt t-sec t-m t-press">
            {t("cancel")}
          </Link>
          <button type="submit" disabled={left === 0} className="t-bt t-p t-m t-pl t-press">
            <TalentIcon name="envoyer" size="s" />
            {named ? t("send", { firstName }) : t("sendAnonymous")}
          </button>
        </div>
      </form>

      {offers.length > 1 && (
        <Sheet id="ri-offres" title={t("changeTitle")} closeLabel={t("close")}>
          <ul className="t-rc-offres">
            {offers.map((item) => (
              <li key={item.id}>
                <Link
                  href={link({ offre: item.id })}
                  aria-current={item.id === offer?.id ? "page" : undefined}
                  className="t-press"
                  replace
                >
                  <span className="t-t">
                    <b>{item.title}</b>
                    {item.city && <span>{item.city}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </div>
  );
}
