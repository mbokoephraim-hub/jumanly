import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CopyField } from "@/components/partner/copy-field";
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Checkbox,
  EmptyState,
  Table,
  Td,
  TextArea,
  TextField,
  Th,
} from "@/components/ui";
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

const statusTone = {
  upcoming: "neutral",
  active: "lime",
  expired: "neutral",
  exhausted: "sapin",
} as const;

/** Licences (partie 07 § 5): codes, an invitation link and e-mail invitations, per batch. */
export default async function PartnerLicensesPage({
  searchParams,
}: PageProps<"/app/partenaire/licences">) {
  const query = await searchParams;
  const value = (key: string) => (typeof query[key] === "string" ? (query[key] as string) : "");
  const number = (key: string) => Number(value(key)) || 0;
  const { ctx } = await requirePartner("/app/partenaire/licences");
  const t = await getTranslations("partner.licenses");
  const batches = await listBatches(db, ctx);
  const batch = batches.find((item) => item.id === value("lot")) ?? batches[0];

  if (!batch) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-h1">{t("title")}</h1>
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
  const ok = value("ok");
  const okText =
    ok === "codes"
      ? t("codes.generated", { count: number("n") })
      : ok === "revoque"
        ? t("codes.revoked")
        : ok === "lien"
          ? t("link.created")
          : ok === "lienOff"
            ? t("link.disabled")
            : ok === "relance"
              ? t("invites.resent", { count: number("n") })
              : ok === "invitations"
                ? t("import.sent", { count: number("sent") })
                : null;
  const hidden = <input type="hidden" name="batchId" value={batch.id} />;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("title")}</h1>
        <p className="text-ardoise">{t("subtitle")}</p>
      </header>
      {errorText && <Alert tone="error" title={errorText} />}
      {okText && (
        <Alert tone="success" title={okText}>
          {ok === "invitations" && (
            <ul className="text-sm">
              <li>{t("import.invalid", { count: number("invalid") })}</li>
              <li>{t("import.duplicates", { count: number("doublons") })}</li>
              <li>{t("import.alreadyInvited", { count: number("deja") })}</li>
            </ul>
          )}
        </Alert>
      )}

      {batches.length > 1 && (
        <nav aria-label={t("batch.select")} className="flex flex-wrap gap-3">
          {batches.map((item) => (
            <Link
              key={item.id}
              href={`/app/partenaire/licences?lot=${item.id}`}
              aria-current={item.id === batch.id ? "page" : undefined}
              className={item.id === batch.id ? "font-semibold" : "underline"}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      )}

      <section className="flex flex-col gap-2 rounded-card bg-blanc p-6" aria-labelledby="lot">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="lot" className="text-h2">
            {batch.name}
          </h2>
          <Badge tone={statusTone[batch.status]}>{t(`batch.status.${batch.status}`)}</Badge>
        </div>
        <p>{t("batch.plan", { plan: batch.plan.name })}</p>
        <p>{t("batch.period", { start: batch.startsAt, end: batch.endsAt })}</p>
        <p>{t("batch.duration", { months: batch.months })}</p>
        <p className="font-medium">
          {t("batch.usage", { activated: batch.activated, total: batch.seats })} ·{" "}
          {t("batch.available", { count: open ? batch.available : 0 })}
        </p>
        <p className="text-sm text-ardoise">{t("batch.more")}</p>
      </section>

      <section id="codes" aria-labelledby="codes-title" className="flex flex-col gap-4">
        <h2 id="codes-title" className="text-h2">
          {t("codes.title")}
        </h2>
        <p className="text-ardoise">{t("codes.desc")}</p>
        {open && batch.available > 0 && (
          <form
            action={generateCodesAction}
            className="flex flex-wrap items-end gap-3 rounded-card bg-blanc p-4"
          >
            {hidden}
            <TextField
              id="codes-quantity"
              name="quantity"
              type="number"
              min={1}
              max={Math.min(MAX_CODES, batch.available)}
              defaultValue={1}
              label={t("codes.quantity.text")}
              hint={t("codes.quantity.max", { max: Math.min(MAX_CODES, batch.available) })}
              required
            />
            <TextField
              id="codes-label"
              name="label"
              maxLength={80}
              label={t("codes.label.text")}
              placeholder={t("codes.label.placeholder")}
            />
            <Button type="submit">{t("codes.generate")}</Button>
          </form>
        )}
        {codes.length === 0 ? (
          <p className="text-sm text-ardoise">{t("codes.empty")}</p>
        ) : (
          <>
            <ButtonLink
              href={`/app/partenaire/licences/codes?lot=${batch.id}`}
              prefetch={false}
              size="sm"
              variant="secondary"
              className="self-start"
            >
              {t("codes.download")}
            </ButtonLink>
            <Table caption={t("codes.title")}>
              <thead>
                <tr>
                  <Th>{t("codes.col.code")}</Th>
                  <Th>{t("codes.col.label")}</Th>
                  <Th>{t("codes.col.status")}</Th>
                  <Th>{t("codes.col.created")}</Th>
                  <Th>
                    <span className="sr-only">{t("codes.revoke.text")}</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {codes.slice(0, 200).map((code) => (
                  <tr key={code.id}>
                    <Td className="font-mono">{code.code}</Td>
                    <Td>{code.label}</Td>
                    <Td>{t(`codes.status.${code.status}`)}</Td>
                    <Td>{formatDate(code.createdAt)}</Td>
                    <Td>
                      {code.status === "available" && (
                        <form action={revokeCodeAction}>
                          {hidden}
                          <input type="hidden" name="id" value={code.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="tertiary"
                            aria-label={`${t("codes.revoke.text")} ${code.code}`}
                            title={t("codes.revoke.confirm")}
                          >
                            {t("codes.revoke.text")}
                          </Button>
                        </form>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className="text-sm text-ardoise">{t("codes.usedNote")}</p>
          </>
        )}
      </section>

      <section id="lien" aria-labelledby="link-title" className="flex flex-col gap-4">
        <h2 id="link-title" className="text-h2">
          {t("link.title")}
        </h2>
        <p className="text-ardoise">{t("link.desc")}</p>
        <Alert tone="warning" title={t("link.warning")} />
        {open && batch.available > 0 && (
          <form
            action={createLinkAction}
            className="flex flex-wrap items-end gap-3 rounded-card bg-blanc p-4"
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
            <TextField id="link-expires" name="expiresAt" type="date" label={t("link.expires")} />
            <Button type="submit">{t("link.create")}</Button>
          </form>
        )}
        {links.length === 0 ? (
          <p className="text-sm text-ardoise">{t("link.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {links.map((link) => {
              const live = !link.disabledAt && (!link.expiresAt || link.expiresAt > now) && open;
              return (
                <li key={link.id} className="flex flex-col gap-2 rounded-card bg-blanc p-4">
                  {live ? (
                    <CopyField
                      id={`link-${link.id}`}
                      label={t("link.address")}
                      value={`${siteUrl()}/activer?lien=${link.token}`}
                      copyLabel={t("link.copy")}
                      copiedLabel={t("link.copied")}
                    />
                  ) : (
                    <p className="font-medium">{t("link.disabled")}</p>
                  )}
                  <p className="text-sm">
                    {t("link.uses", { used: link.uses, max: link.maxUses })}
                    {link.expiresAt &&
                      ` · ${t("link.expiresOn", { date: formatDate(link.expiresAt) })}`}
                  </p>
                  {live && (
                    <form action={disableLinkAction}>
                      {hidden}
                      <input type="hidden" name="id" value={link.id} />
                      <Button type="submit" size="sm" variant="tertiary">
                        {t("link.disable")}
                      </Button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="import" aria-labelledby="import-title" className="flex flex-col gap-4">
        <h2 id="import-title" className="text-h2">
          {t("import.title")}
        </h2>
        <p className="text-ardoise">{t("import.desc")}</p>
        {open && batch.available > 0 && (
          <form
            action={inviteEmailsAction}
            className="flex flex-col gap-4 rounded-card bg-blanc p-4"
          >
            {hidden}
            <p className="text-sm">{t("import.format")}</p>
            <a
              href={`data:text/csv;charset=utf-8,${encodeURIComponent("email;prenom\n")}`}
              download="modele-invitations.csv"
              className="self-start text-sm underline"
            >
              {t("import.template")}
            </a>
            <div className="flex flex-col gap-1">
              <label htmlFor="import-file" className="text-label">
                {t("import.file")}
              </label>
              <input id="import-file" name="file" type="file" accept=".csv,text/csv" />
            </div>
            <TextArea id="import-emails" name="emails" rows={3} label={t("import.manual")} />
            <Checkbox id="import-consent" name="consent" label={t("import.consent")} required />
            <p className="text-sm text-ardoise">{t("import.privacy")}</p>
            <Button type="submit" className="self-start">
              {t("import.upload")}
            </Button>
          </form>
        )}
        <div className="flex flex-col gap-2 rounded-card bg-blanc p-4">
          <h3 className="font-semibold">{t("invites.title")}</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {(["sent", "activated", "expired"] as const).map((key) => (
              <div key={key} className="contents">
                <dt>{t(`invites.status.${key}`)}</dt>
                <dd className="font-semibold">{invitations[key]}</dd>
              </div>
            ))}
          </dl>
          {open && invitations.sent > 0 && (
            <form action={resendInvitationsAction}>
              {hidden}
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                title={t("invites.resend.confirm", { count: invitations.sent })}
              >
                {t("invites.resend.text")}
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
