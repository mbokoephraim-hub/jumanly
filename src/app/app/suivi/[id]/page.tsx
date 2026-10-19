import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Logo, toneOf } from "@/components/talent/art";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon, type TalentIconName } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { SlotPicker, type PickerDay } from "@/components/talent/slot-picker";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { formatDayMonth } from "@/lib/dates";
import { shortName } from "@/lib/short-name";
import { localParts, zoneCity } from "@/lib/slots";
import { answerDocumentAction, answerInterviewAction } from "@/server/actions/connect";
import { withdrawAction } from "@/server/actions/jobs";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { sentAttachments } from "@/server/services/application-attachments";
import { LINK_VISIBLE_HOURS, SLOTS_MAX } from "@/server/services/interviews";
import { suiviApplication } from "@/server/services/suivi";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("candidature");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

const DAYS_AHEAD = 14;
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

/** Step of the history, from a recorded event (only the kinds a talent may see). */
function eventStep(type: string, payload: unknown) {
  const toKind = (payload as { toKind?: string } | null)?.toKind;
  if (type === "submitted") return "sent";
  if (type === "viewed") return "viewed";
  if (type === "withdrawn") return "withdrawn";
  if (type === "decision") return toKind === "hired" ? "hired" : "notSelected";
  return (
    { screening: "shortlisted", test: "test", interview: "interview", offer: "offer" }[
      toKind ?? ""
    ] ?? "moved"
  );
}

/**
 * One application (planche talent-2 § 3): one screen for the invitation, the preparation, the
 * history, what was sent, the messages and the documents the recruiter asks for. The notes of
 * the recruiting team never reach this page (only the events a talent may see).
 */
export default async function ApplicationPage({
  params,
  searchParams,
}: PageProps<"/app/suivi/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/app/suivi/${id}`);
  const application = await suiviApplication(db, user.id, id);
  if (!application) notFound();
  const t = await getTranslations();
  const d = dynamic(t);
  const format = await getFormatter();
  const now = new Date();
  const company = application.job.organization.name;
  const status = application.talentStatus;
  const active = application.status === "active";
  const conversationId = application.conversation?.id ?? "";
  const interview = application.interviews[0] ?? null;
  const timeZone = interview?.timezone ?? "Africa/Kinshasa";
  const futureSlots = interview?.slots.filter((slot) => slot > now) ?? [];
  const attachments = sentAttachments(application.attachments);
  const cv = (application.cvSnapshot ?? null) as { title?: string } | null;
  const documents = await db.document.findMany({
    where: { kind: { in: ["cv", "other", "bio"] }, profile: { userId: user.id } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  });

  const day = (date: Date) =>
    format
      .dateTime(date, { weekday: "short", day: "numeric", timeZone })
      .replace(/^./, (c) => c.toUpperCase());
  const hour = (date: Date) =>
    format.dateTime(date, { hour: "2-digit", minute: "2-digit", timeZone });
  const mode = interview
    ? t(`connect.invite.mode.${interview.mode === "audio" ? "call" : interview.mode}`)
    : "";
  const hidden = (answer: string) => (
    <>
      <input type="hidden" name="conversation" value={conversationId} />
      <input type="hidden" name="interview" value={interview?.id ?? ""} />
      <input type="hidden" name="application" value={application.id} />
      <input type="hidden" name="answer" value={answer} />
      <input type="hidden" name="from" value="suivi" />
    </>
  );

  // History, newest first: the events, and the interview proposed or confirmed.
  type Step = { key: string; icon: TalentIconName; title: string; line: string; now?: boolean };
  const steps: Step[] = application.events.map((event) => {
    const step = eventStep(event.type, event.payload);
    const stage = (event.payload as { to?: string } | null)?.to ?? "";
    return {
      key: event.id,
      icon: "valider",
      title:
        step === "moved" ? t("candidature.step.moved", { stage }) : d(`candidature.step.${step}`),
      line:
        step === "viewed"
          ? t("candidature.step.viewedLine", { date: formatDayMonth(event.createdAt) })
          : formatDayMonth(event.createdAt),
    };
  });
  if (interview && (interview.status === "pending" || interview.status === "reschedule"))
    steps.unshift({
      key: "entretien",
      icon: "entretien",
      title: t("candidature.step.interviewProposed"),
      line: formatDayMonth(interview.updatedAt),
      now: true,
    });
  if (interview?.status === "confirmed" && interview.startsAt)
    steps.unshift({
      key: "entretien",
      icon: "entretien",
      title: t("candidature.step.interviewConfirmed"),
      line: `${day(interview.startsAt)} · ${hour(interview.startsAt)}`,
      now: true,
    });
  if (steps[0] && !steps.some((step) => step.now) && active) steps[0].now = true;

  const pickerDays: PickerDay[] = Array.from({ length: DAYS_AHEAD }, (_, index) => {
    const date = new Date(now.getTime() + (index + 1) * 86_400_000);
    return {
      value: localParts(date, timeZone).day,
      weekday: format.dateTime(date, { weekday: "short", timeZone }),
      day: format.dateTime(date, { day: "numeric", timeZone }),
      long: format.dateTime(date, { weekday: "long", day: "numeric", month: "long", timeZone }),
      short: format.dateTime(date, { weekday: "short", day: "numeric", month: "short", timeZone }),
    };
  });
  const tp = (key: string, values?: Record<string, string | number>) =>
    t(`talent.suivi.confirm.propose.${key}` as never, values as never);

  const ok = typeof query.ok === "string" ? query.ok : null;
  const linkVisible =
    interview?.startsAt &&
    interview.link &&
    interview.startsAt.getTime() - now.getTime() <= LINK_VISIBLE_HOURS * 3_600_000;

  return (
    <div className="t-flux">
      <FlowHead
        back="/app/suivi"
        backLabel={t("candidature.back")}
        title={t("candidature.title")}
        end={
          <SheetButton
            target="ca-options"
            className="t-bi t-press"
            label={t("candidature.options")}
          >
            <TalentIcon name="plus-options" size="s" />
          </SheetButton>
        }
      />
      {ok === "confirme" && <Notice tone="ok">{t("candidature.ok.confirmed")}</Notice>}
      {ok === "propose" && <Notice tone="ok">{t("candidature.ok.proposed")}</Notice>}
      {ok === "decline" && <Notice>{t("candidature.ok.declined")}</Notice>}
      {ok === "document" && <Notice tone="ok">{t("candidature.ok.document")}</Notice>}
      {query.erreur === "entretien" && <Notice tone="err">{t("connect.invite.error")}</Notice>}
      {query.erreur === "document" && <Notice tone="err">{t("candidature.error.document")}</Notice>}

      <div className="t-verre t-cd">
        <div className="t-haut">
          <Logo name={company} src={application.job.organization.logo} tone={toneOf(company)} />
          <div className="t-t">
            <Link href={`/app/jobs/${application.job.slug}`} className="t-lien">
              <b>{application.job.title}</b>
            </Link>
            <span>
              {t("candidature.sentOn", { company, date: formatDayMonth(application.createdAt) })}
            </span>
          </div>
        </div>
      </div>

      {interview && active && interview.status === "pending" && futureSlots.length > 0 && (
        <section id="entretien" aria-labelledby="ca-inv" className="t-verre t-inv">
          <span className="t-k">{t("candidature.invite.label")}</span>
          <h2 id="ca-inv" className="t-h3">
            {t("connect.invite.format", { mode, minutes: interview.durationMinutes })}
          </h2>
          <form action={answerInterviewAction} className="t-flux t-serre">
            {hidden("accept")}
            <fieldset className="t-fs">
              <legend className="sr-only">{t("connect.invite.slots")}</legend>
              <div className="t-creneaux">
                {futureSlots.slice(0, 3).map((slot, index) => (
                  <label key={slot.toISOString()} className="t-press">
                    <input
                      type="radio"
                      name="slot"
                      value={slot.toISOString()}
                      defaultChecked={index === 0}
                      required
                    />
                    <b>{day(slot)}</b>
                    {hour(slot)}
                  </label>
                ))}
              </div>
            </fieldset>
            <small className="t-pas-t">
              {t("candidature.invite.zone", { city: zoneCity(timeZone) })}
            </small>
            <div className="t-bts">
              <button type="submit" className="t-bt t-p t-m t-pl t-press">
                {t("candidature.invite.confirm")}
              </button>
              <SheetButton target="ca-autre" className="t-bt t-sec t-m t-press">
                {t("candidature.invite.other")}
              </SheetButton>
            </div>
          </form>
        </section>
      )}
      {interview && active && interview.status === "reschedule" && (
        <section id="entretien" className="t-verre t-inv">
          <span className="t-k">{t("candidature.invite.label")}</span>
          <h2 className="t-h3">{t("candidature.invite.waiting")}</h2>
          <p className="t-pas-t">
            {t("connect.invite.proposed", {
              slots: interview.proposedSlots.map((slot) => `${day(slot)} ${hour(slot)}`).join(", "),
            })}
          </p>
        </section>
      )}
      {interview && active && interview.status === "confirmed" && interview.startsAt && (
        <section id="entretien" className="t-verre t-inv">
          <span className="t-k">{t("candidature.invite.confirmedLabel")}</span>
          <h2 className="t-h3">
            {t("candidature.invite.when", {
              day: format.dateTime(interview.startsAt, {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone,
              }),
              time: hour(interview.startsAt),
            })}
          </h2>
          <p className="t-pas-t">
            {[
              t("connect.invite.format", { mode, minutes: interview.durationMinutes }),
              interview.mode === "onsite" && interview.address ? interview.address : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="t-bts">
            {linkVisible ? (
              <a
                href={interview.link!}
                className="t-bt t-p t-m t-pl t-press"
                target="_blank"
                rel="noreferrer"
              >
                {t("connect.invite.join")}
              </a>
            ) : null}
            <a
              href={`/app/suivi/entretiens/${interview.id}/agenda`}
              className="t-bt t-sec t-m t-press"
            >
              {t("candidature.invite.calendar")}
            </a>
          </div>
          {interview.mode !== "onsite" && !linkVisible && (
            <small className="t-pas-t">
              {t("connect.invite.link", { hours: LINK_VISIBLE_HOURS })}
            </small>
          )}
        </section>
      )}

      {active && (interview || status === "interview") && (
        <Link
          href={`/app/career/entretiens/nouveau?candidature=${application.id}`}
          className="t-verre t-prep t-press"
        >
          <OrbiMark size={40} />
          <span className="t-t">
            <b>{t("candidature.prepare.title")}</b>
            <span>{t("candidature.prepare.line")}</span>
          </span>
          <TalentIcon name="suivant" size="s" />
        </Link>
      )}

      {steps.length > 0 && (
        <section aria-label={t("candidature.history")} className="t-verre t-carte">
          <ol className="t-chrono">
            {steps.map((step) => (
              <li key={step.key} className={cx("t-e", step.now ? "t-now" : "t-ok")}>
                <i aria-hidden>
                  <TalentIcon name={step.icon} size="xs" />
                </i>
                <div className="t-t">
                  <b>{step.title}</b>
                  <span>{step.line}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="ca-dossier" className="t-flux t-serre">
        <div className="t-sec-t">
          <h2 id="ca-dossier">{t("candidature.file.title")}</h2>
        </div>
        <ul className="t-verre t-liste t-lignes">
          <li className="t-li">
            <span className="t-cases t-c2" aria-hidden>
              <TalentIcon name="cv" size="s" />
            </span>
            <div className="t-t">
              <a href={`/app/jobs/candidatures/${application.id}/cv`} className="t-lien">
                <b>
                  {cv?.title ? t("apply.review.cv", { title: cv.title }) : t("apply.cv.profile")}
                </b>
              </a>
              <span>
                {cv?.title
                  ? t("candidature.file.frozen", { date: formatDayMonth(application.createdAt) })
                  : t("apply.cv.profileLine")}
              </span>
            </div>
            <TalentIcon name="suivant" size="s" />
          </li>
          {application.coverLetter && (
            <li className="t-li">
              <span className="t-cases t-c1" aria-hidden>
                <TalentIcon name="document" size="s" />
              </span>
              <div className="t-t">
                <SheetButton target="ca-lettre" className="t-lien">
                  <b>{t("apply.docs.letter")}</b>
                </SheetButton>
              </div>
              <TalentIcon name="suivant" size="s" />
            </li>
          )}
          {attachments.map((item, index) => (
            <li key={index} className="t-li">
              <span className="t-cases t-c1" aria-hidden>
                <TalentIcon
                  name={item.type === "certificate" ? "certificat" : "document"}
                  size="s"
                />
              </span>
              <div className="t-t">
                {item.type === "certificate" ? (
                  <Link href={`/attestations/${item.code}`} className="t-lien">
                    <b>{item.title}</b>
                  </Link>
                ) : (
                  <SheetButton target={`ca-doc-${index}`} className="t-lien">
                    <b>{item.title}</b>
                  </SheetButton>
                )}
              </div>
              <TalentIcon name="suivant" size="s" />
            </li>
          ))}
        </ul>
      </section>

      {conversationId && (
        <section aria-labelledby="ca-msg" className="t-flux t-serre">
          <div className="t-sec-t">
            <h2 id="ca-msg">{t("candidature.messages.title")}</h2>
            <Link href={`/app/messages/${conversationId}`}>{t("candidature.messages.open")}</Link>
          </div>
          <div className="t-verre t-liste t-lignes">
            <div className="t-li">
              <Logo
                name={company}
                src={application.job.organization.logo}
                tone={toneOf(company)}
                className="t-lg-s"
              />
              <div className="t-t">
                <Link href={`/app/messages/${conversationId}`} className="t-lien">
                  <b>
                    {application.lastMessage?.senderName
                      ? `${shortName(application.lastMessage.senderName)} · ${company}`
                      : company}
                  </b>
                </Link>
                <span>{application.lastMessage?.body || t("candidature.messages.none")}</span>
              </div>
              {application.lastMessage && (
                <span className="t-v">{hour(application.lastMessage.createdAt)}</span>
              )}
            </div>
          </div>
        </section>
      )}

      {application.requests.length > 0 && active && (
        <section id="demandes" aria-labelledby="ca-dem" className="t-flux t-serre">
          <div className="t-sec-t">
            <h2 id="ca-dem">{t("candidature.requests.title")}</h2>
          </div>
          {application.requests.map((request) => (
            <div key={request.id} className="t-verre t-pj">
              <span className="t-cases t-oppo" aria-hidden>
                <TalentIcon name="document" size="s" />
              </span>
              <div className="t-t">
                <b>{request.name}</b>
                {request.due && (
                  <span>
                    {t("candidature.requests.due", { date: formatDayMonth(request.due) })}
                  </span>
                )}
              </div>
              <SheetButton target={`ca-dem-${request.id}`} className="t-bt t-p t-s t-press">
                {t("candidature.requests.add")}
              </SheetButton>
            </div>
          ))}
        </section>
      )}

      {active && (
        <SheetButton target="ca-retrait" className="t-sig t-press">
          <TalentIcon name="fermer" size="xs" />
          {t("candidature.withdraw.cta")}
        </SheetButton>
      )}

      {/* ─── Sheets ─── */}
      <Sheet id="ca-options" title={t("candidature.options")} closeLabel={t("offer.close")}>
        <div className="t-verre t-liste">
          <Link href={`/app/jobs/${application.job.slug}`} className="t-li t-press">
            <span className="t-cases t-c2" aria-hidden>
              <TalentIcon name="offre" size="s" />
            </span>
            <span className="t-t">
              <b>{t("candidature.seeOffer")}</b>
            </span>
            <TalentIcon name="suivant" size="s" />
          </Link>
          {conversationId && (
            <Link href={`/app/messages/${conversationId}`} className="t-li t-press">
              <span className="t-cases t-c2" aria-hidden>
                <TalentIcon name="message" size="s" />
              </span>
              <span className="t-t">
                <b>{t("candidature.messages.open")}</b>
              </span>
              <TalentIcon name="suivant" size="s" />
            </Link>
          )}
          {active && (
            <SheetButton target="ca-retrait" className="t-li t-press">
              <span className="t-cases t-c3" aria-hidden>
                <TalentIcon name="fermer" size="s" />
              </span>
              <span className="t-t">
                <b>{t("candidature.withdraw.cta")}</b>
              </span>
            </SheetButton>
          )}
        </div>
      </Sheet>

      {application.coverLetter && (
        <Sheet id="ca-lettre" title={t("apply.docs.letter")} closeLabel={t("offer.close")}>
          <p className="t-texte-l">{application.coverLetter}</p>
        </Sheet>
      )}
      {attachments.map((item, index) =>
        item.type === "document" ? (
          <Sheet
            key={index}
            id={`ca-doc-${index}`}
            title={item.title}
            closeLabel={t("offer.close")}
          >
            <p className="t-texte-l">{item.text}</p>
          </Sheet>
        ) : null,
      )}

      {interview && interview.status === "pending" && (
        <Sheet
          id="ca-autre"
          title={tp("title")}
          closeLabel={t("offer.close")}
          openParam="proposer"
          defaultOpen={query.proposer === "1"}
        >
          <form action={answerInterviewAction} className="t-flux">
            {hidden("propose")}
            <p className="t-vide-t">{tp("hint", { max: SLOTS_MAX, city: zoneCity(timeZone) })}</p>
            <SlotPicker
              days={pickerDays}
              hours={HOURS.map((value) => ({
                value: `${String(value).padStart(2, "0")}:00`,
                label: tp("hour", { hour: value }),
              }))}
              initial={[]}
              max={SLOTS_MAX}
              labels={{
                days: tp("days"),
                hours: tp("hours"),
                chosen: tp("chosen", { count: "{count}", max: "{max}" }),
                item: tp("item", { day: "{day}", hour: "{hour}" }),
                remove: tp("remove", { slot: "{slot}" }),
                full: tp("full", { max: SLOTS_MAX }),
              }}
            />
            <div className="t-champ">
              <label htmlFor="ca-propose-message">{tp("message")}</label>
              <textarea id="ca-propose-message" name="message" rows={3} maxLength={1000} />
            </div>
            <button type="submit" className="t-bt t-p t-pl t-press">
              {tp("send")}
            </button>
          </form>
        </Sheet>
      )}

      {application.requests.map((request) => (
        <Sheet
          key={request.id}
          id={`ca-dem-${request.id}`}
          title={request.name}
          closeLabel={t("offer.close")}
        >
          {documents.length === 0 ? (
            <div className="t-flux t-serre">
              <p className="t-vide-t">{t("candidature.requests.none")}</p>
              <Link href={`/app/messages/${conversationId}`} className="t-bt t-sec t-pl t-press">
                {t("candidature.messages.open")}
              </Link>
            </div>
          ) : (
            <form action={answerDocumentAction} className="t-flux">
              <input type="hidden" name="conversation" value={conversationId} />
              <input type="hidden" name="request" value={request.id} />
              <input type="hidden" name="application" value={application.id} />
              <input type="hidden" name="from" value="suivi" />
              <fieldset className="t-fs">
                <legend className="t-lab-c">{t("candidature.requests.choose")}</legend>
                <div className="t-choix">
                  {documents.map((document, index) => (
                    <label key={document.id} className="t-verre t-ch">
                      <input
                        type="radio"
                        name="document"
                        value={document.id}
                        defaultChecked={index === 0}
                      />
                      <span className="t-t">
                        <b>{document.title}</b>
                      </span>
                      <span className="t-radio" aria-hidden />
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit" className="t-bt t-p t-pl t-press">
                {t("candidature.requests.send")}
              </button>
            </form>
          )}
        </Sheet>
      ))}

      {active && (
        <Sheet
          id="ca-retrait"
          title={t("candidature.withdraw.title")}
          closeLabel={t("offer.close")}
        >
          <form action={withdrawAction} className="t-flux">
            <input type="hidden" name="id" value={application.id} />
            <p className="t-vide-t">{t("candidature.withdraw.text", { company })}</p>
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t("candidature.withdraw.confirm")}
            </button>
          </form>
        </Sheet>
      )}
    </div>
  );
}
