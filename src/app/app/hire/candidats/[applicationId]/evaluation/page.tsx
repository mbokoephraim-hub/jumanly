import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getFormatter, getMessages, getTranslations } from "next-intl/server";
import { avatarTone, initialsOf } from "@/components/recruiter/candidates";
import { EvaluationForm } from "@/components/recruiter/evaluation-form";
import { OrbiLine } from "@/components/recruiter/offers";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { pickMessages } from "@/i18n/client-messages";
import { cx } from "@/lib/cx";
import { submitScorecardAction } from "@/server/actions/hire-advanced";
import { db } from "@/server/db";
import { can } from "@/server/entitlements";
import { requireHire } from "@/server/hire-context";
import {
  nextStepOf,
  RATING_MAX,
  scorecardCriteria,
  scorecardView,
} from "@/server/services/evaluation";
import { getOrgApplication, HireError, hirePermissions } from "@/server/services/hire";
import { cheapestPlanWhere, listPublicPlans } from "@/server/services/plans";
import { isPhone } from "@/server/view";
import { RhEvaluation } from "@/components/phone/recruteur/candidat-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireInterviews.evaluation");
  return { title: t("title"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");

/**
 * Évaluer (brief recruteur § 4 item 4, planche r2plus EVAL): the member's own evaluation of a
 * candidate after the interview. The team's evaluations show once the member sent theirs, so that
 * nobody is swayed. The suggested next step moves nothing: the decision stays a human one.
 */
export default async function EvaluationPage({
  params,
  searchParams,
}: PageProps<"/app/hire/candidats/[applicationId]/evaluation">) {
  const [{ applicationId }, query] = await Promise.all([params, searchParams]);
  const fileHref = `/app/hire/candidats/${applicationId}`;
  const { ctx } = await requireHire(`${fileHref}/evaluation`, "readApplications", "evaluate");
  const t = await getTranslations("hireInterviews.evaluation");
  const format = await getFormatter();
  const application = await getOrgApplication(db, ctx, applicationId).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const subject = { type: "organization" as const, id: ctx.organizationId };
  const [enabled, interview, messages] = await Promise.all([
    can(db, subject, "hire.scorecards"),
    db.interview.findFirst({
      where: {
        applicationId: application.id,
        organizationId: ctx.organizationId,
        startsAt: { not: null },
        status: { in: ["confirmed", "done"] },
      },
      orderBy: { startsAt: "desc" },
      select: { startsAt: true, timezone: true },
    }),
    getMessages(),
  ]);
  const back = one(query.retour) === "entretiens" ? "/app/hire/entretiens?vue=evaluer" : fileHref;
  const person = application.profile.user;
  const when = interview?.startsAt
    ? t("interviewOn", {
        date: format.dateTime(interview.startsAt, {
          day: "numeric",
          month: "long",
          timeZone: interview.timezone,
        }),
      })
    : null;
  const head = (
    <>
      <div className="t-rw-h t-rw-web">
        <div className="t-t">
          <Link href={back} className="t-rw-crumb">
            <TalentIcon name="suivant" size="xs" />
            {t("back")}
          </Link>
          <h1>{t("title")}</h1>
          <p>{[person.name, application.job.title, when].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <FlowHead back={back} backLabel={t("back")} title={t("title")} />
      <div className="t-verre t-ri-mini">
        <span className={cx("t-rc-av", avatarTone(application.id))} aria-hidden>
          {initialsOf(person.name)}
        </span>
        <span className="t-t">
          <b>{person.name}</b>
          <span>{[application.job.title, when].filter(Boolean).join(" · ")}</span>
        </span>
      </div>
    </>
  );

  if (!enabled || !hirePermissions(ctx.role).evaluate) {
    const plan = enabled
      ? null
      : cheapestPlanWhere(
          await listPublicPlans(db),
          ["rh", "company"],
          (item) => item.entitlements["hire.scorecards"] === "true",
        );
    return (
      <div className="t-flux t-rw-evp">
        {head}
        <div className="t-rc-orbi">
          <div className="t-rc-lock">
            <b>
              <OrbiMark size={22} />
              {enabled ? t("roleTitle") : t("lockedTitle")}
            </b>
            <span>
              {enabled ? t("role") : plan ? t("locked", { plan: plan.name }) : t("lockedNoPlan")}
            </span>
            {!enabled && (
              <Link href="/app/abonnement/formules" className="t-bt t-sec t-s t-press">
                {t("seePlans")}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const view = await scorecardView(db, ctx, application);
  const fromJob = scorecardCriteria(application.job);
  const criteria = fromJob.length ? fromJob : [{ name: t("general"), description: "" }];
  const ratings = Object.fromEntries(
    (view.mine?.ratings ?? []).map((item) => [item.name, String(item.rating)]),
  );
  const initial = {
    ratings,
    comment: view.mine?.comment ?? "",
    suite: view.mine ? nextStepOf(view.mine.recommendation) : "",
  };
  const yes = view.others.filter((item) => nextStepOf(item.recommendation) === "yes").length;
  const error = one(query.erreur);

  // « Entretien de … » on the recruiter's phone (Modèle B recruteur M5, planche Recruteur-evaluation).
  if (await isPhone()) {
    const tp = await getTranslations("phoneRhCandidatures.evaluation");
    const full = await db.interview.findFirst({
      where: {
        applicationId: application.id,
        organizationId: ctx.organizationId,
        startsAt: { not: null },
        status: { in: ["confirmed", "done"] },
      },
      orderBy: { startsAt: "desc" },
      select: { mode: true, organizerId: true, participantIds: true },
    });
    const others = full
      ? await db.user.findMany({
          where: {
            id: {
              in: [full.organizerId, ...full.participantIds].filter((id) => id !== ctx.userId),
            },
          },
          select: { name: true },
        })
      : [];
    const firstName = (person.firstName || person.name).split(/\s+/)[0]!;
    return (
      <NextIntlClientProvider messages={pickMessages(messages, ["phoneRhCandidatures", "phone"])}>
        <RhEvaluation
          data={{
            applicationId: application.id,
            back: fileHref,
            title: tp("title", { name: firstName }),
            line: [
              interview?.startsAt
                ? format.dateTime(interview.startsAt, {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                    timeZone: interview.timezone,
                  })
                : null,
              full ? tp(`mode.${full.mode}`) : null,
              others.length
                ? tp("with", { names: others.map((item) => item.name).join(", ") })
                : null,
            ]
              .filter(Boolean)
              .join(" · "),
            criteria: criteria.map((item) => item.name),
            max: RATING_MAX,
            initial: {
              ratings: criteria.map((item) => Number(ratings[item.name] ?? 0)),
              comment: initial.comment,
              next: (initial.suite || "yes") as "yes" | "maybe" | "no",
            },
          }}
        />
      </NextIntlClientProvider>
    );
  }

  return (
    <div className="t-flux t-ri-evalp t-rw-evp">
      {head}
      {error && (
        <p className="t-gar t-err" role="alert">
          <span>{error === "invalid" ? t("error.invalid") : t("error.other")}</span>
        </p>
      )}
      <NextIntlClientProvider messages={pickMessages(messages, ["hireInterviews"])}>
        <EvaluationForm
          action={submitScorecardAction}
          applicationId={application.id}
          back={back}
          criteria={criteria}
          initial={initial}
          max={RATING_MAX}
          draftKey={`jm-evaluation-${application.id}`}
        >
          <OrbiLine
            action={
              view.others.length > 0 ? (
                <SheetButton target="ri-equipe" className="t-bt t-sec t-s t-press">
                  {t("compare")}
                </SheetButton>
              ) : undefined
            }
          >
            {view.mine
              ? view.others.length > 0
                ? t.rich("orbi.compare", {
                    b: (chunks) => <b>{chunks}</b>,
                    yes,
                    count: view.others.length,
                  })
                : t("orbi.alone")
              : t("orbi.hidden")}
          </OrbiLine>
        </EvaluationForm>
      </NextIntlClientProvider>
      <p className="t-gar">
        <OrbiMark size={18} />
        <span>{t("guard")}</span>
      </p>

      {view.others.length > 0 && (
        <Sheet id="ri-equipe" title={t("teamTitle")} closeLabel={t("close")}>
          <ul className="t-ri-equipe-ev">
            {view.others.map((item, index) => (
              <li key={index} className="t-verre">
                <b>{item.reviewerName}</b>
                <span className={cx("t-ri-etq", `t-${nextStepOf(item.recommendation)}`)}>
                  {t(`suite.${nextStepOf(item.recommendation)}`)}
                </span>
                <span>{t("average", { value: item.average, max: RATING_MAX })}</span>
                {item.comment && <p>{item.comment}</p>}
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </div>
  );
}
