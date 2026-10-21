import { getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { countryName } from "@/config/countries";
import { cx } from "@/lib/cx";
import { switchSpace } from "@/server/actions/hire";
import { cancelJoinAction, requestJoinAction, respondJoinAction } from "@/server/actions/org-join";
import { db } from "@/server/db";
import type { HireContext } from "@/server/services/hire";
import { joinCandidates, myJoinRequest, pendingJoinRequests } from "@/server/services/org-join";
import { initialsOf } from "./candidates";

/**
 * « Votre organisation est peut-être déjà sur Jumanly » (planches recruteur-4 § 5 `REJ1`, `REJ2`):
 * in the first steps, the organization matched by the e-mail domain or the name, and « Demander à
 * rejoindre »; once asked, the waiting card with « Annuler la demande »; once accepted, the way in.
 */
export async function JoinExisting({
  userId,
  email,
  orgName,
  answer,
}: {
  userId: string;
  email: string;
  orgName: string;
  answer?: string;
}) {
  const t = await getTranslations("orgJoin");
  const tw = await getTranslations("hireWeb.join");
  const now = new Date();
  const current = await myJoinRequest(db, userId, now);
  const notices = (
    <>
      {answer === "envoyee" && <Notice tone="ok">{t("sent")}</Notice>}
      {answer === "annulee" && <Notice>{t("cancelled")}</Notice>}
      {answer === "erreur" && <Notice tone="err">{t("error")}</Notice>}
    </>
  );
  if (current) {
    const org = current.organization;
    const days = Math.max(1, Math.ceil((current.expiresAt.getTime() - now.getTime()) / 86_400_000));
    return (
      <section className="t-flux t-serre t-rw-rej" aria-labelledby="rej-t">
        {notices}
        {current.status === "pending" && (
          <ol className="t-verre t-rw-web t-rw-rejst" aria-label={tw("stepsAria")}>
            <li className="t-ok">
              <b>{tw("step1")}</b>
              <span>{tw("step1Text", { org: org.name })}</span>
            </li>
            <li className="t-en">
              <b>{tw("step2")}</b>
              <span>{tw("step2Text", { days })}</span>
            </li>
            <li>
              <b>{tw("step3")}</b>
              <span>{tw("step3Text")}</span>
            </li>
          </ol>
        )}
        <div className="t-verre t-r6-org">
          <span className="t-r6-lg" aria-hidden>
            {initialsOf(org.name)}
          </span>
          <div className="t-t">
            <b id="rej-t">{org.name}</b>
            <span>
              {current.status === "pending"
                ? t("waiting", { days })
                : current.status === "accepted"
                  ? t("accepted")
                  : t("declined")}
            </span>
          </div>
          <span
            className={cx(
              "t-r6-ret",
              current.status === "pending" && "t-am",
              current.status === "declined" && "t-off",
            )}
          >
            {t(`status.${current.status as "pending"}`)}
          </span>
        </div>
        {current.status === "pending" ? (
          <form action={cancelJoinAction}>
            <input type="hidden" name="request" value={current.id} />
            <button type="submit" className="t-bt t-sec t-pl t-press">
              {t("cancel")}
            </button>
          </form>
        ) : current.status === "accepted" ? (
          <form action={switchSpace}>
            <input type="hidden" name="space" value={org.id} />
            <input type="hidden" name="suite" value="/app/hire" />
            <button type="submit" className="t-bt t-p t-pl t-press">
              {t("open", { org: org.name })}
            </button>
          </form>
        ) : null}
        <p className="t-gar">
          <TalentIcon name="confidentialite" size="s" />
          <span>{t("ownKept")}</span>
        </p>
      </section>
    );
  }
  const candidates = await joinCandidates(db, { userId, email, orgName });
  if (candidates.length === 0) return answer ? notices : null;
  return (
    <section className="t-flux t-serre t-rw-rej" aria-labelledby="rej-t">
      {notices}
      <h2 id="rej-t" className="t-lab-c">
        {t("title")}
      </h2>
      {candidates.map((org) => (
        <div key={org.id} className="t-verre t-r6-org">
          <span className="t-r6-lg" aria-hidden>
            {initialsOf(org.name)}
          </span>
          <div className="t-t">
            <b>
              {org.name}
              {org.verified && <span className="t-r6-ret">{t("verified")}</span>}
            </b>
            <span>
              {[org.city, org.country ? countryName(org.country) : null, org.sector]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <span>
              {t(org.matchedBy === "domain" ? "byDomain" : "byName")} ·{" "}
              {t("members", { count: org.members })}
            </span>
          </div>
          <form action={requestJoinAction}>
            <input type="hidden" name="organization" value={org.id} />
            <button type="submit" className="t-bt t-p t-s t-press">
              {t("ask")}
            </button>
          </form>
        </div>
      ))}
      <p className="t-gar">
        <TalentIcon name="confidentialite" size="s" />
        <span>{t("rule")}</span>
      </p>
    </section>
  );
}

/**
 * The requests an administrator answers (planche `REJ_ADM`, in Notifications): the person, how
 * the organization was found, the seats left, the role to give, Accepter / Refuser.
 */
export async function JoinRequestsCard({ ctx, answer }: { ctx: HireContext; answer?: string }) {
  const t = await getTranslations("orgJoin.admin");
  const data = await pendingJoinRequests(db, ctx);
  const notice =
    answer === "accepted" ? (
      <Notice tone="ok">{t("acceptedOk")}</Notice>
    ) : answer === "declined" ? (
      <Notice>{t("declinedOk")}</Notice>
    ) : answer === "seats" ? (
      <Notice tone="err">{t("seats")}</Notice>
    ) : answer ? (
      <Notice tone="err">{t("error")}</Notice>
    ) : null;
  if (!data) return notice;
  const left = data.seats.max === null ? null : Math.max(0, data.seats.max - data.seats.used);
  return (
    <section id="demandes" className="t-flux t-serre" aria-labelledby="rej-adm-t">
      {notice}
      <h2 id="rej-adm-t" className="t-lab-c">
        {t("title", { count: data.requests.length })}
      </h2>
      {data.requests.map((request) => (
        <form key={request.id} action={respondJoinAction} className="t-verre t-r6-req">
          <input type="hidden" name="request" value={request.id} />
          <div className="t-h">
            <span className="t-rc-av t-a" aria-hidden>
              {initialsOf(request.name)}
            </span>
            <div className="t-t">
              <b>{request.name}</b>
              <span>
                {t(request.matchedBy === "domain" ? "byDomain" : "byName", {
                  domain: `@${request.domain}`,
                })}
              </span>
            </div>
            <span className="t-r6-ret t-am">{t("pending")}</span>
          </div>
          <div className="t-champ">
            <label htmlFor={`rej-role-${request.id}`}>{t("role")}</label>
            <span className="t-verre t-saisie">
              <select id={`rej-role-${request.id}`} name="role" defaultValue="recruiter">
                {data.roles.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role as "recruiter"}`)}
                  </option>
                ))}
              </select>
            </span>
          </div>
          <p className="t-r6-sous">
            {left === null
              ? t("seatsUnlimited")
              : left > 0
                ? t("seatsLeft", { count: left })
                : t("seatsNone")}
          </p>
          <div className="t-rx-feuille-bts">
            <button type="submit" name="answer" value="decline" className="t-bt t-sec t-m t-press">
              {t("decline")}
            </button>
            <button
              type="submit"
              name="answer"
              value="accept"
              className="t-bt t-p t-press"
              disabled={left === 0}
            >
              {t("accept")}
            </button>
          </div>
        </form>
      ))}
    </section>
  );
}
