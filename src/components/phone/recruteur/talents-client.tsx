"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import {
  rhConnectAction,
  rhCreatePoolAction,
  rhDeletePoolAction,
  rhHideTalentAction,
  rhProposeTalentAction,
  rhRenamePoolAction,
  rhReportTalentAction,
  rhSavePoolsAction,
  rhShareTalentAction,
} from "@/server/actions/phone-rh-talents";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { levelOf } from "./level";

/** « + Nouvelle liste » of the tab Vivier (planche 104): a name, then the list exists. */
export function RhNewPool() {
  const t = useTranslations("phoneRhTalents");
  const tc = useTranslations("phone");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="nb-rh-nouvelle" onClick={() => setOpen(true)}>
        <PhoneIcon name="plus" size={20} stroke={2.2} />
        {t("pools.new")}
      </button>
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t("pools.new")}
        closeLabel={tc("close")}
      >
        <form action={rhCreatePoolAction} className="nb-rh-decision">
          <h2 className="nb-rh-feuille-t">{t("pools.new")}</h2>
          <label className="nb-meta" htmlFor="rh-t-liste">
            {t("pools.nameLabel")}
          </label>
          <input
            id="rh-t-liste"
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder={t("pools.namePlaceholder")}
            className="nb-rh-zone"
          />
          <button type="submit" className="nb-bp">
            {t("pools.create")}
          </button>
          <button type="button" className="nb-annuler" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </button>
        </form>
      </PhoneSheet>
    </>
  );
}

/** The options of one list (planche 105 shows none; kept from the computer): rename, delete. */
export function RhPoolOptions({ poolId, name }: { poolId: string; name: string }) {
  const t = useTranslations("phoneRhTalents");
  const tc = useTranslations("phone");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="nb-rond nb-rh-plus-menu"
        aria-label={t("pool.options")}
        onClick={() => setOpen(true)}
      >
        <PhoneIcon name="plusOptions" size={24} stroke={3} />
      </button>
      <PhoneSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t("pool.options")}
        closeLabel={tc("close")}
      >
        <form action={rhRenamePoolAction} className="nb-rh-decision">
          <h2 className="nb-rh-feuille-t">{t("pool.options")}</h2>
          <input type="hidden" name="pool" value={poolId} />
          <label className="nb-meta" htmlFor="rh-t-renommer">
            {t("pool.rename")}
          </label>
          <input
            id="rh-t-renommer"
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={name}
            className="nb-rh-zone"
          />
          <button type="submit" className="nb-bp">
            {t("pool.renameSave")}
          </button>
        </form>
        <form action={rhDeletePoolAction} className="nb-rh-decision">
          <input type="hidden" name="pool" value={poolId} />
          <p className="nb-meta">{t("pool.deleteNote")}</p>
          <button type="submit" className="nb-bp" data-danger>
            {t("pool.delete")}
          </button>
        </form>
      </PhoneSheet>
    </>
  );
}

type Tab = "profil" | "parcours" | "realisations";
const TABS: Tab[] = ["profil", "parcours", "realisations"];
type Sheet = "why" | "propose" | "pool" | "menu" | "share" | "report" | null;
const REASONS = ["impersonation", "inappropriate", "spam", "harassment", "other"] as const;

export type RhTalentData = {
  profileId: string;
  userId: string;
  name: string;
  initials: string;
  tint: string;
  line1: string;
  line2: string;
  mobility: string | null;
  back: string;
  connect: "none" | "sent" | "connected" | "self";
  score: { label: string; value: number; band: string; job: string } | null;
  noOffer: string | null;
  why: {
    title: string;
    line: string;
    rows: { label: string; value: string; share: number }[];
    locked: string | null;
    notUsed: string;
  } | null;
  proposalLine: string | null;
  manage: boolean;
  primary:
    | { kind: "propose" }
    | { kind: "link"; label: string; href: string }
    | { kind: "off"; label: string }
    | null;
  offers: { id: string; title: string; score: number | null }[];
  offerDefault: string | null;
  messageFor: Record<string, string>;
  pools: { id: string; name: string; count: number; has: boolean }[] | null;
  members: { id: string; name: string; initials: string; sub: string }[];
  pdfHref: string;
  error: string | null;
};

/**
 * A talent's profile seen by the recruiter on the phone (planches 108 to 118): the card, the score
 * and its « Pourquoi ? », the tabs, the bottom bar (vivier, « Proposer une offre »), and the sheets.
 */
export function RhTalentProfile({
  data,
  panels,
}: {
  data: RhTalentData;
  panels: Record<Tab, ReactNode>;
}) {
  const t = useTranslations("phoneRhTalents");
  const tc = useTranslations("phone");
  const [tab, setTab] = useState<Tab>("profil");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [offer, setOffer] = useState<string | null>(data.offerDefault);
  const [message, setMessage] = useState(
    data.offerDefault ? (data.messageFor[data.offerDefault] ?? "") : "",
  );
  const [reason, setReason] = useState<(typeof REASONS)[number]>("impersonation");
  const close = () => setSheet(null);

  return (
    <div className="nb-page nb-rh-detail nb-rh-talent">
      <div className="nb-rh-t-ban" aria-hidden />
      <header className="nb-rh-t-barre">
        <Link href={data.back} className="nb-rond" aria-label={t("profile.back")}>
          <PhoneIcon name="retour" size={20} />
        </Link>
        <button
          type="button"
          className="nb-rond"
          aria-label={t("profile.more", { name: data.name })}
          onClick={() => setSheet("menu")}
        >
          <PhoneIcon name="plusOptions" size={24} stroke={3} />
        </button>
      </header>
      {data.error ? (
        <p className="nb-erreur nb-rh-marge" role="alert">
          {data.error}
        </p>
      ) : null}
      <section className="nb-rh-t-id" aria-labelledby="rh-t-nom">
        <span className="nb-rh-ini nb-rh-ini-xl" data-teinte={data.tint} aria-hidden>
          {data.initials}
        </span>
        <h1 id="rh-t-nom">{data.name}</h1>
        {data.line1 ? <p>{data.line1}</p> : null}
        {data.line2 ? <p className="nb-meta">{data.line2}</p> : null}
        {data.mobility ? <p className="nb-rh-t-mob">{data.mobility}</p> : null}
      </section>
      {data.connect !== "self" ? (
        <form action={rhConnectAction} className="nb-rh-marge">
          <input type="hidden" name="id" value={data.userId} />
          <input type="hidden" name="retour" value={`/app/hire/talents/${data.profileId}`} />
          <button
            type="submit"
            className="nb-bp nb-rh-t-connect"
            disabled={data.connect !== "none"}
          >
            {data.connect === "sent"
              ? t("profile.connectSent")
              : data.connect === "connected"
                ? t("profile.connected")
                : t("profile.connect")}
          </button>
        </form>
      ) : null}
      {data.score ? (
        <button
          type="button"
          className="nb-rh-f-carte nb-rh-t-score"
          onClick={() => setSheet("why")}
        >
          <span className="nb-rh-pct nb-rh-pct-l" data-niveau={levelOf(data.score.value)}>
            {data.score.label}
          </span>
          <span className="nb-rh-res-t">
            <b>{data.score.band}</b>
            <span className="nb-meta">{t("profile.match.with", { job: data.score.job })}</span>
          </span>
          <span className="nb-rh-pourquoi">{t("profile.why")}</span>
        </button>
      ) : data.noOffer ? (
        <p className="nb-meta nb-rh-marge">{data.noOffer}</p>
      ) : null}
      {data.proposalLine ? <p className="nb-rh-t-prop">{data.proposalLine}</p> : null}
      <div className="nb-rh-f-onglets" role="tablist" aria-label={t("profile.tabs.label")}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`rh-t-${key}`}
            aria-selected={tab === key}
            aria-controls={`rh-t-p-${key}`}
            onClick={() => setTab(key)}
          >
            {t(`profile.tabs.${key}`)}
          </button>
        ))}
      </div>
      {TABS.map((key) => (
        <div
          key={key}
          role="tabpanel"
          id={`rh-t-p-${key}`}
          aria-labelledby={`rh-t-${key}`}
          hidden={tab !== key}
          className="nb-rh-f-panneau"
        >
          {panels[key]}
        </div>
      ))}

      {data.manage ? (
        <div className="nb-bas nb-rh-f-bas">
          {data.pools ? (
            <button
              type="button"
              className="nb-rh-f-ecrire"
              aria-label={t("profile.pool", { name: data.name })}
              aria-pressed={data.pools.some((pool) => pool.has)}
              onClick={() => setSheet("pool")}
            >
              <PhoneIcon name="signet" size={22} />
            </button>
          ) : null}
          {data.primary?.kind === "propose" ? (
            <button type="button" className="nb-bp" onClick={() => setSheet("propose")}>
              {t("profile.propose")}
            </button>
          ) : data.primary?.kind === "link" ? (
            <Link href={data.primary.href} className="nb-bp">
              {data.primary.label}
            </Link>
          ) : data.primary?.kind === "off" ? (
            <span className="nb-bp" aria-disabled="true">
              {data.primary.label}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Pourquoi ce score (planche 109) */}
      {data.why && data.score ? (
        <PhoneSheet
          open={sheet === "why"}
          onClose={close}
          label={data.why.title}
          closeLabel={tc("close")}
        >
          <div className="nb-rh-why-h">
            <span className="nb-rh-pct nb-rh-pct-l" data-niveau={levelOf(data.score.value)}>
              {data.score.label}
            </span>
            <span>
              <h2>{data.why.title}</h2>
              <p className="nb-meta">{data.why.line}</p>
            </span>
          </div>
          {data.why.rows.map((row) => (
            <div key={row.label} className="nb-rh-why-l">
              <p>
                <span>{row.label}</span>
                <span className="nb-meta">{row.value}</span>
              </p>
              <span className="nb-rh-jauge" aria-hidden>
                <i
                  style={{ width: `${row.share * 100}%` }}
                  data-plein={row.share >= 0.9 ? "" : undefined}
                />
              </span>
            </div>
          ))}
          {data.why.locked ? <p className="nb-meta">{data.why.locked}</p> : null}
          <p className="nb-meta nb-rh-why-n">{data.why.notUsed}</p>
          <button type="button" className="nb-annuler" onClick={close}>
            {tc("close")}
          </button>
        </PhoneSheet>
      ) : null}

      {/* Proposer une offre (planche 112) */}
      {data.primary?.kind === "propose" ? (
        <PhoneSheet
          open={sheet === "propose"}
          onClose={close}
          label={t("propose.title", { name: data.name })}
          closeLabel={tc("close")}
        >
          <form action={rhProposeTalentAction} className="nb-rh-decision">
            <h2 className="nb-rh-feuille-t">{t("propose.title", { name: data.name })}</h2>
            <p className="nb-meta">{t("propose.sub")}</p>
            <input type="hidden" name="profile" value={data.profileId} />
            {data.offers.length === 0 ? (
              <p className="nb-meta">{t("propose.noOffer")}</p>
            ) : (
              <>
                <p className="nb-meta">{t("propose.offer")}</p>
                <div className="nb-rh-choix-l" role="radiogroup" aria-label={t("propose.offer")}>
                  {data.offers.map((item) => (
                    <label key={item.id} className="nb-rh-choix-o">
                      <input
                        type="radio"
                        name="job"
                        value={item.id}
                        checked={offer === item.id}
                        onChange={() => {
                          setOffer(item.id);
                          setMessage(data.messageFor[item.id] ?? message);
                        }}
                      />
                      <span>
                        <b>{item.title}</b>
                        <span className="nb-meta">
                          {item.score !== null
                            ? t("propose.compatible", { score: item.score })
                            : t("propose.later")}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
            <label className="nb-meta" htmlFor="rh-t-message">
              {t("propose.message")}
            </label>
            <textarea
              id="rh-t-message"
              name="message"
              required
              minLength={20}
              maxLength={2000}
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="nb-rh-zone"
            />
            <button type="submit" className="nb-bp" disabled={data.offers.length === 0}>
              {t("propose.send")}
            </button>
            <button type="button" className="nb-annuler" onClick={close}>
              {tc("cancel")}
            </button>
          </form>
        </PhoneSheet>
      ) : null}

      {/* Ajouter au vivier (planche 113) */}
      {data.pools ? (
        <PhoneSheet
          open={sheet === "pool"}
          onClose={close}
          label={t("pool.sheet", { name: data.name })}
          closeLabel={tc("close")}
        >
          <form action={rhSavePoolsAction} className="nb-rh-decision">
            <h2 className="nb-rh-feuille-t">{t("pool.sheet", { name: data.name })}</h2>
            <input type="hidden" name="profile" value={data.profileId} />
            <div className="nb-rh-cases">
              {data.pools.map((pool) => (
                <label key={pool.id} className="nb-rh-coche">
                  <input type="checkbox" name="pool" value={pool.id} defaultChecked={pool.has} />
                  <span>
                    <b>{pool.name}</b>
                    <span className="nb-meta">{t("pool.people", { count: pool.count })}</span>
                  </span>
                </label>
              ))}
            </div>
            <label className="nb-meta" htmlFor="rh-t-nouvelle">
              {t("pool.newList")}
            </label>
            <input
              id="rh-t-nouvelle"
              name="nouvelle"
              maxLength={80}
              placeholder={t("pools.namePlaceholder")}
              className="nb-rh-zone"
            />
            <button type="submit" className="nb-bp">
              {t("pool.save")}
            </button>
            <button type="button" className="nb-annuler" onClick={close}>
              {tc("cancel")}
            </button>
          </form>
        </PhoneSheet>
      ) : null}

      {/* « ··· » (planche 114) */}
      <PhoneSheet
        open={sheet === "menu"}
        onClose={close}
        label={data.name}
        closeLabel={tc("close")}
      >
        <p className="nb-meta nb-rh-feuille-sur">{data.name}</p>
        <div className="nb-rh-menu">
          <button type="button" className="nb-rh-menu-l" onClick={() => setSheet("share")}>
            <b>{t("menu.share")}</b>
            <span className="nb-meta">{t("menu.shareSub")}</span>
          </button>
          <a href={data.pdfHref} download className="nb-rh-menu-l">
            <b>{t("menu.pdf")}</b>
            <span className="nb-meta">{t("menu.pdfSub")}</span>
          </a>
          {data.manage ? (
            <form action={rhHideTalentAction}>
              <input type="hidden" name="profile" value={data.profileId} />
              <button type="submit" className="nb-rh-menu-l">
                <b>{t("menu.hide")}</b>
                <span className="nb-meta">{t("menu.hideSub")}</span>
              </button>
            </form>
          ) : null}
          <button
            type="button"
            className="nb-rh-menu-l"
            data-danger=""
            onClick={() => setSheet("report")}
          >
            <b>{t("menu.report")}</b>
            <span className="nb-meta">{t("menu.reportSub")}</span>
          </button>
        </div>
        <button type="button" className="nb-annuler" onClick={close}>
          {tc("cancel")}
        </button>
      </PhoneSheet>

      {/* Partager le profil à un collègue */}
      <PhoneSheet
        open={sheet === "share"}
        onClose={close}
        label={t("share.title")}
        closeLabel={tc("close")}
      >
        <form action={rhShareTalentAction} className="nb-rh-decision">
          <h2 className="nb-rh-feuille-t">{t("share.title")}</h2>
          <input type="hidden" name="profile" value={data.profileId} />
          {data.members.length === 0 ? (
            <p className="nb-meta">{t("share.none")}</p>
          ) : (
            <>
              <p className="nb-meta">{t("share.who")}</p>
              <div className="nb-rh-choix-l">
                {data.members.map((member, index) => (
                  <label key={member.id} className="nb-rh-choix-o">
                    <input
                      type="radio"
                      name="member"
                      value={member.id}
                      defaultChecked={index === 0}
                    />
                    <span className="nb-rh-ini" aria-hidden>
                      {member.initials}
                    </span>
                    <span>
                      <b>{member.name}</b>
                      {member.sub ? <span className="nb-meta">{member.sub}</span> : null}
                    </span>
                  </label>
                ))}
              </div>
              <button type="submit" className="nb-bp">
                {t("share.send")}
              </button>
            </>
          )}
          <button type="button" className="nb-annuler" onClick={close}>
            {tc("cancel")}
          </button>
        </form>
      </PhoneSheet>

      {/* Signaler ce profil */}
      <PhoneSheet
        open={sheet === "report"}
        onClose={close}
        label={t("report.title")}
        closeLabel={tc("close")}
      >
        <form action={rhReportTalentAction} className="nb-rh-decision">
          <h2 className="nb-rh-feuille-t">{t("report.title")}</h2>
          <input type="hidden" name="profile" value={data.profileId} />
          <input type="hidden" name="reason" value={reason} />
          <div className="nb-rh-puces-c" role="radiogroup" aria-label={t("report.title")}>
            {REASONS.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={reason === key}
                className="nb-pilule"
                onClick={() => setReason(key)}
              >
                {t(`report.reason.${key}`)}
              </button>
            ))}
          </div>
          <p className="nb-meta">{t("report.note")}</p>
          <button type="submit" className="nb-bp">
            {t("report.send")}
          </button>
          <button type="button" className="nb-annuler" onClick={close}>
            {tc("cancel")}
          </button>
        </form>
      </PhoneSheet>
    </div>
  );
}
