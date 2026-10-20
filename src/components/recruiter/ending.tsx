import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { OrbiMark } from "@/components/talent/orbi-mark";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { formatDayMonth } from "@/lib/dates";
import { closeEndingJobAction, prolongJobAction } from "@/server/actions/job-reminders";
import { db } from "@/server/db";
import { hirePermissions, type HireContext } from "@/server/services/hire";
import { endingOffers, prolongOptions } from "@/server/services/job-reminders";

/**
 * « Fin de l'offre dans 3 jours » (planche recruteur-4 6 bis `FIN`, `FIN_PROL`, `FIN_CLO`): in
 * Notifications, each offer closing within 7 days with its figures and four actions. Without an
 * action, the offer closes on its date.
 */
export async function EndingOffers({ ctx, answer }: { ctx: HireContext; answer?: string }) {
  const t = await getTranslations("jobEnding");
  const format = await getFormatter();
  const now = new Date();
  const offers = await endingOffers(db, ctx, now);
  const manage = hirePermissions(ctx.role).manage;
  const notice =
    answer === "prolongee" ? (
      <Notice tone="ok">{t("ok.prolonged")}</Notice>
    ) : answer === "cloturee" ? (
      <Notice tone="ok">{t("ok.closed")}</Notice>
    ) : answer === "erreur" ? (
      <Notice tone="err">{t("error")}</Notice>
    ) : null;
  if (offers.length === 0) return notice;
  const minDate = new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10);
  const maxDate = new Date(now.getTime() + 180 * 86_400_000).toISOString().slice(0, 10);
  return (
    <>
      {notice}
      {offers.map((offer) => (
        <section
          key={offer.id}
          id={`fin-${offer.id}`}
          className="t-r6-fin"
          aria-labelledby={`fin-${offer.id}-t`}
        >
          <div className="t-h">
            <span className="t-r6-cd" aria-hidden>
              <b>{offer.days === 0 ? t("lastDay") : t("badge", { days: offer.days })}</b>
            </span>
            <div className="t-t">
              <b id={`fin-${offer.id}-t`}>{t("title", { days: offer.days })}</b>
              <span>{offer.title}</span>
              <small>{t("closes", { date: formatDayMonth(offer.closesAt) })}</small>
            </div>
          </div>
          <dl className="t-r6-kp">
            <div>
              <dd>{format.number(offer.figures.applications)}</dd>
              <dt>{t("applications", { count: offer.figures.applications })}</dt>
            </div>
            <div>
              <dd>{format.number(offer.figures.views)}</dd>
              <dt>{t("views", { count: offer.figures.views })}</dt>
            </div>
            <div>
              <dd>{format.number(offer.figures.interviews)}</dd>
              <dt>{t("interviews", { count: offer.figures.interviews })}</dt>
            </div>
          </dl>
          <ul className="t-verre t-liste t-lignes">
            {offer.figures.applications > 0 && (
              <li>
                <Link href={`/app/hire/offres/${offer.id}/ats`} className="t-li t-press">
                  <span className="t-cases t-c1" aria-hidden>
                    <OrbiMark size={20} />
                  </span>
                  <span className="t-t">
                    <b>{t("analyse")}</b>
                    <span>{t("analyseText", { count: offer.figures.applications })}</span>
                  </span>
                  <TalentIcon name="suivant" size="s" />
                </Link>
              </li>
            )}
            <li>
              <Link href={`/app/hire/offres/${offer.id}`} className="t-li t-press">
                <span className="t-cases t-c2" aria-hidden>
                  <TalentIcon name="progression" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("stats")}</b>
                  <span>{t("statsText")}</span>
                </span>
                <TalentIcon name="suivant" size="s" />
              </Link>
            </li>
            {manage && (
              <>
                <li>
                  <SheetButton target={`fin-prol-${offer.id}`} className="t-li t-press">
                    <span className="t-cases t-c3" aria-hidden>
                      <TalentIcon name="agenda" size="s" />
                    </span>
                    <span className="t-t">
                      <b>{t("prolong")}</b>
                      <span>{t("prolongText")}</span>
                    </span>
                    <TalentIcon name="suivant" size="s" />
                  </SheetButton>
                </li>
                <li>
                  <SheetButton target={`fin-clo-${offer.id}`} className="t-li t-press">
                    <span className="t-cases" aria-hidden>
                      <TalentIcon name="fermer" size="s" />
                    </span>
                    <span className="t-t">
                      <b>{t("close")}</b>
                      <span>{t("closeText")}</span>
                    </span>
                    <TalentIcon name="suivant" size="s" />
                  </SheetButton>
                </li>
              </>
            )}
          </ul>
          {manage && (
            <>
              <Sheet
                id={`fin-prol-${offer.id}`}
                title={t("prolongTitle")}
                closeLabel={t("closeSheet")}
              >
                <form action={prolongJobAction} className="t-flux">
                  <input type="hidden" name="job" value={offer.id} />
                  <p className="t-r6-sous">{offer.title}</p>
                  <fieldset className="t-r6-qop t-r6-pr">
                    <legend className="sr-only">{t("prolongTitle")}</legend>
                    {prolongOptions.map((days, index) => (
                      <label key={days} className="t-press">
                        <input
                          type="radio"
                          name="days"
                          value={String(days)}
                          defaultChecked={index === 1}
                          className="sr-only"
                        />
                        <span className="t-t">
                          <b>{t("plus", { days })}</b>
                          <span>
                            {t("until", {
                              date: formatDayMonth(
                                new Date(offer.closesAt.getTime() + days * 86_400_000),
                              ),
                            })}
                          </span>
                        </span>
                        <span className="t-rd" aria-hidden />
                      </label>
                    ))}
                    <label className="t-press">
                      <input type="radio" name="days" value="date" className="sr-only" />
                      <span className="t-t">
                        <b>{t("otherDate")}</b>
                        <input
                          type="date"
                          name="until"
                          min={minDate}
                          max={maxDate}
                          aria-label={t("otherDate")}
                          className="t-r6-date"
                        />
                      </span>
                      <span className="t-rd" aria-hidden />
                    </label>
                  </fieldset>
                  {offer.atsAtClose && <p className="t-gar">{t("atsFollows")}</p>}
                  <button type="submit" className="t-bt t-p t-pl t-press">
                    {t("prolongConfirm")}
                  </button>
                </form>
              </Sheet>
              <Sheet
                id={`fin-clo-${offer.id}`}
                title={t("closeTitle")}
                closeLabel={t("closeSheet")}
              >
                <form action={closeEndingJobAction} className="t-flux">
                  <input type="hidden" name="job" value={offer.id} />
                  <fieldset className="t-r6-qop">
                    <legend className="sr-only">{t("closeTitle")}</legend>
                    <label className="t-press">
                      <input
                        type="radio"
                        name="mode"
                        value="cloturer"
                        defaultChecked
                        className="sr-only"
                      />
                      <span className="t-cases t-g-former" aria-hidden>
                        <TalentIcon name="valider" size="s" />
                      </span>
                      <span className="t-t">
                        <b>{t("closeNow")}</b>
                        <span>{t("closeNowText", { count: offer.figures.applications })}</span>
                      </span>
                      <span className="t-rd" aria-hidden />
                    </label>
                    <label className="t-press">
                      <input type="radio" name="mode" value="annuler" className="sr-only" />
                      <span className="t-cases" aria-hidden>
                        <TalentIcon name="fermer" size="s" />
                      </span>
                      <span className="t-t">
                        <b>{t("cancel")}</b>
                        <span>{t("cancelText")}</span>
                      </span>
                      <span className="t-rd" aria-hidden />
                    </label>
                  </fieldset>
                  <p className="t-gar">
                    <TalentIcon name="horloge" size="s" />
                    <span>{t("letEnd", { date: formatDayMonth(offer.closesAt) })}</span>
                  </p>
                  <button type="submit" className="t-bt t-p t-pl t-press">
                    {t("closeConfirm")}
                  </button>
                </form>
              </Sheet>
            </>
          )}
        </section>
      ))}
    </>
  );
}
