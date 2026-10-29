import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo, toneOf } from "@/components/talent/art";
import { FlowHead } from "@/components/talent/flow-head";
import { TalentIcon } from "@/components/talent/icon";
import { Notice } from "@/components/talent/notice";
import { TalentReportForm } from "@/components/talent/report-form";
import { Sheet, SheetButton } from "@/components/talent/sheet";
import { cx } from "@/lib/cx";
import {
  acceptConnectionAction,
  blockConnectionAction,
  ignoreConnectionAction,
  removeConnectionAction,
  requestConnectionAction,
} from "@/server/actions/connections";
import { requireUser } from "@/server/auth/session";
import { phoneTalentRedirect } from "@/server/phone-routes";
import { db } from "@/server/db";
import {
  connectionPeer,
  listConnections,
  searchPeople,
  type Person,
} from "@/server/services/connections";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reseau");
  return { title: t("seo"), robots: { index: false } };
}

const one = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

function Who({ person, line }: { person: Person; line: string }) {
  return (
    <>
      <Logo name={person.name} src={person.image} tone={toneOf(person.name)} className="t-lg-s" />
      <span className="t-t">
        <b>{person.name}</b>
        <span>{line}</span>
      </span>
    </>
  );
}

/**
 * Connexions (planche talent-4 « Connexions »): my connections and the requests I received. One
 * writes only to an accepted connection; a request can be accepted or ignored, a connection
 * removed, blocked or reported. The search finds talents visible to recruiters under their name.
 */
export default async function ConnectionsPage({
  searchParams,
}: PageProps<"/app/compte/connexions">) {
  const params = await searchParams;
  const user = await requireUser("/app/compte/connexions");
  // Modèle B (B8, B9): connections and their requests are in Messages on a phone.
  await phoneTalentRedirect(
    user.id,
    one(params.onglet) === "demandes"
      ? "/app/messages/connexions?onglet=demandes"
      : "/app/messages/connexions?onglet=reseau",
  );
  const t = await getTranslations();
  const tab = one(params.onglet) === "demandes" ? "demandes" : "connexions";
  const q = (one(params.q) ?? "").slice(0, 80);
  const { connections, received, sent } = await listConnections(db, user.id);
  const results = q ? await searchPeople(db, user.id, q) : [];
  const chosen = connections.find((item) => item.id === one(params.personne));
  const reported = chosen ? await connectionPeer(db, user.id, chosen.id) : null;
  const back = "/app/compte/connexions";

  const line = (person: Person, withMutual = false) =>
    [
      person.title,
      withMutual && person.mutual > 0
        ? t("reseau.mutual", { count: person.mutual })
        : person.company,
    ]
      .filter(Boolean)
      .join(" · ") || t("reseau.noTitle");

  const ok = one(params.ok);
  const error = one(params.erreur);
  const signal = one(params.signalement);

  const requestRows = (
    <ul aria-label={t("reseau.received")} className="t-verre t-liste t-lignes">
      {received.map((request) => (
        <li key={request.id} className="t-li t-dem">
          <Who person={request.person} line={line(request.person, true)} />
          <div className="t-dem-a">
            <form action={acceptConnectionAction}>
              <input type="hidden" name="id" value={request.id} />
              <button
                type="submit"
                className="t-bt t-p t-s t-press"
                aria-label={t("reseau.acceptName", { name: request.person.name })}
              >
                {t("reseau.accept")}
              </button>
            </form>
            <form action={ignoreConnectionAction}>
              <input type="hidden" name="id" value={request.id} />
              <button
                type="submit"
                className="t-bt t-sec t-s t-press"
                aria-label={t("reseau.ignoreName", { name: request.person.name })}
              >
                {t("reseau.ignore")}
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );

  const requestsEmpty = <p className="t-vide-t">{t("reseau.noRequest")}</p>;

  return (
    <div className="t-flux t-w4 t-large">
      <div className="t-w4-h">
        <FlowHead
          back="/app/compte"
          backLabel={t("compte.title")}
          title={t("reseau.title")}
          end={
            <SheetButton
              target="rs-chercher"
              className="t-bi t-press"
              label={t("reseau.search.open")}
            >
              <TalentIcon name="recherche" size="s" />
            </SheetButton>
          }
        />
        <p className="t-w4-sub t-w4-web">
          {t("talentW4.connections.count", {
            count: connections.length,
            received: received.length,
          })}
        </p>
        <form action={back} className="t-verre t-rech t-w4-web t-w4-rech" role="search">
          <input type="hidden" name="chercher" value="1" />
          <TalentIcon name="recherche" size="s" />
          <label htmlFor="rs-q-web" className="sr-only">
            {t("reseau.search.label")}
          </label>
          <input
            id="rs-q-web"
            name="q"
            type="search"
            minLength={2}
            maxLength={80}
            placeholder={t("talentW4.connections.search")}
            autoComplete="off"
          />
        </form>
      </div>

      <nav aria-label={t("reseau.tabs")} className="t-seg t-w4-tel">
        <Link
          href={back}
          aria-current={tab === "connexions" ? "page" : undefined}
          className={cx(tab === "connexions" && "t-on")}
        >
          {t("reseau.tab.mine")}
          <small>{connections.length}</small>
        </Link>
        <Link
          href={`${back}?onglet=demandes`}
          aria-current={tab === "demandes" ? "page" : undefined}
          className={cx(tab === "demandes" && "t-on")}
        >
          {t("reseau.tab.requests")}
          <small>{received.length}</small>
        </Link>
      </nav>

      {ok && <Notice tone="ok">{t(`reseau.done.${okKey(ok)}`)}</Notice>}
      {error && <Notice tone="err">{t("reseau.error")}</Notice>}
      {signal === "ok" && <Notice tone="ok">{t("report.success")}</Notice>}
      {signal === "deja" && <Notice>{t("report.already")}</Notice>}

      {/* Téléphone : l'onglet choisit ; ordinateur : mes connexions à gauche, demandes à droite. */}
      <div className="t-w4-g2r t-w4-inv t-w4-cx">
        <div className="t-w4-col">
          {received.length > 0 ? (
            <section aria-labelledby="rs-recues" className="t-flux t-serre">
              <h2 id="rs-recues" className="t-ck-t t-w4-sech">
                {t("reseau.received")}
              </h2>
              {requestRows}
            </section>
          ) : (
            <section
              aria-labelledby="rs-recues"
              className={cx("t-flux t-serre", tab === "connexions" && "t-w4-web")}
            >
              <h2 id="rs-recues" className="t-ck-t t-w4-sech t-w4-web">
                {t("reseau.received")}
              </h2>
              {requestsEmpty}
            </section>
          )}
          {sent.length > 0 && (
            <section
              aria-labelledby="rs-envoyees"
              className={cx("t-flux t-serre", tab === "connexions" && "t-w4-web")}
            >
              <h2 id="rs-envoyees" className="t-ck-t t-w4-sech">
                {t("reseau.sent")}
              </h2>
              <ul className="t-verre t-liste t-lignes">
                {sent.map((request) => (
                  <li key={request.id} className="t-li">
                    <Who person={request.person} line={line(request.person, true)} />
                    <form action={removeConnectionAction}>
                      <input type="hidden" name="id" value={request.id} />
                      <button
                        type="submit"
                        className="t-bt t-sec t-s t-press"
                        aria-label={t("reseau.withdrawName", { name: request.person.name })}
                      >
                        {t("reseau.withdraw")}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="t-gar t-w4-web">
            <TalentIcon name="message" size="s" />
            <span>{t("reseau.rule")}</span>
          </p>
        </div>

        <div className="t-w4-col">
          <section
            aria-labelledby="rs-miennes"
            className={cx("t-flux t-serre", tab === "demandes" && "t-w4-web")}
          >
            <h2 id="rs-miennes" className="t-ck-t t-w4-sech">
              {t("reseau.mine")}
            </h2>
            {connections.length === 0 ? (
              <div className="t-verre t-carte t-vide">
                <b>{t("reseau.empty.title")}</b>
                <span>{t("reseau.empty.text")}</span>
                <SheetButton target="rs-chercher" className="t-bt t-sec t-s t-press">
                  {t("reseau.search.open")}
                </SheetButton>
              </div>
            ) : (
              <ul className="t-verre t-liste t-lignes t-w4-pers">
                {connections.map((connection) => (
                  <li key={connection.id} className="t-li">
                    <Link
                      href={`${back}?personne=${connection.id}`}
                      className="t-li-l t-press"
                      aria-label={t("reseau.options", { name: connection.person.name })}
                    >
                      <Who person={connection.person} line={line(connection.person)} />
                    </Link>
                    {connection.conversationId && (
                      <Link
                        href={`/app/messages/${connection.conversationId}#dernier`}
                        className="t-bi t-press"
                        aria-label={t("reseau.write", { name: connection.person.name })}
                      >
                        <TalentIcon name="message" size="s" />
                        <span className="t-w4-web" aria-hidden>
                          {t("talentW4.connections.message")}
                        </span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <p className="t-gar t-w4-tel">
        <TalentIcon name="message" size="s" />
        <span>{t("reseau.rule")}</span>
      </p>

      <Sheet
        id="rs-chercher"
        title={t("reseau.search.title")}
        closeLabel={t("offer.close")}
        openParam="chercher"
        defaultOpen={Boolean(q) || one(params.chercher) === "1"}
      >
        <form action={back} className="t-verre t-rech">
          <input type="hidden" name="chercher" value="1" />
          <TalentIcon name="recherche" size="s" />
          <label htmlFor="rs-q" className="sr-only">
            {t("reseau.search.label")}
          </label>
          <input
            id="rs-q"
            name="q"
            type="search"
            defaultValue={q}
            minLength={2}
            maxLength={80}
            placeholder={t("reseau.search.placeholder")}
            autoComplete="off"
          />
        </form>
        {q && results.length === 0 && (
          <p className="t-vide-t">{t("reseau.search.none", { query: q })}</p>
        )}
        {results.length > 0 && (
          <ul className="t-verre t-liste t-lignes">
            {results.map((person) => (
              <li key={person.userId} className="t-li">
                <Who person={person} line={line(person, true)} />
                <form action={requestConnectionAction}>
                  <input type="hidden" name="id" value={person.userId} />
                  <button
                    type="submit"
                    className="t-bt t-p t-s t-press"
                    aria-label={t("reseau.connectName", { name: person.name })}
                  >
                    {t("reseau.connect")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <p className="t-gar">
          <TalentIcon name="confidentialite" size="s" />
          <span>{t("reseau.search.privacy")}</span>
        </p>
      </Sheet>

      {chosen && (
        <Sheet
          id="rs-personne"
          title={chosen.person.name}
          closeLabel={t("offer.close")}
          openParam="personne"
          defaultOpen
        >
          <div className="t-verre t-liste">
            {chosen.conversationId && (
              <Link
                href={`/app/messages/${chosen.conversationId}#dernier`}
                className="t-li t-press"
              >
                <span className="t-cases t-c2" aria-hidden>
                  <TalentIcon name="message" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("reseau.person.write")}</b>
                </span>
              </Link>
            )}
            <form action={removeConnectionAction}>
              <input type="hidden" name="id" value={chosen.id} />
              <button type="submit" className="t-li t-press">
                <span className="t-cases" aria-hidden>
                  <TalentIcon name="supprimer" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("reseau.person.remove")}</b>
                  <span>{t("reseau.person.removeText")}</span>
                </span>
              </button>
            </form>
            {reported && (
              <SheetButton target="rs-signaler" className="t-li t-press">
                <span className="t-cases" aria-hidden>
                  <TalentIcon name="aide" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("reseau.person.report")}</b>
                </span>
              </SheetButton>
            )}
            <form action={blockConnectionAction}>
              <input type="hidden" name="id" value={chosen.id} />
              <button type="submit" className="t-li t-danger t-press">
                <span className="t-cases" aria-hidden>
                  <TalentIcon name="fermer" size="s" />
                </span>
                <span className="t-t">
                  <b>{t("reseau.person.block")}</b>
                  <span>{t("reseau.person.blockText")}</span>
                </span>
              </button>
            </form>
          </div>
        </Sheet>
      )}
      {chosen && reported && (
        <Sheet id="rs-signaler" title={t("reseau.person.report")} closeLabel={t("offer.close")}>
          <TalentReportForm targetType="profile" targetId={reported} back={back} />
        </Sheet>
      )}
    </div>
  );
}

function okKey(value: string) {
  return (
    (["envoyee", "acceptee", "ignoree", "retiree", "bloquee", "deja"] as const).find(
      (key) => key === value,
    ) ?? "envoyee"
  );
}
