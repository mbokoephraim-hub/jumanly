import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import { AppPageHeader } from "@/components/app/page-header";
import { IconTile, pillClass, ScoreRing } from "@/components/career/kit";
import { CopyField } from "@/components/partner/copy-field";
import { FileDrop } from "@/components/partner/file-drop";
import { batchTag, partnerCard, partnerTitle } from "@/components/partner/kit";
import { Alert, Checkbox, EmptyState, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { siteUrl } from "@/lib/seo";
import {
  createLinkAction,
  disableLinkAction,
  generateCodesAction,
  inviteEmailsAction,
  resendInvitationsAction,
  revokeCodeAction,
} from "@/server/actions/partners";
import { db } from "@/server/db";
import { requirePartner } from "@/server/partner-context";
import {
  invitationCounts,
  listBatches,
  listCodes,
  listLinks,
  MAX_CODES,
} from "@/server/services/partners";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("partner.licenses");
  return { title: { absolute: t("title") }, robots: { index: false } };
}

/** Status tags of a code (mockup 06-02): Sapin or dark text on light tints. */
const codeTag = {
  available: "bg-lime text-sapin",
  used: "bg-gris-clair text-sapin",
  revoked: "bg-blanc text-sapin ring-[1.5px] ring-sapin ring-inset",
  expired: "bg-ambre-fond text-ambre-texte",
} as const;

const th = "px-4 py-3 text-left text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase";
const td = "px-4 py-3.5 text-[13.5px]";

/** Header of a distribution card: icon tile, title, one line of explanation. */
function CardHead({
  id,
  icon,
  tone,
  title,
  desc,
}: {
  id: string;
  icon: IconName;
  tone: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <IconTile icon={icon} tone={tone} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 id={id} className={partnerTitle}>
          {title}
        </h2>
        <p className="text-[12.5px] leading-[18px] text-ardoise">{desc}</p>
      </div>
    </div>
  );
}

/**
 * Licences (partie 07 § 5, mockup 06-02): one batch at a time, distributed by codes, an invitation
 * link and e-mail invitations. Nothing on this page says who activated a licence.
 */
export default async function PartnerLicensesPage({
  searchParams,
}: PageProps<"/app/partenaire/licences">) {
  const query = await searchParams;
  const value = (key: string) => (typeof query[key] === "string" ? (query[key] as string) : "");
  const number = (key: string) => Number(value(key)) || 0;
  const { ctx, organization } = await requirePartner("/app/partenaire/licences");
  const t = await getTranslations("partner.licenses");
  const tp = await getTranslations("partner");
  const batches = await listBatches(db, ctx);
  const batch = batches.find((item) => item.id === value("lot")) ?? batches[0];
  const header = (
    <AppPageHeader
      eyebrow={tp("dashboard.eyebrow", { org: organization.name })}
      title={t("title")}
      subtitle={t("subtitle")}
    />
  );

  if (!batch) {
    return (
      <div className="jm-page flex flex-col gap-4 lg:gap-5">
        {header}
        <EmptyState title={t("batch.none")} />
      </div>
    );
  }

  const [codes, links, invitations] = await Promise.all([
    listCodes(db, ctx, batch.id),
    listLinks(db, ctx, batch.id),
    invitationCounts(db, ctx, batch.id),
  ]);
  const open = batch.status !== "expired";
  const canDistribute = open && batch.available > 0;
  const now = new Date();
  const error = value("erreur");
  const errorText =
    error === "tooMany"
      ? query.available
        ? t("import.tooMany", { count: number("count"), available: number("available") })
        : t("codes.quantity.max", { max: number("max") })
      : error
        ? t(
            `error.${(["notFound", "batchClosed", "noneAvailable", "consent"] as const).find((code) => code === error) ?? "invalid"}`,
          )
        : null;
  const errorSection =
    error === "tooMany"
      ? query.available
        ? "import"
        : "codes"
      : error === "consent"
        ? "import"
        : "";
  const errorAt = (section: string) => !!errorText && errorSection === section;
  const ok = value("ok");
  const done = (text: string) => (
    <p
      role="status"
      className="inline-flex items-center gap-2.5 self-start rounded-[16px] bg-sapin py-2.5 pr-4 pl-2.5 text-[13px] text-blanc shadow-float"
    >
      <span aria-hidden className="grid size-7 place-items-center rounded-full bg-lime text-sapin">
        <Icon name="check" className="size-4" />
      </span>
      {text}
    </p>
  );
  const hidden = <input type="hidden" name="batchId" value={batch.id} />;
  const quantityMax = Math.min(MAX_CODES, batch.available);
  const rate = batch.seats ? Math.round((batch.activated / batch.seats) * 100) : 0;
  const liveLink = (link: (typeof links)[number]) =>
    !link.disabledAt && (!link.expiresAt || link.expiresAt > now) && open;
  const counts = [
    ["sent", invitations.sent, "bg-gris-clair text-sapin"],
    ["activated", invitations.activated, "bg-lime text-sapin"],
    ["expired", invitations.expired, "bg-ambre-fond text-ambre-texte"],
  ] as const;

  return (
    <div className="jm-page flex flex-col gap-4 lg:gap-5">
      {header}
      {errorText && !errorSection && <Alert tone="error" title={errorText} />}

      {batches.length > 1 && (
        <nav
          aria-label={t("batch.select")}
          className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
        >
          <span className="mr-1 text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase max-lg:hidden">
            {t("batch.select")}
          </span>
          {batches.map((item) => {
            const active = item.id === batch.id;
            return (
              <Link
                key={item.id}
                href={`/app/partenaire/licences?lot=${item.id}`}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "inline-flex h-11 shrink-0 items-center gap-2 rounded-pill px-4 text-[13px] font-semibold whitespace-nowrap lg:h-9",
                  active
                    ? "bg-sapin text-blanc"
                    : "bg-blanc ring-[1.5px] ring-brume ring-inset hover:bg-creme",
                )}
              >
                {item.name}
                <span className={cx("font-medium", active ? "text-neon" : "text-feuille-fonce")}>
                  {item.plan.name}
                </span>
              </Link>
            );
          })}
        </nav>
      )}

      <section
        aria-labelledby="lot"
        className="relative isolate flex flex-col gap-2 overflow-hidden rounded-[24px] bg-sapin p-5 text-blanc lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-7 lg:py-6"
      >
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url(/marque/motifs/motif-trajectoires-sombre.svg)" }}
        />
        <div className="flex min-w-0 flex-col gap-2 max-lg:contents">
          <p className="flex items-center gap-2.5">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-neon uppercase">
              {t("batch.select")}
            </span>
            <span
              className={cx(
                "inline-flex h-6 items-center rounded-pill px-2.5 text-[11.5px] font-semibold text-sapin",
                batchTag[batch.status],
              )}
            >
              {t(`batch.status.${batch.status}`)}
            </span>
          </p>
          <h2
            id="lot"
            className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em] lg:text-[26px]"
          >
            {batch.name}
          </h2>
          <ul className="flex flex-col gap-1 text-[13px] leading-5 text-blanc/90 lg:flex-row lg:flex-wrap lg:gap-x-5">
            <li className="flex items-center gap-2">
              <Icon name="certificat" className="size-4 shrink-0 text-lime" />
              {t("batch.plan", { plan: batch.plan.name })}
            </li>
            <li className="flex items-center gap-2">
              <Icon name="calendrier" className="size-4 shrink-0 text-lime" />
              {t("batch.period", { start: batch.startsAt, end: batch.endsAt })}
            </li>
            <li className="flex items-center gap-2">
              <Icon name="horloge" className="size-4 shrink-0 text-lime" />
              {t("batch.duration", { months: batch.months })}
            </li>
          </ul>
          <p className="mt-1 flex items-start gap-2 text-[12px] leading-[17px] text-blanc/80 max-lg:order-last">
            <Icon name="message" className="mt-px size-4 shrink-0 text-lime" />
            {t("batch.more")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4 max-lg:my-2">
          <ScoreRing value={rate} dark size={84} label={t("batch.rate", { percent: rate })} />
          <p className="flex flex-col">
            <span className="text-[22px] leading-7 font-semibold tracking-[-0.02em] lg:text-[24px]">
              {t("batch.usage", { activated: batch.activated, total: batch.seats })}
            </span>
            <span className="text-[12px] text-blanc/75">
              {t("batch.available", { count: open ? batch.available : 0 })}
            </span>
          </p>
        </div>
      </section>

      <section id="codes" aria-labelledby="codes-title" className={cx(partnerCard, "gap-4")}>
        <CardHead
          id="codes-title"
          icon="lock"
          tone="bg-lime"
          title={t("codes.title")}
          desc={t("codes.desc")}
        />
        {canDistribute && (
          <form
            action={generateCodesAction}
            className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[200px_minmax(0,1fr)_auto] lg:items-start"
          >
            {hidden}
            <TextField
              id="codes-quantity"
              name="quantity"
              type="number"
              min={1}
              max={quantityMax}
              defaultValue={1}
              label={t("codes.quantity.text")}
              hint={t("codes.quantity.max", { max: quantityMax })}
              required
            />
            <TextField
              id="codes-label"
              name="label"
              maxLength={80}
              label={t("codes.label.text")}
              placeholder={t("codes.label.placeholder")}
            />
            <button type="submit" className={pillClass("dark", "md", "h-12 lg:mt-[26px]")}>
              {t("codes.generate")}
            </button>
          </form>
        )}
        {errorAt("codes") && errorText && <Alert tone="error" title={errorText} />}
        {(ok === "codes" || ok === "revoque" || codes.length > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {ok === "codes" ? (
              done(t("codes.generated", { count: number("n") }))
            ) : ok === "revoque" ? (
              done(t("codes.revoked"))
            ) : (
              <span />
            )}
            {codes.length > 0 && (
              <a
                href={`/app/partenaire/licences/codes?lot=${batch.id}`}
                className={pillClass("outline", "sm", "h-11 lg:h-9")}
              >
                <Icon name="telecharger" className="size-4" />
                {t("codes.download")}
              </a>
            )}
          </div>
        )}
        {codes.length === 0 ? (
          <p className="text-[13px] text-ardoise">{t("codes.empty")}</p>
        ) : (
          <>
            <div className="overflow-hidden rounded-[18px] bg-creme">
              <table className="w-full">
                <caption className="sr-only">{t("codes.title")}</caption>
                <thead className="border-b border-brume/70 max-lg:sr-only">
                  <tr>
                    <th scope="col" className={th}>
                      {t("codes.col.code")}
                    </th>
                    <th scope="col" className={cx(th, "max-lg:hidden")}>
                      {t("codes.col.label")}
                    </th>
                    <th scope="col" className={th}>
                      {t("codes.col.status")}
                    </th>
                    <th scope="col" className={cx(th, "max-lg:hidden")}>
                      {t("codes.col.created")}
                    </th>
                    <th scope="col" className={th}>
                      <span className="sr-only">{t("codes.revoke.text")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brume/70">
                  {codes.slice(0, 200).map((code) => (
                    <tr key={code.id}>
                      <td className={cx(td, "max-lg:pr-1")}>
                        <span className="block font-mono text-[13px] font-semibold">
                          {code.code}
                        </span>
                        <span className="block text-[12px] leading-4 text-ardoise lg:hidden">
                          {[code.label, formatDate(code.createdAt)].filter(Boolean).join(" · ")}
                        </span>
                      </td>
                      <td className={cx(td, "text-ardoise max-lg:hidden")}>{code.label}</td>
                      <td className={cx(td, "max-lg:px-1")}>
                        <span
                          className={cx(
                            "inline-flex h-6 items-center rounded-pill px-2.5 text-[11.5px] font-semibold whitespace-nowrap",
                            codeTag[code.status],
                          )}
                        >
                          {t(`codes.status.${code.status}`)}
                        </span>
                      </td>
                      <td className={cx(td, "whitespace-nowrap max-lg:hidden")}>
                        {formatDate(code.createdAt)}
                      </td>
                      <td className={cx(td, "w-0 max-lg:pl-1")}>
                        {code.status === "available" && (
                          <form action={revokeCodeAction}>
                            {hidden}
                            <input type="hidden" name="id" value={code.id} />
                            <button
                              type="submit"
                              aria-label={`${t("codes.revoke.text")} ${code.code}`}
                              title={t("codes.revoke.confirm")}
                              className="inline-flex h-11 items-center gap-1.5 rounded-pill px-2 text-[13px] font-semibold whitespace-nowrap text-corail-fonce hover:bg-blanc lg:h-9"
                            >
                              <Icon name="fermer" className="size-4" />
                              <span className="max-lg:sr-only">{t("codes.revoke.text")}</span>
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="flex items-center gap-2 text-[12px] text-ardoise">
              <Icon name="eye" className="size-4 shrink-0" />
              {t("codes.usedNote")}
            </p>
          </>
        )}
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2 lg:gap-5">
        <section id="lien" aria-labelledby="link-title" className={cx(partnerCard, "gap-4")}>
          <CardHead
            id="link-title"
            icon="lien"
            tone="bg-neon/60"
            title={t("link.title")}
            desc={t("link.desc")}
          />
          {ok === "lien" && done(t("link.created"))}
          {ok === "lienOff" && done(t("link.disabled"))}
          {links.length === 0 ? (
            <p className="text-[13px] text-ardoise">{t("link.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {links.map((link) => {
                const live = liveLink(link);
                return (
                  <li key={link.id} className="flex flex-col gap-2.5">
                    {live ? (
                      <CopyField
                        id={`link-${link.id}`}
                        variant="pill"
                        label={t("link.address")}
                        value={`${siteUrl()}/activer?lien=${link.token}`}
                        copyLabel={t("link.copy")}
                        copiedLabel={t("link.copied")}
                      />
                    ) : (
                      <p className="text-[13px] font-semibold">{t("link.disabled")}</p>
                    )}
                    <p className="flex flex-wrap justify-between gap-x-3 text-[12.5px]">
                      <span className="font-medium">
                        {t("link.uses", { used: link.uses, max: link.maxUses })}
                      </span>
                      {link.expiresAt && (
                        <span className="text-ardoise">
                          {t("link.expiresOn", { date: formatDate(link.expiresAt) })}
                        </span>
                      )}
                    </p>
                    <span aria-hidden className="block h-1.5 overflow-hidden rounded-pill bg-brume">
                      <span
                        className="jm-gauge block h-full origin-left rounded-pill bg-feuille"
                        style={{
                          transform: `scaleX(${link.maxUses ? Math.min(1, link.uses / link.maxUses) : 0})`,
                        }}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="flex items-start gap-2.5 rounded-[14px] bg-ambre-fond px-4 py-3 text-[12.5px] leading-[18px] text-ambre-texte">
            <Icon name="securite" className="mt-px size-4 shrink-0" />
            {t("link.warning")}
          </p>
          <div className="flex flex-wrap items-start gap-2">
            {canDistribute && (
              <details className="open:w-full">
                <summary
                  className={pillClass(
                    "outline",
                    "sm",
                    "h-11 cursor-pointer list-none lg:h-9 [&::-webkit-details-marker]:hidden",
                  )}
                >
                  <Icon name="plus" className="size-4" />
                  {t("link.create")}
                </summary>
                <form
                  action={createLinkAction}
                  className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3 rounded-[18px] bg-creme p-4 sm:grid-cols-2"
                >
                  {hidden}
                  <TextField
                    id="link-max"
                    name="maxUses"
                    type="number"
                    min={1}
                    max={batch.available}
                    defaultValue={batch.available}
                    label={t("link.maxUses")}
                    required
                  />
                  <TextField
                    id="link-expires"
                    name="expiresAt"
                    type="date"
                    label={t("link.expires")}
                  />
                  <button type="submit" className={pillClass("dark", "md", "sm:col-span-2")}>
                    {t("link.create")}
                  </button>
                </form>
              </details>
            )}
            {links.filter(liveLink).map((link) => (
              <form key={link.id} action={disableLinkAction}>
                {hidden}
                <input type="hidden" name="id" value={link.id} />
                <button
                  type="submit"
                  className={pillClass("outline", "sm", "h-11 text-corail-fonce lg:h-9")}
                >
                  {t("link.disable")}
                </button>
              </form>
            ))}
          </div>
        </section>

        <section id="import" aria-labelledby="import-title" className={cx(partnerCard, "gap-4")}>
          <CardHead
            id="import-title"
            icon="telecharger"
            tone="bg-lime"
            title={t("import.title")}
            desc={t("import.desc")}
          />
          {errorAt("import") && errorText && <Alert tone="error" title={errorText} />}
          {ok === "relance" && done(t("invites.resent", { count: number("n") }))}
          {ok === "invitations" && (
            <div className="flex flex-col gap-2.5">
              {done(t("import.sent", { count: number("sent") }))}
              <h3 className="text-[14px] font-semibold">{t("import.preview")}</h3>
              <ul className="grid grid-cols-2 gap-2 text-[12.5px] leading-4">
                {(
                  [
                    ["valid", "valides", "check", "bg-lime-clair"],
                    ["invalid", "invalid", "fermer", "bg-down-fond"],
                    ["duplicates", "doublons", "sort", "bg-creme"],
                    ["alreadyInvited", "deja", "notification", "bg-creme"],
                  ] as const
                ).map(([key, param, icon, tone]) => (
                  <li
                    key={key}
                    className={cx("flex items-center gap-2 rounded-[12px] px-3 py-2.5", tone)}
                  >
                    <Icon name={icon} className="size-4 shrink-0" />
                    {t(`import.${key}`, { count: number(param) })}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {canDistribute && (
            <form action={inviteEmailsAction} className="flex flex-col gap-4">
              {hidden}
              <FileDrop
                id="import-file"
                name="file"
                chooseLabel={t("import.upload")}
                emptyLabel={t("import.noFile")}
                format={t("import.format")}
              >
                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent("email;prenom\n")}`}
                  download="modele-invitations.csv"
                  className={pillClass("outline", "sm", "h-11 lg:h-9")}
                >
                  {t("import.template")}
                </a>
              </FileDrop>
              <TextArea id="import-emails" name="emails" rows={2} label={t("import.manual")} />
              <Checkbox id="import-consent" name="consent" label={t("import.consent")} required />
              <button type="submit" className={pillClass("lime", "md", "w-full")}>
                <Icon name="send" className="size-4" />
                {t("import.send")}
              </button>
              <p className="text-[12px] leading-[17px] text-ardoise">{t("import.privacy")}</p>
            </form>
          )}
        </section>
      </div>

      <section
        aria-labelledby="invites-title"
        className="flex flex-col gap-3 rounded-[24px] bg-blanc p-5 lg:flex-row lg:items-center lg:gap-5 lg:px-6"
      >
        <div className="flex flex-col">
          <h2 id="invites-title" className="text-[17px] leading-6 font-semibold">
            {t("invites.title")}
          </h2>
          <p className="text-[12px] text-ardoise">{t("invites.desc")}</p>
        </div>
        <ul className="flex flex-1 flex-wrap gap-2">
          {counts.map(([key, count, tone]) => (
            <li
              key={key}
              className={cx(
                "inline-flex h-8 items-center rounded-pill px-3.5 text-[13px] font-semibold",
                tone,
              )}
            >
              {t("invites.count", { label: t(`invites.status.${key}`), count })}
            </li>
          ))}
        </ul>
        {open && invitations.sent > 0 && (
          <form action={resendInvitationsAction}>
            {hidden}
            <button
              type="submit"
              title={t("invites.resend.confirm", { count: invitations.sent })}
              className={pillClass("dark", "md", "w-full lg:w-auto")}
            >
              <Icon name="send" className="size-4" />
              {t("invites.resend.text")}
            </button>
          </form>
        )}
      </section>

      <p className="flex items-center gap-3 rounded-[18px] bg-lime-clair px-4 py-3.5 text-[13px] leading-[19px] font-medium lg:px-[18px]">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-sapin text-lime"
        >
          <Icon name="lock" className="size-[18px]" />
        </span>
        {t("import.privacy")}
      </p>
    </div>
  );
}
