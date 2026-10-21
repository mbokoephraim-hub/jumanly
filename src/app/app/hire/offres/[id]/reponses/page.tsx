import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { GroupReplyForm } from "@/components/recruiter/group-reply";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { cx } from "@/lib/cx";
import { initialsOf } from "@/components/recruiter/candidates";
import { sendGroupReplyAction, undoGroupReplyAction } from "@/server/actions/hire-ats";
import { db } from "@/server/db";
import { requireHire } from "@/server/hire-context";
import { HireError } from "@/server/services/hire";
import {
  batchState,
  replyGroups,
  replyRecipients,
  type ReplyGroup,
} from "@/server/services/hire-group-replies";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hireReplies");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/**
 * « Répondre aux candidats » (brief recruteur § 2.18, planches `ENV`, `ENV_OK`): the retained or
 * the others of one offer, the template, the channels, the previews, « J'ai relu », the
 * confirmation; after sending, the count and « Annuler » for 10 minutes. Orbi only prepares the
 * template: the member reads, changes and sends (golden rule n° 3).
 */
export default async function GroupRepliesPage({
  params,
  searchParams,
}: PageProps<"/app/hire/offres/[id]/reponses">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { ctx, space, user } = await requireHire(`/app/hire/offres/${id}/reponses`, "manage");
  const t = await getTranslations("hireReplies");
  const tw = await getTranslations("hireWeb.replies");
  const ts = await getTranslations("hireReplies.strength");
  const groupParam = one(query.groupe);
  const group: ReplyGroup = replyGroups.find((item) => item === groupParam) ?? "retenus";
  const ids = (one(query.ids) ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const [main, retained, others] = await Promise.all([
    replyRecipients(db, ctx, id, group, ids),
    group === "selection" ? null : replyRecipients(db, ctx, id, "retenus"),
    group === "selection" ? null : replyRecipients(db, ctx, id, "non-retenus"),
  ]).catch((error) => {
    if (error instanceof HireError) notFound();
    throw error;
  });
  const { job, people } = main;
  const back = `/app/hire/offres/${job.id}/retenus`;
  const sentId = one(query.envoye);
  const sent = sentId ? await batchState(db, ctx, job.id, sentId) : null;
  const error = one(query.erreur);
  const rejecting = group === "non-retenus";
  const company = space.organization.name;

  if (sent && sentId) {
    const undone = one(query.annule) === "1" || sent.undone;
    const minutes = Math.ceil(sent.leftMs / 60000);
    return (
      <div className="t-flux t-r6">
        <FlowHead back={back} backLabel={t("back")} title={t("title")} />
        <div className="t-verre t-rc-vide t-r6-ok" role="status">
          <span className={cx("t-rc-rond", !undone && "t-r6-okr")} aria-hidden>
            <TalentIcon name={undone ? "horloge" : "valider"} />
          </span>
          <b>{undone ? t("sent.undoneTitle") : t("sent.title", { count: sent.count })}</b>
          <span>
            {undone
              ? t("sent.undoneText")
              : sent.rejecting
                ? t("sent.textRejected", { count: sent.count })
                : t("sent.textRetained", { count: sent.count })}
          </span>
        </div>
        {one(query.annule) === "0" && <Notice tone="err">{t("sent.expired")}</Notice>}
        {!undone && sent.leftMs > 0 && (
          <form action={undoGroupReplyAction} className="t-verre t-r6-undo">
            <input type="hidden" name="job" value={job.id} />
            <input type="hidden" name="batch" value={sentId} />
            <input type="hidden" name="groupe" value={group} />
            <span className="t-t">
              <b>{t("sent.undoTitle")}</b>
              <span>{t("sent.undoLeft", { minutes })}</span>
            </span>
            <button type="submit" className="t-bt t-sec t-s t-press">
              {t("sent.undo")}
            </button>
          </form>
        )}
        <div className="t-verre t-fort t-bas-f">
          <Link href={`/app/hire/offres/${job.id}/ats`} className="t-bt t-sec t-m t-press">
            {t("sent.ats")}
          </Link>
          <Link href="/app/messages" className="t-bt t-p t-pl t-press">
            <TalentIcon name="message" size="s" />
            {t("sent.messages")}
          </Link>
        </div>
      </div>
    );
  }

  const strength = (item: (typeof people)[number]["strength"]) =>
    item.key === "generic" ? ts("generic") : ts(item.key, { skill: item.skill });
  const firstName = (user.firstName || user.name).split(/\s+/)[0] ?? user.name;
  const defaultBody = t(rejecting ? "default.others" : "default.retained", {
    signer: firstName,
  }).replaceAll("\\n", "\n");
  const n = (key: string) => t(key as "form.send", { count: people.length });

  const lead = (
    <>
      {retained && others && (
        <nav className="t-r6-grp" aria-label={t("groups")}>
          {(
            [
              ["retenus", retained.people.length],
              ["non-retenus", others.people.length],
            ] as const
          ).map(([key, count]) => (
            <Link
              key={key}
              href={`/app/hire/offres/${job.id}/reponses?groupe=${key}`}
              aria-current={group === key ? "page" : undefined}
              className={cx(
                "t-verre t-press",
                group === key && "t-on",
                key === "retenus" ? "t-r6-gv" : "t-r6-gn",
              )}
            >
              <b>{t(key === "retenus" ? "group.retained" : "group.others")}</b>
              <span>{t("group.count", { count })}</span>
            </Link>
          ))}
        </nav>
      )}

      {error && (
        <Notice tone="err">
          {t(`error.${error === "reviewed" || error === "empty" ? error : "nobody"}`)}
        </Notice>
      )}
    </>
  );

  return (
    <div className="t-flux t-r6 t-large t-rw-a4 t-rw-rep">
      <FlowHead back={back} backLabel={t("back")} title={t("title")} />
      <p className="t-r6-sous">{job.title}</p>

      {people.length === 0 ? (
        <>
          <div className="t-rw-web t-rw-rh">
            <h1>{t("title")}</h1>
            <p>{job.title}</p>
          </div>
          {lead}
          <div className="t-verre t-rc-vide">
            <span className="t-rc-rond" aria-hidden>
              <TalentIcon name="message" />
            </span>
            <b>{t("empty.title")}</b>
            <span>{t(rejecting ? "empty.others" : "empty.retained")}</span>
            <Link href={`/app/hire/offres/${job.id}/ats`} className="t-bt t-p t-s t-press">
              {t("empty.cta")}
            </Link>
          </div>
        </>
      ) : (
        <GroupReplyForm
          action={sendGroupReplyAction}
          jobId={job.id}
          group={group}
          ids={group === "selection" ? people.map((item) => item.id).join(",") : ""}
          people={people.map((item) => ({
            id: item.id,
            name: item.name,
            firstName: item.firstName,
            strength: strength(item.strength),
          }))}
          defaultBody={defaultBody}
          values={{
            jobTitle: job.title,
            company,
            signer: user.name,
            initials: initialsOf(company),
          }}
          retained={!rejecting}
          labels={{
            channels: t("form.channels"),
            message: t("form.message"),
            messageLocked: t("form.messageLocked"),
            email: t("form.email"),
            template: t(rejecting ? "form.templateOthers" : "form.templateRetained"),
            variables: t("form.variables"),
            orbi: t(rejecting ? "form.orbiOthers" : "form.orbiRetained"),
            reviewed: n("form.reviewed"),
            previews: t("form.previews"),
            send: n("form.send"),
            confirmTitle: n("confirm.title"),
            confirmGroup: n(rejecting ? "confirm.groupOthers" : "confirm.groupRetained"),
            confirmChannels: t("confirm.channels"),
            confirmChannelsEmail: t("confirm.channelsEmail"),
            undo: t("confirm.undo"),
            undoText: t("confirm.undoText"),
            confirmReviewed: n("confirm.reviewed"),
            back: t("confirm.back"),
            confirm: t("confirm.send"),
            previewTitle: t("preview.title"),
            previewFor: t("preview.for", { name: "{name}" }),
            badge: t(rejecting ? "preview.badgeOthers" : "preview.badgeRetained"),
            cta: t(rejecting ? "preview.ctaOthers" : "preview.ctaRetained"),
            reply: t("preview.reply"),
            alsoEmail: t("preview.alsoEmail"),
            subject: t(rejecting ? "preview.subjectOthers" : "preview.subjectRetained", {
              job: job.title,
              company,
            }),
            previous: t("preview.previous"),
            next: t("preview.next"),
            close: t("preview.close"),
            needReviewed: t("form.needReviewed"),
            recipients: n("form.recipients"),
          }}
          lead={lead}
          web={{
            title: t("title"),
            sub: tw("sub", { job: job.title }),
            subEmail: tw("subEmail", { job: job.title }),
            previewHead: tw("previewHead", { index: "{index}", count: "{count}" }),
            peopleAria: tw("peopleAria"),
            more: tw("more", { count: "{count}" }),
            seeEmail: tw("seeEmail"),
            cancel: tw("cancel"),
            cancelHref: back,
            windowTitle: tw("windowTitle"),
            windowSub: tw("windowSub", { name: "{name}" }),
            windowSubEmail: tw("windowSubEmail", { name: "{name}" }),
            inJumanly: tw("inJumanly"),
            byEmail: tw("byEmail"),
            emailLoading: tw("emailLoading"),
            emailError: tw("emailError"),
            emailFrame: tw("emailFrame", { name: "{name}" }),
          }}
        />
      )}
    </div>
  );
}
