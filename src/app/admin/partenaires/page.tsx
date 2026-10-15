import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Icon, type IconName } from "@/components/brand/icon";
import {
  AdminFilterBar,
  AdminPageHeader,
  adminLabel,
  AuditNotice,
  FilterMenu,
  SectionRule,
  SensitivePanel,
  Tag,
  type TagTone,
} from "@/components/admin/kit";
import { initialsOf } from "@/components/hire/kit";
import { Alert, Button, ButtonLink, Select, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/dates";
import { formatUsd } from "@/lib/money";
import {
  createBatchAction,
  createPartnerAction,
  invitePartnerManagerAction,
} from "@/server/actions/admin";
import { canWriteAdmin, requireAdmin } from "@/server/auth/session";
import { db } from "@/server/db";
import { adminPartners, MIN_GROUP, partnerKinds } from "@/server/services/partners";

type Partner = Awaited<ReturnType<typeof adminPartners>>[number];
const contractStates = ["active", "upcoming", "ended", "none"] as const;
type ContractState = (typeof contractStates)[number];
const stateTone: Record<ContractState, TagTone> = {
  active: "success",
  upcoming: "neon",
  ended: "neutral",
  none: "outline",
};

/** Contract state of a partner, from its batches: running, to come, over, or none yet. */
function contractState(partner: Partner, now: Date): ContractState {
  const batches = partner.licenseBatches;
  if (batches.length === 0) return "none";
  if (batches.some((batch) => batch.startsAt <= now && batch.endsAt > now)) return "active";
  if (batches.some((batch) => batch.startsAt > now)) return "upcoming";
  return "ended";
}

const tileTones = [
  "bg-sapin text-lime",
  "bg-neon text-sapin",
  "bg-[#14745f] text-blanc",
  "bg-lime text-sapin",
  "bg-nuit text-neon",
];

function OrgTile({ name, size = 30 }: { name: string; size?: number }) {
  const tone = tileTones[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5];
  return (
    <span
      aria-hidden
      className={cx("grid shrink-0 place-items-center font-bold tracking-[-0.03em]", tone)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        fontSize: Math.round(size * 0.34),
      }}
    >
      {initialsOf(name)}
    </span>
  );
}

/** A read-only value drawn like a field of the mockup (label above, white pill-box). */
function ValueBox({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: IconName;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <dt className="text-[13px] leading-[18px] font-semibold">{label}</dt>
      <dd className="flex min-h-12 items-center gap-2.5 rounded-[14px] bg-blanc px-4 py-2.5 text-[14px] leading-5 ring-[1.5px] ring-brume ring-inset">
        {icon && <Icon name={icon} aria-hidden className="size-4 shrink-0" />}
        <span className="min-w-0 break-words">{children}</span>
      </dd>
    </div>
  );
}

/**
 * Partners and licence batches (mockup 07-08, partie 07 § 6): no online purchase, the admin
 * creates the partner, invites its manager and adds a batch after the contract is signed.
 */
/** « Forfait : Pro » on phones, where the column titles are hidden. */
const colon = " : ";

export default async function AdminPartners({ searchParams }: PageProps<"/admin/partenaires">) {
  const params = await searchParams;
  const admin = await requireAdmin();
  if (!admin) notFound();
  const t = await getTranslations("admin.partners");
  const tl = await getTranslations("partner.licenses.batch");
  const writable = canWriteAdmin(admin);
  const now = new Date();
  const one = (value: string | string[] | undefined) =>
    typeof value === "string" && value !== "" ? value : undefined;
  const q = one(params.q);
  const kind = partnerKinds.find((item) => item === params.type);
  const state = contractStates.find((item) => item === params.contrat);
  const action = writable
    ? (["nouveau", "lot"] as const).find((item) => item === params.action)
    : undefined;

  const [partners, plans] = await Promise.all([
    adminPartners(db),
    db.plan.findMany({
      where: { family: "talent", active: true, priceCents: { gt: 0 } },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const since = new Map(
    (
      await db.organization.findMany({
        where: { id: { in: partners.map((partner) => partner.id) } },
        select: { id: true, createdAt: true },
      })
    ).map((org) => [org.id, org.createdAt]),
  );
  const needle = q?.toLocaleLowerCase("fr");
  const shown = partners.filter(
    (partner) =>
      (!needle || partner.name.toLocaleLowerCase("fr").includes(needle)) &&
      (!kind || partner.partnerKind === kind) &&
      (!state || contractState(partner, now) === state),
  );
  const selected =
    partners.find((partner) => partner.id === one(params.id)) ?? shown[0] ?? undefined;

  const kindLabel = (value: string | null) => {
    const known = partnerKinds.find((item) => item === value);
    return known ? t(`field.type.${known}`) : "";
  };
  const href = (changes: Record<string, string | undefined>) => {
    const next: Record<string, string | undefined> = {
      q,
      type: kind,
      contrat: state,
      id: one(params.id),
      ...changes,
    };
    const search = new URLSearchParams(
      Object.entries(next).filter((entry): entry is [string, string] => Boolean(entry[1])),
    ).toString();
    return search ? `/admin/partenaires?${search}` : "/admin/partenaires";
  };
  const closeHref = href({ action: undefined, id: selected?.id });
  const today = now.toISOString().slice(0, 10);
  const kindOptions = partnerKinds.map((item) => ({ value: item, label: t(`field.type.${item}`) }));
  const okText =
    params.ok === "partenaire"
      ? t("created")
      : params.ok === "invitation"
        ? t("invited")
        : params.ok === "lot"
          ? t("batch.created")
          : null;
  const contractBatch = selected?.licenseBatches.find(
    (batch) => batch.contractRef || batch.priceCents !== null,
  );
  const panelOpen = action === "nouveau" || (action === "lot" && selected);

  return (
    <>
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />
      {okText && <Alert tone="success" title={okText} />}
      {typeof params.erreur === "string" && <Alert tone="error" title={t("error")} />}

      <AdminFilterBar
        action="/admin/partenaires"
        searchLabel={t("search")}
        q={q}
        hidden={{ type: kind, contrat: state }}
        aside={
          writable && (
            <ButtonLink
              href={href({ action: "nouveau" })}
              scroll={false}
              icon={<Icon name="plus" />}
              className="max-lg:w-full"
            >
              {t("new")}
            </ButtonLink>
          )
        }
      >
        <FilterMenu
          label={t("field.type.text")}
          group="partenaires-type"
          options={[
            {
              href: href({ type: undefined, id: undefined }),
              label: t("filter.all"),
              current: !kind,
            },
            ...partnerKinds.map((item) => ({
              href: href({ type: item, id: undefined }),
              label: t(`field.type.${item}`),
              current: kind === item,
            })),
          ]}
        />
        <FilterMenu
          label={t("contract.title")}
          group="partenaires-contrat"
          options={[
            {
              href: href({ contrat: undefined, id: undefined }),
              label: t("filter.all"),
              current: !state,
            },
            ...contractStates.map((item) => ({
              href: href({ contrat: item, id: undefined }),
              label: t(`status.${item}`),
              current: state === item,
            })),
          ]}
        />
      </AdminFilterBar>

      <div
        className={cx(
          "grid items-start gap-4",
          panelOpen && "lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]",
        )}
      >
        <div className="flex min-w-0 flex-col gap-4">
          {/* Table of partners. */}
          {shown.length === 0 ? (
            <p className="rounded-[24px] bg-blanc p-5 text-[13px] leading-5 text-ardoise">
              {t("empty")}
            </p>
          ) : (
            <div className="rounded-[24px] bg-blanc px-4 py-1.5 lg:px-0">
              <div role="table" aria-label={t("list")} className="flex flex-col">
                <div
                  role="row"
                  className={cx(
                    "hidden gap-3 px-[18px] py-2.5 lg:grid lg:grid-cols-[1.8fr_1fr_1fr_90px]",
                    adminLabel,
                  )}
                >
                  <span role="columnheader">{t("field.org")}</span>
                  <span role="columnheader">{t("field.type.text")}</span>
                  <span role="columnheader">{t("col.batches")}</span>
                  <span role="columnheader">{t("contract.title")}</span>
                </div>
                {shown.map((partner, index) => {
                  const on = partner.id === selected?.id;
                  const rowState = contractState(partner, now);
                  const summary = t("summary", {
                    batches: partner.licenseBatches.length,
                    seats: partner.licenseBatches.reduce((sum, batch) => sum + batch.seats, 0),
                  });
                  return (
                    <div
                      key={partner.id}
                      role="row"
                      className={cx(
                        "grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 border-brume py-3 text-[13px] lg:grid-cols-[1.8fr_1fr_1fr_90px] lg:gap-3 lg:border-t lg:px-[18px] lg:py-3.5",
                        index > 0 && "border-t",
                        on &&
                          "max-lg:-mx-2 max-lg:rounded-[14px] max-lg:bg-lime-clair/60 max-lg:px-2 lg:bg-lime-clair/40",
                      )}
                    >
                      <span role="cell" className="contents lg:flex lg:items-center lg:gap-2.5">
                        <OrgTile name={partner.name} />
                        <span className="flex min-w-0 flex-col">
                          <Link
                            href={href({ id: partner.id, action: undefined })}
                            scroll={false}
                            aria-current={on ? "true" : undefined}
                            className="font-semibold hover:underline"
                          >
                            {partner.name}
                          </Link>
                          <span className="text-[11px] leading-[15px] text-ardoise lg:hidden">
                            {[kindLabel(partner.partnerKind), summary].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                      </span>
                      <span role="cell" className="hidden lg:block">
                        {kindLabel(partner.partnerKind)}
                      </span>
                      <span role="cell" className="hidden lg:block">
                        {summary}
                      </span>
                      <span role="cell">
                        <Tag tone={stateTone[rowState]}>{t(`status.${rowState}`)}</Tag>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Partner sheet. */}
          {selected && (
            <section
              aria-labelledby={`partenaires-${selected.id}`}
              className="flex flex-col gap-3.5 rounded-[24px] bg-blanc p-5 lg:p-[22px]"
            >
              <div className="flex items-center gap-3">
                <OrgTile name={selected.name} size={46} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <h2
                    id={`partenaires-${selected.id}`}
                    className="text-[18px] leading-[24px] font-semibold tracking-[-0.015em] lg:text-[20px] lg:leading-[26px]"
                  >
                    {selected.name}
                  </h2>
                  {since.get(selected.id) && (
                    <p className="text-[11px] leading-[15px] text-ardoise">
                      {t("since", { date: since.get(selected.id)! })}
                    </p>
                  )}
                </div>
                {selected.partnerKind && <Tag tone="sapin">{kindLabel(selected.partnerKind)}</Tag>}
              </div>

              <dl className="flex flex-col gap-3.5">
                <ValueBox label={t("field.manager")} icon="message">
                  {selected.memberships.length
                    ? selected.memberships.map((item) => item.user.email).join(", ")
                    : t("noManager")}
                </ValueBox>
              </dl>
              {selected.invitations.length > 0 && (
                <p className="-mt-2 text-[11px] leading-[15px] text-ardoise">
                  {t("pending", {
                    emails: selected.invitations.map((item) => item.email).join(", "),
                  })}
                </p>
              )}
              {writable && (
                <form
                  action={invitePartnerManagerAction}
                  className="flex flex-col gap-2 sm:flex-row sm:items-end"
                >
                  <input type="hidden" name="organization" value={selected.id} />
                  <div className="flex-1">
                    <TextField
                      id={`partenaires-manager-${selected.id}`}
                      name="email"
                      type="email"
                      label={t("inviteManager")}
                      required
                    />
                  </div>
                  <Button type="submit" variant="secondary" className="sm:mb-1">
                    {t("invite")}
                  </Button>
                </form>
              )}

              <h3 className={cx(adminLabel, "mt-1")}>{t("contract.title")}</h3>
              {contractBatch ? (
                <>
                  <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <ValueBox label={t("contract.reference")}>
                      {contractBatch.contractRef ?? "·"}
                    </ValueBox>
                    <ValueBox label={t("contract.amount")}>
                      {contractBatch.priceCents !== null
                        ? `${formatUsd(contractBatch.priceCents)} USD`
                        : "·"}
                    </ValueBox>
                    <ValueBox label={t("contract.start")} icon="calendrier">
                      {formatDate(contractBatch.startsAt)}
                    </ValueBox>
                    <ValueBox label={t("contract.end")} icon="calendrier">
                      {formatDate(contractBatch.endsAt)}
                    </ValueBox>
                  </dl>
                  <p className="-mt-1 text-[11px] leading-[15px] text-ardoise">
                    {t("contract.fromBatch", { name: contractBatch.name })}
                  </p>
                </>
              ) : (
                <p className="text-[13px] leading-5 text-ardoise">{t("contract.none")}</p>
              )}

              <div className="mt-1 flex items-center justify-between gap-3">
                <h3 className={adminLabel}>{t("batches.title")}</h3>
                {writable && (
                  <ButtonLink
                    href={href({ id: selected.id, action: "lot" })}
                    scroll={false}
                    size="sm"
                    variant="tertiary"
                    icon={<Icon name="plus" />}
                  >
                    {t("batch.new")}
                  </ButtonLink>
                )}
              </div>
              {selected.licenseBatches.length === 0 ? (
                <p className="text-[13px] leading-5 text-ardoise">{t("batch.none")}</p>
              ) : (
                <div className="rounded-[18px] bg-creme px-4 py-1 lg:px-0">
                  <div role="table" aria-label={t("batches.title")} className="flex flex-col">
                    <div
                      role="row"
                      className={cx(
                        "hidden gap-3 px-[18px] py-2.5 lg:grid lg:grid-cols-[1.6fr_80px_80px_70px_60px_100px]",
                        adminLabel,
                      )}
                    >
                      <span role="columnheader">{t("batch.name")}</span>
                      <span role="columnheader">{t("batches.plan")}</span>
                      <span role="columnheader">{t("batches.seats")}</span>
                      <span role="columnheader">{t("batches.months")}</span>
                      <span role="columnheader">{t("batches.minGroup")}</span>
                      <span role="columnheader">{t("batches.status")}</span>
                    </div>
                    {selected.licenseBatches.map((batch, index) => (
                      <div
                        key={batch.id}
                        role="row"
                        className={cx(
                          "flex flex-wrap items-center gap-x-4 gap-y-1 border-brume py-3 text-[13px] lg:grid lg:grid-cols-[1.6fr_80px_80px_70px_60px_100px] lg:items-center lg:gap-3 lg:border-t lg:px-[18px] lg:py-3.5",
                          index > 0 && "border-t",
                        )}
                      >
                        <span role="rowheader" className="w-full font-semibold lg:w-auto">
                          {batch.name}
                          <span className="block text-[11px] leading-[15px] font-normal text-ardoise">
                            {tl("period", { start: batch.startsAt, end: batch.endsAt })}
                          </span>
                        </span>
                        <span role="cell" className="max-lg:text-[12px]">
                          <span className="text-ardoise lg:sr-only">
                            {t("batches.plan")}
                            {colon}
                          </span>
                          {batch.plan.name}
                        </span>
                        <span role="cell" className="max-lg:text-[12px]">
                          <span className="text-ardoise lg:sr-only">
                            {t("batches.seats")}
                            {colon}
                          </span>
                          <span
                            title={tl("usage", { activated: batch.activated, total: batch.seats })}
                          >
                            {batch.activated}/{batch.seats}
                          </span>
                        </span>
                        <span role="cell" className="max-lg:text-[12px]">
                          <span className="text-ardoise lg:sr-only">
                            {t("batches.months")}
                            {colon}
                          </span>
                          {t("batches.monthsValue", { months: batch.months })}
                        </span>
                        <span role="cell" className="max-lg:text-[12px]">
                          <span className="text-ardoise lg:sr-only">
                            {t("batches.minGroup")}
                            {colon}
                          </span>
                          {batch.minGroup}
                        </span>
                        <span role="cell">
                          <Tag
                            tone={
                              batch.status === "active"
                                ? "success"
                                : batch.status === "upcoming"
                                  ? "neon"
                                  : batch.status === "exhausted"
                                    ? "warning"
                                    : "neutral"
                            }
                            className="max-w-full whitespace-normal"
                          >
                            {tl(`status.${batch.status}`)}
                          </Tag>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
          {!panelOpen && <AuditNotice />}
        </div>

        {/* Creation panels. */}
        {panelOpen && (
          <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-6">
            <SectionRule>{t("creation")}</SectionRule>
            {action === "nouveau" ? (
              <SensitivePanel
                title={t("new")}
                text={t("noOnlinePurchase")}
                closeHref={closeHref}
                icon="entreprise"
                tone="neutral"
              >
                <form action={createPartnerAction} className="flex flex-col gap-3.5">
                  <TextField
                    id="partenaires-new-name"
                    name="name"
                    label={t("field.org")}
                    required
                    maxLength={120}
                  />
                  <Select
                    id="partenaires-new-kind"
                    name="kind"
                    label={t("field.type.text")}
                    options={kindOptions}
                    required
                  />
                  <TextField
                    id="partenaires-new-manager"
                    name="managerEmail"
                    type="email"
                    label={t("field.manager")}
                    required
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <ButtonLink href={closeHref} scroll={false} variant="tertiary">
                      {t("cancel")}
                    </ButtonLink>
                    <Button type="submit" variant="secondary">
                      {t("create")}
                    </Button>
                  </div>
                </form>
              </SensitivePanel>
            ) : (
              selected && (
                <SensitivePanel
                  title={t("batch.new")}
                  text={t("noOnlinePurchase")}
                  closeHref={closeHref}
                  tone="neutral"
                >
                  <form action={createBatchAction} className="flex flex-col gap-3.5">
                    <input type="hidden" name="partnerId" value={selected.id} />
                    <p className="text-[12px] leading-[17px] font-semibold text-ardoise">
                      {selected.name}
                    </p>
                    <TextField
                      id="partenaires-batch-name"
                      name="name"
                      label={t("batch.name")}
                      required
                      maxLength={80}
                    />
                    <fieldset className="flex flex-col gap-2">
                      <legend className="mb-2 text-[13px] leading-[18px] font-semibold">
                        {t("batch.plan")}
                      </legend>
                      <div className="flex flex-wrap gap-1 self-start rounded-pill bg-creme p-[5px]">
                        {plans.map((plan, index) => (
                          <label key={plan.id} className="relative">
                            <input
                              type="radio"
                              name="planId"
                              value={plan.id}
                              defaultChecked={index === 0}
                              className="peer sr-only"
                            />
                            <span className="inline-flex h-9 cursor-pointer items-center rounded-pill px-[18px] text-[12px] font-semibold peer-checked:bg-sapin peer-checked:text-blanc peer-focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.55)]">
                              {plan.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <div className="grid grid-cols-2 gap-3">
                      <TextField
                        id="partenaires-batch-seats"
                        name="seats"
                        type="number"
                        min={1}
                        label={t("batch.quantity")}
                        required
                      />
                      <TextField
                        id="partenaires-batch-months"
                        name="months"
                        type="number"
                        min={1}
                        max={36}
                        defaultValue={6}
                        label={t("batch.months")}
                        required
                      />
                    </div>
                    <TextField
                      id="partenaires-batch-min"
                      name="minGroup"
                      type="number"
                      min={MIN_GROUP}
                      defaultValue={MIN_GROUP}
                      icon="eye"
                      label={t("batch.minGroup")}
                      hint={t("batch.minGroupHint", { count: MIN_GROUP })}
                      required
                    />
                    <p className={cx(adminLabel, "mt-1")}>{t("contract.title")}</p>
                    <TextField
                      id="partenaires-batch-ref"
                      name="contractRef"
                      label={t("contract.reference")}
                      maxLength={80}
                    />
                    <TextField
                      id="partenaires-batch-amount"
                      name="amount"
                      inputMode="decimal"
                      label={t("contract.amount")}
                      hint={t("batch.amountHelp")}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <TextField
                        id="partenaires-batch-start"
                        name="startsAt"
                        type="date"
                        defaultValue={today}
                        label={t("contract.start")}
                        required
                      />
                      <TextField
                        id="partenaires-batch-end"
                        name="endsAt"
                        type="date"
                        label={t("contract.end")}
                        required
                      />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <ButtonLink href={closeHref} scroll={false} variant="tertiary">
                        {t("cancel")}
                      </ButtonLink>
                      <Button type="submit" variant="secondary">
                        {t("batch.create")}
                      </Button>
                    </div>
                  </form>
                </SensitivePanel>
              )
            )}
            <AuditNotice />
          </div>
        )}
      </div>
    </>
  );
}
