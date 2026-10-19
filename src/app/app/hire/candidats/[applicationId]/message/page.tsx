import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { Alert, Button, ButtonLink, DecisionCard, Select, TextField } from "@/components/ui";
import { initials } from "@/components/ui/avatar";
import { PhoneBarFlag } from "@/components/layout/phone-bar-flag";
import { cx } from "@/lib/cx";
import { requestDocumentAction } from "@/server/actions/hire";
import { sendDecisionAction, sendTemplateMessageAction } from "@/server/actions/hire-messages";
import { db } from "@/server/db";
import { can, level } from "@/server/entitlements";
import { applicationMatches } from "@/server/matching/service";
import { ARRIVAL_CALL_MINUTES, SLOTS_MAX } from "@/server/services/interviews";
import { requireHire } from "@/server/hire-context";
import { getOrgApplication, HireError, rejectReasons } from "@/server/services/hire";
import {
  decisionParagraphs,
  fillTemplate,
  highlightSegments,
  nextTone,
  organizationTemplate,
  strongestSkill,
  TEMPLATE_BODY_MAX,
  templateKinds,
  templateTones,
  tidyText,
  type TemplateKind,
  type TemplateTone,
} from "@/server/services/message-templates";
import { defaultTimeZone } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hire.templates");
  return { title: t("message.title"), robots: { index: false } };
}

const tiles: { kind: TemplateKind; icon: IconName; tone: string }[] = [
  { kind: "convocation", icon: "calendrier", tone: "bg-lime" },
  { kind: "document", icon: "doc", tone: "bg-neon" },
  { kind: "relance", icon: "horloge", tone: "bg-menthe-claire" },
  { kind: "acceptation", icon: "check", tone: "bg-lime" },
  { kind: "refus", icon: "fermer", tone: "bg-brume" },
];

const field =
  "w-full rounded-[18px] bg-blanc px-4 py-3.5 text-[15px] leading-relaxed shadow-douce focus-visible:outline-2 focus-visible:outline-sapin";

/**
 * « Message » to a candidate (docs/ux-mobile-talent, prompt 5, screens 54-55): the organization's
 * templates (or Jumanly's default text), filled with the candidate's first name, the job and the
 * company. A refusal or an acceptance is shown exactly as the talent will receive it, and leaves
 * only after the recruiter's click.
 */
export default async function CandidateMessagePage({
  params,
  searchParams,
}: PageProps<"/app/hire/candidats/[applicationId]/message">) {
  const [{ applicationId }, query] = await Promise.all([params, searchParams]);
  const page = `/app/hire/candidats/${applicationId}/message`;
  const { user, space, ctx } = await requireHire(page, "manage");
  const application = await getOrgApplication(db, ctx, applicationId).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const t = await getTranslations("hire.templates");
  const tr = await getTranslations("hire.reject");
  const td = await getTranslations("hire.application.requestDocument");
  const person = application.profile.user;
  const firstName = person.firstName || person.name;
  const company = space.organization.name;
  const job = application.job;
  const decided = application.stage.kind === "rejected" || application.stage.kind === "hired";
  const kind = templateKinds.includes(query.modele as TemplateKind)
    ? (query.modele as TemplateKind)
    : null;
  const candidateHref = `/app/hire/candidats/${application.id}`;

  const header = (title: string, backHref: string) => (
    <div className="flex items-center gap-3">
      <Link
        href={backHref}
        aria-label={t("message.back")}
        className="grid size-[42px] shrink-0 place-items-center rounded-[14px] bg-blanc shadow-douce"
      >
        <Icon name="retour" className="size-5" />
      </Link>
      <h1 className="text-[26px] leading-tight font-bold tracking-tight">{title}</h1>
    </div>
  );

  if (!kind) {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 pb-6">
        {header(t("message.title"), candidateHref)}
        <div className="flex items-center gap-3.5 rounded-[22px] bg-blanc p-4 shadow-douce">
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-full bg-lime text-[16px] font-bold"
          >
            {firstName.slice(0, 1).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[16px] font-semibold">{person.name}</span>
            <span className="truncate text-[13.5px] text-ardoise">
              {[job.title, application.stage.name].join(" · ")}
            </span>
          </span>
        </div>
        <h2 className="text-[19px] font-semibold">{t("message.choose")}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tiles
            .filter((tile) => !decided || (tile.kind !== "refus" && tile.kind !== "acceptation"))
            .map((tile) => (
              <li key={tile.kind}>
                <Link
                  href={`${page}?modele=${tile.kind}`}
                  className="jm-pressable flex h-full flex-col items-center gap-2 rounded-[22px] p-2 pb-3 text-center"
                >
                  <span
                    aria-hidden
                    className={cx("grid h-20 w-full place-items-center rounded-[16px]", tile.tone)}
                  >
                    <span className="grid size-11 place-items-center rounded-[13px] bg-blanc">
                      <Icon name={tile.icon} className="size-5" />
                    </span>
                  </span>
                  <span className="text-[14.5px] font-semibold">{t(`kind.${tile.kind}`)}</span>
                </Link>
              </li>
            ))}
          <li>
            <span
              aria-disabled="true"
              className="jm-ai-surface flex h-full flex-col items-center gap-2 rounded-[22px] p-2 pb-3 text-center text-blanc opacity-70"
            >
              <span aria-hidden className="grid h-20 w-full place-items-center">
                <span className="grid size-11 place-items-center rounded-[13px] bg-lime text-sapin">
                  <Icon name="intelligence" className="size-5" />
                </span>
              </span>
              <span className="text-[14.5px] font-semibold">{t("message.ai")}</span>
              <span className="text-[11.5px]">{t("message.aiSoon")}</span>
            </span>
          </li>
        </ul>
        <Link
          href="/app/hire/modeles"
          className="flex min-h-11 items-center gap-1.5 self-start text-[14px] font-semibold text-feuille-fonce"
        >
          <Icon name="edit" className="size-4" />
          {t("message.manage")}
        </Link>
      </div>
    );
  }

  if (decided && (kind === "refus" || kind === "acceptation")) {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 pb-6">
        {header(t("message.title"), candidateHref)}
        <Alert title={t("message.decided")} />
      </div>
    );
  }

  // The text: the one being edited, else the tone chosen, else the job's refusal text or the
  // organization's template, else Jumanly's own text in its warm tone (V7, screens 55 and 80).
  const own = await organizationTemplate(db, ctx, kind);
  const values = { firstName, jobTitle: job.title, company, signer: user.name };
  const edited = typeof query.texte === "string" ? query.texte.slice(0, TEMPLATE_BODY_MAX) : null;
  const ownText =
    kind === "refus" && job.rejectionTemplate
      ? job.rejectionTemplate.replaceAll("\\n", "\n")
      : own
        ? fillTemplate(own.body, values)
        : null;
  const title = t("message.titleFor", { kind: t(`kind.${kind}`), name: person.name });

  if (kind === "refus" || kind === "acceptation") {
    const outcome = kind === "refus" ? "rejected" : "hired";
    const subject = { type: "organization" as const, id: ctx.organizationId };
    const [matching, appointments] = await Promise.all([
      level(db, subject, "hire.matching.level"),
      can(db, subject, "connect.appointments"),
    ]);
    // The strongest skill only when the organization sees matching (« point fort », V7 § B6).
    const explanation =
      matching === "none"
        ? null
        : (await applicationMatches(db, [application])).get(application.id);
    const strength = strongestSkill(explanation && explanation !== "disabled" ? explanation : null);
    const asked = templateTones.find((tone) => tone === query.ton);
    const tone: TemplateTone | "organisation" =
      asked ?? (ownText && query.ton !== "jumanly" ? "organisation" : "chaleureux");
    const withCall = kind === "acceptation" && appointments && query.creneau === "1";
    const timeZone = defaultTimeZone();
    const toneText = (chosen: TemplateTone) =>
      tidyText(
        t(`tone.${chosen}.${kind}.body`, {
          ...values,
          strengthLine: strength ? t(`tone.${chosen}.${kind}.strength`, { strength }) : "",
          nextLine:
            kind === "acceptation"
              ? t(`tone.${chosen}.acceptation.${withCall ? "nextCall" : "next"}`)
              : "",
        }).replaceAll("\\n", "\n"),
      );
    const body =
      edited ?? (tone === "organisation" && ownText ? ownText : toneText(tone as TemplateTone));
    const paragraphs = decisionParagraphs(body);
    const editing = query.edition === "1";
    const previewing = kind === "refus" || query.vue === "apercu";
    const link = (changes: Record<string, string | null>) => {
      const params = new URLSearchParams({ modele: kind });
      const state: Record<string, string | null> = {
        ton: asked ?? (tone === "organisation" ? null : query.ton === "jumanly" ? "jumanly" : null),
        creneau: withCall ? "1" : null,
        vue: kind === "acceptation" && query.vue === "apercu" ? "apercu" : null,
        ...changes,
      };
      for (const [key, value] of Object.entries(state)) if (value) params.set(key, value);
      return `${page}?${params}`;
    };
    const chips = (
      <ul aria-label={t("message.tones")} className="flex flex-wrap gap-1.5">
        {[...(ownText ? (["organisation"] as const) : []), ...templateTones].map((chip) => (
          <li key={chip}>
            <Link
              href={link({ ton: chip === "organisation" ? null : chip, edition: null })}
              aria-current={chip === tone ? "true" : undefined}
              className={cx(
                "flex min-h-9 items-center rounded-pill px-3.5 text-[13px] whitespace-nowrap transition-colors",
                chip === tone
                  ? "bg-sapin font-semibold text-blanc"
                  : "bg-blanc/70 text-sapin ring-1 ring-brume ring-inset hover:bg-blanc",
              )}
            >
              {t(`toneName.${chip}`)}
            </Link>
          </li>
        ))}
      </ul>
    );
    const decisionCard = (
      <DecisionCard
        outcome={outcome}
        company={company}
        job={job.title}
        banner={outcome === "hired" ? t("banner.hired") : t("banner.rejected")}
        paragraphs={paragraphs}
        signer={t("signer", { name: user.name })}
        date={t("today")}
      />
    );
    const editForm = (
      <form action={page} className="flex flex-col gap-3 rounded-[22px] bg-blanc p-4 shadow-douce">
        <input type="hidden" name="modele" value={kind} />
        {asked && <input type="hidden" name="ton" value={asked} />}
        {withCall && <input type="hidden" name="creneau" value="1" />}
        <label htmlFor="decision-texte" className="text-[13.5px] font-semibold">
          {t("message.text")}
        </label>
        <textarea
          id="decision-texte"
          name="texte"
          rows={10}
          maxLength={TEMPLATE_BODY_MAX}
          defaultValue={body}
          className={cx(field, "bg-creme shadow-none")}
        />
        <Button type="submit" variant="outline" size="M" className="self-start">
          {t("message.refresh")}
        </Button>
      </form>
    );
    const editLink = !editing && (
      <ButtonLink
        href={link({ edition: "1", texte: edited })}
        variant="outline"
        size="S"
        icon={<Icon name="edit" />}
      >
        {t("message.edit")}
      </ButtonLink>
    );
    const bar =
      "fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 flex flex-wrap items-center gap-3 rounded-[22px] bg-blanc p-3 shadow-float md:static md:bg-transparent md:p-0 md:shadow-none";
    const secondary =
      "flex h-[52px] items-center rounded-pill bg-blanc px-6 text-[15px] font-semibold shadow-douce md:ring-[1.5px] md:ring-brume md:ring-inset md:shadow-none";

    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 pb-32 md:pb-6">
        {header(kind === "refus" ? title : t("kind.acceptation"), page)}
        {query.erreur === "1" && <Alert tone="error" title={t("message.error")} />}
        {query.erreur === "creneau" && <Alert tone="error" title={t("message.callError")} />}
        {kind === "acceptation" && (
          <div className="flex items-center gap-3 rounded-[20px] bg-blanc p-3 shadow-douce">
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-full bg-lime text-[13px] font-bold"
            >
              {initials(person.name)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-semibold">{person.name}</span>
              <span className="truncate text-[13px] text-ardoise">
                {[job.title, application.stage.name].join(" · ")}
              </span>
            </span>
          </div>
        )}
        {(kind === "acceptation" || editing) && chips}
        {previewing ? (
          <>
            <p className="text-[14.5px] font-semibold text-ardoise">
              {t("message.preview", { firstName })}
            </p>
            {decisionCard}
          </>
        ) : (
          <section
            aria-labelledby="decision-model"
            className="flex flex-col gap-2 rounded-[22px] bg-blanc p-4 text-[15px] leading-[1.5] shadow-douce"
          >
            <h2
              id="decision-model"
              className="inline-flex items-center gap-1.5 self-start rounded-pill bg-[#EEFBDD] px-2.5 py-1 text-[12px] font-bold text-[#14745F]"
            >
              <Icon name="check" className="size-3.5" />
              {t(
                edited !== null
                  ? "message.modelEdited"
                  : tone === "organisation"
                    ? "message.modelOwn"
                    : "message.modelProposed",
                {
                  kind: t(`kind.${kind}`),
                },
              )}
            </h2>
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line">
                {highlightSegments(paragraph, [firstName, job.title, company, strength]).map(
                  (segment, at) =>
                    segment.filled ? (
                      <mark key={at} className="rounded-[5px] bg-neon px-[3px] text-sapin">
                        {segment.text}
                      </mark>
                    ) : (
                      segment.text
                    ),
                )}
              </p>
            ))}
          </section>
        )}
        {editing && editForm}
        <div className="flex flex-wrap items-center gap-2.5">
          {kind === "acceptation" &&
            appointments &&
            (withCall ? (
              <ButtonLink
                href={link({ creneau: null })}
                variant="outline"
                size="S"
                icon={<Icon name="fermer" />}
              >
                {t("message.removeCall")}
              </ButtonLink>
            ) : (
              <ButtonLink
                href={`${link({ creneau: "1" })}#creneaux`}
                variant="outline"
                size="S"
                icon={<Icon name="calendrier" />}
              >
                {t("message.addCall")}
              </ButtonLink>
            ))}
          {editLink}
          {kind === "refus" ? (
            <ButtonLink
              href={link({ ton: nextTone(tone), edition: null })}
              variant="ai"
              size="S"
              icon={<Icon name="intelligence" />}
            >
              {t(`message.more.${nextTone(tone)}`)}
            </ButtonLink>
          ) : (
            <span
              aria-disabled="true"
              className="jm-ai-surface inline-flex h-9 items-center gap-1.5 rounded-pill px-4 text-[13px] font-semibold text-blanc opacity-75"
            >
              <Icon name="intelligence" className="size-4 text-lime" />
              {t("message.orbi")}
              <span className="text-[11px] font-medium">· {t("message.aiSoon")}</span>
            </span>
          )}
        </div>
        <form action={sendDecisionAction} className="flex flex-col gap-4">
          <input type="hidden" name="application" value={application.id} />
          <input type="hidden" name="outcome" value={outcome} />
          <input type="hidden" name="message" value={body} />
          {asked && <input type="hidden" name="ton" value={asked} />}
          {withCall && (
            <fieldset
              id="creneaux"
              className="flex flex-col gap-3 rounded-[22px] bg-blanc p-4 shadow-douce"
            >
              <legend className="float-left mb-1 text-[15px] font-semibold">
                {t("message.callTitle")}
              </legend>
              <p className="clear-left text-[13px] text-ardoise">
                {t("message.callHint", { minutes: ARRIVAL_CALL_MINUTES, timezone: timeZone })}
              </p>
              <input type="hidden" name="timezone" value={timeZone} />
              {Array.from({ length: SLOTS_MAX }, (_, index) => (
                <TextField
                  key={index}
                  id={`decision-slot-${index}`}
                  name="slot"
                  type="datetime-local"
                  required={index === 0}
                  label={t("message.callSlot", { number: index + 1 })}
                />
              ))}
            </fieldset>
          )}
          {outcome === "rejected" && (
            <Select
              id="decision-reason"
              name="reason"
              required
              label={tr("reason.text")}
              hint={tr("reason.hint")}
              placeholder={tr("reason.text")}
              defaultValue=""
              options={rejectReasons.map((reason) => ({
                value: reason,
                label: tr(`reason.${reason}`),
              }))}
            />
          )}
          <p className="flex items-start gap-2 text-[12.5px] leading-snug text-ardoise">
            <Icon name="transparence" className="mt-px size-4 shrink-0" />
            {kind === "acceptation" ? t("message.filledAfterClick") : t("message.afterClick")}
          </p>
          {outcome === "rejected" && (
            <p className="flex gap-2 rounded-[16px] bg-creme px-4 py-3 text-[12.5px] leading-[17px]">
              <Icon name="info" className="mt-px size-4 shrink-0" />
              {tr("aiRule")}
            </p>
          )}
          {outcome === "rejected" && (
            <Button
              type="submit"
              name="send"
              value="none"
              variant="link"
              size="S"
              className="self-start"
            >
              {t("message.withoutMessage")}
            </Button>
          )}
          <div className={bar}>
            <PhoneBarFlag />
            {kind === "refus" ? (
              <Link href={candidateHref} className={secondary}>
                {t("message.cancel")}
              </Link>
            ) : (
              <Link
                href={link({ vue: previewing ? null : "apercu", edition: null, texte: edited })}
                className={secondary}
              >
                {previewing ? t("message.backToText") : t("message.previewShort")}
              </Link>
            )}
            <Button
              type="submit"
              name="send"
              value="now"
              variant="principal"
              size="L"
              arrow
              className="flex-1 md:flex-none"
            >
              {t("message.send")}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  const body = edited ?? ownText ?? t(`default.${kind}.body`, values).replaceAll("\\n", "\n");

  if (kind === "document") {
    return (
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 pb-6">
        {header(title, page)}
        <form action={requestDocumentAction} className="flex flex-col gap-4">
          <input type="hidden" name="application" value={application.id} />
          <TextField
            id="template-document-name"
            name="name"
            required
            minLength={2}
            maxLength={120}
            label={td("name.text")}
            placeholder={td("name.placeholder")}
          />
          <TextField id="template-document-due" name="due" type="date" required label={td("due")} />
          <label htmlFor="template-document-note" className="text-[13.5px] font-semibold">
            {td("note")}
          </label>
          <textarea
            id="template-document-note"
            name="note"
            rows={6}
            maxLength={1000}
            defaultValue={body.slice(0, 1000)}
            className={field}
          />
          <p className="text-[12px] text-ardoise">{td("forbidden")}</p>
          <Button type="submit" variant="principal" size="L" arrow className="self-start">
            {td("send")}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4 pb-6">
      {header(title, page)}
      {query.erreur === "1" && <Alert tone="error" title={t("message.error")} />}
      <form action={sendTemplateMessageAction} className="flex flex-col gap-4">
        <input type="hidden" name="application" value={application.id} />
        <input type="hidden" name="modele" value={kind} />
        <label htmlFor="template-body" className="text-[13.5px] font-semibold">
          {t("message.text")}
        </label>
        <textarea
          id="template-body"
          name="body"
          rows={10}
          required
          maxLength={TEMPLATE_BODY_MAX}
          defaultValue={body}
          className={field}
        />
        {kind === "convocation" && (
          <p className="text-[13px] text-ardoise">
            {t("message.convocationHint")}{" "}
            <Link
              href={`/app/hire/entretiens?candidature=${application.id}#planifier`}
              className="font-semibold underline"
            >
              {t("message.schedule")}
            </Link>
          </p>
        )}
        <Button type="submit" variant="principal" size="L" arrow className="self-start">
          {t("message.send")}
        </Button>
      </form>
    </div>
  );
}
