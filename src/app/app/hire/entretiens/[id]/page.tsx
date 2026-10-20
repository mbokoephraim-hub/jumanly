import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { ToastOnLoad } from "@/components/motion/toast-on-load";
import { avatarTone, initialsOf, ScoreRing } from "@/components/recruiter/candidates";
import { CopyRow } from "@/components/recruiter/copy-row";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import { defaultTimeZone } from "@/lib/dates";
import { siteUrl } from "@/lib/seo";
import {
  acceptProposedSlotAction,
  addInterviewQuestionAction,
  cancelInterviewAction,
  closeInterviewAction,
  removeInterviewQuestionAction,
} from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { level } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import { applicationMatches } from "@/server/matching/service";
import { HireError, hirePermissions, recordView } from "@/server/services/hire";
import {
  proposedQuestions,
  QUESTIONS_MAX,
  questionsOf,
  readInterview,
  recruitingMembers,
} from "@/server/services/hire-interviews";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireInterviews.prep");
  return { title: t("title"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/**
 * Préparer l'entretien (brief recruteur § 4 item 4, planche r2plus PREP_R): when and with whom,
 * what Orbi suggests to check from the file, the questions proposed from the skills of the offer
 * and those the team adds, then « Ouvrir l'évaluation ». The answers of the candidate's times and
 * the follow-up (accept another date, propose new times, cancel, mark as done) are here too.
 */
export default async function InterviewPage({
  params,
  searchParams,
}: PageProps<"/app/hire/entretiens/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const page = `/app/hire/entretiens/${id}`;
  const { ctx } = await requireHire(page, "readApplications");
  const t = await getTranslations("hireInterviews");
  const ui = await getTranslations("ui");
  const format = await getFormatter();
  const now = new Date();
  const interview = await readInterview(db, ctx, id).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const application = await recordView(db, ctx, interview.application.id, now);
  const permissions = hirePermissions(ctx.role);
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [matchingLevel, members] = await Promise.all([
    level(db, subject, "hire.matching.level"),
    recruitingMembers(db, ctx),
  ]);
  const match =
    matchingLevel === "none"
      ? null
      : ((await applicationMatches(db, [application], now)).get(application.id) ?? null);
  const score = match && match !== "disabled" ? match.score : null;
  const person = application.profile.user;
  const firstName = person.firstName || person.name.split(/\s+/)[0]!;
  const timeZone = interview.timezone || defaultTimeZone();
  const day = (date: Date) =>
    format.dateTime(date, { weekday: "long", day: "numeric", month: "long", timeZone });
  const hour = (date: Date) =>
    format.dateTime(date, { hour: "2-digit", minute: "2-digit", timeZone });
  const team = [interview.organizerId, ...interview.participantIds];
  const nameOf = (userId: string) => members.find((member) => member.id === userId)?.name ?? "";
  const mine = team.includes(ctx.userId);
  const proposed = proposedQuestions(application);
  const own = questionsOf(interview.questions);
  const toCheck = proposed.filter((item) => item.check);
  const live = ["pending", "reschedule", "confirmed"].includes(interview.status);
  const past = interview.startsAt !== null && interview.startsAt <= now;
  const finished =
    ["done", "no_show"].includes(interview.status) || (interview.status === "confirmed" && past);

  const ok = one(query.ok);
  const toasts: Record<string, string> = {
    envoye: t("prep.ok.sent", { firstName }),
    confirme: t("prep.ok.confirmed"),
    reprogramme: t("prep.ok.rescheduled", { firstName }),
    annule: t("prep.ok.canceled", { firstName }),
    fait: t("prep.ok.done"),
    absent: t("prep.ok.noShow"),
    question: t("prep.ok.question"),
    "question-retiree": t("prep.ok.questionRemoved"),
  };
  const questionError = one(query.question);
  const errorText =
    questionError === "protected"
      ? t("prep.question.protected")
      : questionError === "invalid"
        ? t("prep.question.invalid")
        : questionError === "full"
          ? t("prep.question.full", { max: QUESTIONS_MAX })
          : one(query.erreur)
            ? t("prep.error")
            : null;

  return (
    <div className="t-flux t-ri-prep">
      {toasts[ok] && <ToastOnLoad message={toasts[ok]} tone="success" />}
      <FlowHead
        back="/app/hire/entretiens"
        backLabel={t("prep.back")}
        title={t("prep.title")}
        end={
          permissions.manage && live ? (
            <SheetButton target="ri-suivi" label={t("prep.more")} className="t-bi t-press">
              <TalentIcon name="plus-options" size="s" />
            </SheetButton>
          ) : undefined
        }
      />

      <Link href={`/app/hire/candidats/${application.id}`} className="t-verre t-ri-mini t-press">
        <span className={cx("t-rc-av", avatarTone(application.id))} aria-hidden>
          {initialsOf(person.name)}
        </span>
        <span className="t-t">
          <b>{person.name}</b>
          <span>{[application.job.title, application.stage.name].join(" · ")}</span>
        </span>
        {score !== null && (
          <ScoreRing
            score={score}
            size="s"
            text={ui("percent", { value: score })}
            label={t("plan.scoreAria", { score })}
          />
        )}
      </Link>

      {errorText && (
        <p className="t-gar t-err" role="alert">
          <TalentIcon name="pourquoi" size="s" />
          <span>{errorText}</span>
        </p>
      )}

      <div className="t-ri-cases">
        <div className="t-verre t-ri-date">
          {interview.startsAt ? (
            <>
              <small>{format.dateTime(interview.startsAt, { weekday: "short", timeZone })}</small>
              <b>{format.dateTime(interview.startsAt, { day: "numeric", timeZone })}</b>
              <span>
                {hour(interview.startsAt)} ·{" "}
                {t("plan.duration", { minutes: interview.durationMinutes })}
              </span>
            </>
          ) : (
            <>
              <small>{t("prep.when")}</small>
              <b className="t-ri-q">
                <TalentIcon name="horloge" size="s" />
              </b>
              <span>{t("plan.duration", { minutes: interview.durationMinutes })}</span>
            </>
          )}
        </div>
        <div className="t-verre t-ri-avec">
          <small>{t("prep.with")}</small>
          <span className="t-ri-pile" aria-hidden>
            {team.slice(0, 4).map((userId) => (
              <i key={userId} className={cx("t-rc-av", avatarTone(userId))}>
                {initialsOf(nameOf(userId) || "?")}
              </i>
            ))}
          </span>
          <span>{team.map(nameOf).filter(Boolean).join(", ")}</span>
        </div>
      </div>

      <div className="t-verre t-ri-statut">
        <span
          className={cx(
            "t-ri-etq",
            {
              confirmed: "t-ok",
              pending: "t-at",
              reschedule: "t-au",
              done: "t-fi",
              no_show: "t-fi",
              canceled: "t-an",
              declined: "t-an",
            }[interview.status],
          )}
        >
          {t(`agenda.status.${interview.status === "no_show" ? "noShow" : interview.status}`)}
        </span>
        <span className="t-t">
          {interview.status === "pending" && t("prep.status.pending", { firstName })}
          {interview.status === "reschedule" && t("prep.status.reschedule", { firstName })}
          {interview.status === "confirmed" &&
            interview.startsAt &&
            t("prep.status.confirmed", {
              day: day(interview.startsAt),
              time: hour(interview.startsAt),
            })}
          {interview.status === "declined" && t("prep.status.declined", { firstName })}
          {interview.status === "canceled" && t("prep.status.canceled")}
          {interview.status === "done" && t("prep.status.done")}
          {interview.status === "no_show" && t("prep.status.noShow", { firstName })}
        </span>
        <span className="t-m">
          {[
            t(`plan.mode.${interview.mode}`),
            interview.mode === "onsite" ? interview.address : interview.link,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {interview.status === "pending" && (
          <ul className="t-ri-creneaux" aria-label={t("prep.slots")}>
            {interview.slots.map((slot) => (
              <li key={slot.toISOString()}>
                {t("prep.slotAt", { day: day(slot), time: hour(slot) })}
              </li>
            ))}
          </ul>
        )}
        {interview.status === "reschedule" && (
          <ul className="t-ri-creneaux" aria-label={t("prep.proposed", { firstName })}>
            {interview.proposedSlots.map((slot) => (
              <li key={slot.toISOString()}>
                <span>{t("prep.slotAt", { day: day(slot), time: hour(slot) })}</span>
                {permissions.manage && slot > now && (
                  <form action={acceptProposedSlotAction}>
                    <input type="hidden" name="interview" value={interview.id} />
                    <input type="hidden" name="slot" value={slot.toISOString()} />
                    <button type="submit" className="t-bt t-p t-s t-press">
                      {t("prep.accept")}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {permissions.manage &&
          (interview.status === "reschedule" || interview.status === "declined") &&
          application.status === "active" && (
            <Link
              href={`/app/hire/candidats/${application.id}/entretien${interview.status === "reschedule" ? `?entretien=${interview.id}` : ""}`}
              className="t-bt t-sec t-s t-press"
            >
              {t("prep.newTimes")}
            </Link>
          )}
      </div>

      <section aria-labelledby="ri-verif" className="t-rc-orbi">
        <div className="t-h">
          <OrbiMark size={30} />
          <div className="t-t">
            <b id="ri-verif">{t("prep.checkTitle")}</b>
            <span>{t("prep.checkSub")}</span>
          </div>
        </div>
        {proposed.length === 0 ? (
          <p>{t("prep.checkNone")}</p>
        ) : (
          <ul className="t-rc-pts">
            {proposed.map((item) => (
              <li key={item.skill}>
                <i aria-hidden className={item.check ? "t-a" : "t-v"}>
                  {item.check ? "!" : "✓"}
                </i>
                <span>{t(`prep.point.${item.kind}`, { skill: item.skill })}</span>
              </li>
            ))}
          </ul>
        )}
        {toCheck.length === 0 && proposed.length > 0 && (
          <p className="t-rc-note">{t("prep.allProven")}</p>
        )}
      </section>

      <section id="questions" aria-labelledby="ri-questions" className="t-ri-bloc">
        <div className="t-ri-bh">
          <h2 id="ri-questions">{t("prep.questions")}</h2>
          {permissions.evaluate && own.length < QUESTIONS_MAX && (
            <SheetButton target="ri-question" className="t-pq t-press">
              <TalentIcon name="plus" size="xs" />
              {t("prep.add")}
            </SheetButton>
          )}
        </div>
        <ol className="t-ri-qs">
          {proposed.map((item) => (
            <li key={item.skill} className="t-verre">
              <span className="t-ri-qo" aria-hidden>
                <TalentIcon name="orbi" size="xs" />
              </span>
              <span className="t-t">
                <b>{t(`prep.ask.${item.kind}`, { skill: item.skill })}</b>
                <span>
                  {[
                    item.skill,
                    item.required ? t("prep.required") : t("prep.preferred"),
                    item.check ? t("prep.toCheck") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
            </li>
          ))}
          {own.map((item) => (
            <li key={item.id} className="t-verre">
              <span className={cx("t-rc-av t-s", avatarTone(item.authorId))} aria-hidden>
                {initialsOf(nameOf(item.authorId) || "?")}
              </span>
              <span className="t-t">
                <b>{item.text}</b>
                <span>
                  {t("prep.by", { name: nameOf(item.authorId) || t("prep.formerMember") })}
                </span>
              </span>
              {item.authorId === ctx.userId && (
                <form action={removeInterviewQuestionAction}>
                  <input type="hidden" name="interview" value={interview.id} />
                  <input type="hidden" name="question" value={item.id} />
                  <button
                    type="submit"
                    className="t-bi t-press"
                    aria-label={t("prep.remove", { question: item.text })}
                  >
                    <TalentIcon name="supprimer" size="xs" />
                  </button>
                </form>
              )}
            </li>
          ))}
        </ol>
        <p className="t-gar">
          <TalentIcon name="confidentialite" size="s" />
          <span>{t("prep.guard")}</span>
        </p>
      </section>

      <nav aria-label={t("prep.actions")} className="t-verre t-fort t-bas-f t-ri-bas">
        <SheetButton target="ri-partager" className="t-bt t-sec t-m t-press">
          <TalentIcon name="partager" size="s" />
          {t("prep.share")}
        </SheetButton>
        {permissions.evaluate && mine ? (
          <Link
            href={`/app/hire/candidats/${application.id}/evaluation`}
            className={cx("t-bt t-m t-pl t-press", finished ? "t-p" : "t-sec")}
          >
            <TalentIcon name="valider" size="s" />
            {t("prep.evaluate")}
          </Link>
        ) : (
          <Link
            href={`/app/hire/candidats/${application.id}`}
            className="t-bt t-p t-m t-pl t-press"
          >
            {t("prep.file")}
          </Link>
        )}
      </nav>

      <Sheet id="ri-partager" title={t("prep.shareTitle")} closeLabel={t("plan.close")}>
        <p className="t-rc-note">{t("prep.shareText")}</p>
        <CopyRow
          value={`${siteUrl()}${page}`}
          copied={t("prep.copied")}
          className="t-bt t-sec t-m t-press"
        >
          <TalentIcon name="partager" size="s" />
          {t("prep.copy")}
        </CopyRow>
        {application.conversation && permissions.manage && (
          <Link
            href={`/app/messages/${application.conversation.id}`}
            className="t-bt t-sec t-m t-press"
          >
            <TalentIcon name="message" size="s" />
            {t("prep.writeCandidate", { firstName })}
          </Link>
        )}
      </Sheet>

      {permissions.evaluate && (
        <Sheet
          id="ri-question"
          title={t("prep.addTitle")}
          closeLabel={t("plan.close")}
          openParam="question"
          defaultOpen={Boolean(questionError)}
        >
          <form action={addInterviewQuestionAction} className="t-ri-vnew">
            <input type="hidden" name="interview" value={interview.id} />
            <label htmlFor="ri-q-texte">{t("prep.addLabel")}</label>
            <div className="t-verre t-saisie">
              <textarea
                id="ri-q-texte"
                name="question"
                required
                minLength={5}
                maxLength={300}
                rows={3}
                placeholder={t("prep.addPlaceholder")}
              />
            </div>
            <p className="t-rc-note">{t("prep.addNote")}</p>
            <button type="submit" className="t-bt t-p t-m t-press">
              {t("prep.addSubmit")}
            </button>
          </form>
        </Sheet>
      )}

      {permissions.manage && live && (
        <Sheet id="ri-suivi" title={t("prep.moreTitle")} closeLabel={t("plan.close")}>
          <div className="t-ri-suivi">
            {application.status === "active" && interview.status !== "confirmed" && (
              <Link
                href={`/app/hire/candidats/${application.id}/entretien?entretien=${interview.id}`}
                className="t-bt t-sec t-m t-press"
              >
                {t("prep.newTimes")}
              </Link>
            )}
            {interview.status === "confirmed" && past && (
              <>
                <form action={closeInterviewAction}>
                  <input type="hidden" name="interview" value={interview.id} />
                  <input type="hidden" name="outcome" value="done" />
                  <button type="submit" className="t-bt t-sec t-m t-press">
                    {t("prep.markDone")}
                  </button>
                </form>
                <form action={closeInterviewAction}>
                  <input type="hidden" name="interview" value={interview.id} />
                  <input type="hidden" name="outcome" value="no_show" />
                  <button type="submit" className="t-bt t-sec t-m t-press">
                    {t("prep.markNoShow", { firstName })}
                  </button>
                </form>
              </>
            )}
            {!past && (
              <form action={cancelInterviewAction} className="t-ri-vnew">
                <input type="hidden" name="interview" value={interview.id} />
                <label htmlFor="ri-motif">{t("prep.cancelReason", { firstName })}</label>
                <div className="t-verre t-saisie">
                  <textarea id="ri-motif" name="reason" rows={2} maxLength={1000} />
                </div>
                <button type="submit" className="t-bt t-sec t-d t-m t-press">
                  {t("prep.cancel")}
                </button>
              </form>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}
