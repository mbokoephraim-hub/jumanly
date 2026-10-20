import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { Alert, Button, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { requestDocumentAction } from "@/server/actions/hire";
import { sendTemplateMessageAction } from "@/server/actions/hire-messages";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { getOrgApplication, HireError } from "@/server/services/hire";
import {
  fillTemplate,
  organizationTemplate,
  TEMPLATE_BODY_MAX,
  templateKinds,
  type TemplateKind,
} from "@/server/services/message-templates";

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
  // A decision has its own screen (lot 3): the message is read there before it leaves.
  if (kind === "refus" || kind === "acceptation")
    redirect(`${candidateHref}/decision?issue=${kind === "refus" ? "rejected" : "hired"}`);

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
                  href={
                    tile.kind === "refus" || tile.kind === "acceptation"
                      ? `${candidateHref}/decision?issue=${tile.kind === "refus" ? "rejected" : "hired"}`
                      : `${page}?modele=${tile.kind}`
                  }
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

  // The text: the one being edited, else the organization's template, else Jumanly's own text.
  const own = await organizationTemplate(db, ctx, kind);
  const values = { firstName, jobTitle: job.title, company, signer: user.name };
  const edited = typeof query.texte === "string" ? query.texte.slice(0, TEMPLATE_BODY_MAX) : null;
  const ownText = own ? fillTemplate(own.body, values) : null;
  const title = t("message.titleFor", { kind: t(`kind.${kind}`), name: person.name });

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
