import Link from "next/link";
import { notFound } from "next/navigation";
import { getMessages, getTranslations } from "next-intl/server";
import {
  AdminFilterBar,
  AdminPageHeader,
  AdminTabs,
  AuditNotice,
  FilterMenu,
  ReasonField,
  Tag,
  adminCard,
  adminLabel,
  adminTitle,
  type TagTone,
} from "@/components/admin/kit";
import {
  BannersSummaryCard,
  ContentHistoryCard,
  bannerState,
  bannerStateTone,
} from "@/components/admin/contenus-side";
import { Icon } from "@/components/brand/icon";
import { Alert, Button, ButtonLink, Select, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
import { formatShortDate } from "@/lib/dates";
import {
  deleteBannerAction,
  saveBannerAction,
  saveFaqItemAction,
  setFaqItemHiddenAction,
} from "@/server/actions/contents";
import { requireCourseEditor } from "@/server/auth/session";
import { db } from "@/server/db";
import {
  bannerAudiences,
  bannerStyles,
  FAQ_GROUPS,
  type Banner,
  type FaqGroup,
  type FaqItem,
  faqItems,
  listBanners,
  listOverrides,
} from "@/server/services/contents";
import { contentHistory, overrideDates } from "@/server/services/contents-admin";

const tabs = { faq: "faq", bannieres: "banners" } as const;
type Tab = keyof typeof tabs;

/**
 * Editable contents (partie 07, `/admin/contenus`, mockup 07-10): FAQ questions and banners.
 * Content editors and administrators; every change goes to the audit log and shows on the site at
 * once. The tabs « Textes de l'interface » and « Conseils de préparation » of the mockup are not
 * built: those texts are only changed in textes/.
 */
export default async function AdminContents({ searchParams }: PageProps<"/admin/contenus">) {
  const params = await searchParams;
  if (!(await requireCourseEditor())) notFound();
  const t = await getTranslations("admin.content");
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const tab: Tab = one("onglet") === "bannieres" ? "bannieres" : "faq";
  const group: FaqGroup = (FAQ_GROUPS as readonly string[]).includes(one("groupe"))
    ? (one("groupe") as FaqGroup)
    : FAQ_GROUPS[0];
  const [messages, overrides, dates] = await Promise.all([
    getMessages(),
    listOverrides(db),
    overrideDates(db),
  ]);
  const banners = listBanners(overrides);

  return (
    <>
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />
      <AdminTabs
        label={t("title")}
        items={(Object.keys(tabs) as Tab[]).map((id) => ({
          href: `/admin/contenus?onglet=${id}`,
          label: t(`tab.${tabs[id]}`),
          current: tab === id,
        }))}
      />
      {tab === "faq" ? (
        <FaqTab
          group={group}
          q={one("q").trim().slice(0, 120)}
          selected={Number(one("question")) || 0}
          items={faqItems(messages, overrides, group, { withHidden: true })}
          dates={dates}
          banners={banners}
          notice={one("ok") || one("erreur")}
        />
      ) : (
        <BannersTab banners={banners} notice={one("ok") || one("erreur")} />
      )}
    </>
  );
}

async function Notices({ notice }: { notice: string }) {
  const t = await getTranslations("admin.content");
  if (notice === "enregistre") return <Alert tone="success" title={t("saved")} />;
  if (notice === "supprime") return <Alert tone="success" title={t("deleted")} />;
  if (notice === "champs") return <Alert tone="error" title={t("error")} />;
  if (notice === "motif") return <Alert tone="error" title={t("reasonMissing")} />;
  return null;
}

async function groupLabel(group: FaqGroup) {
  const t = await getTranslations();
  if (group === "home.faq") return t("admin.content.group.home");
  if (group === "pricing.faq") return t("admin.content.group.pricing");
  return t(`faq.theme.${group.slice("faq.".length) as "general"}`);
}

const itemTone = (item: FaqItem): TagTone =>
  item.hidden ? "outline" : item.added ? "success" : item.edited ? "warning" : "neutral";

async function FaqTab({
  group,
  q,
  selected,
  items,
  dates,
  banners,
  notice,
}: {
  group: FaqGroup;
  q: string;
  selected: number;
  items: FaqItem[];
  dates: Record<string, Date>;
  banners: Banner[];
  notice: string;
}) {
  const t = await getTranslations("admin.content");
  const common = await getTranslations("common");
  const labels = await Promise.all(FAQ_GROUPS.map(groupLabel));
  const needle = q.toLocaleLowerCase("fr");
  const shown = needle
    ? items.filter((item) =>
        `${group}.q${item.n} ${item.question} ${item.answer}`
          .toLocaleLowerCase("fr")
          .includes(needle),
      )
    : items;
  const item = items.find((entry) => entry.n === selected);
  const itemKey = item ? `${group}.q${item.n}` : "";
  const status = (entry: FaqItem) =>
    entry.hidden
      ? t("faq.status.hidden")
      : entry.added
        ? t("faq.status.added")
        : entry.edited
          ? t("faq.status.edited")
          : t("faq.status.original");
  const history = await contentHistory(db, itemKey || undefined);
  const base = `/admin/contenus?${new URLSearchParams({ groupe: group, ...(q ? { q } : {}) })}`;

  return (
    <>
      <AdminFilterBar
        action="/admin/contenus"
        searchLabel={t("search")}
        q={q}
        hidden={{ groupe: group }}
        aside={
          <span className="text-[12.5px] text-ardoise">
            {t("faq.count", { count: shown.length })}
          </span>
        }
      >
        <FilterMenu
          label={t("faq.theme")}
          group="content-faq-group"
          options={FAQ_GROUPS.map((value, index) => ({
            href: `/admin/contenus?groupe=${value}`,
            label: labels[index]!,
            // The first group is the default one: the chip shows the group in every case.
            current: value === group,
          }))}
        />
      </AdminFilterBar>
      <span className="-mt-2 text-[12.5px] font-semibold">{labels[FAQ_GROUPS.indexOf(group)]}</span>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Notices notice={notice} />
          <section aria-labelledby="faq-title" className="rounded-[24px] bg-blanc py-1.5">
            <h2 id="faq-title" className="sr-only">
              {t("tab.faq")} · {labels[FAQ_GROUPS.indexOf(group)]}
            </h2>
            <div
              aria-hidden
              className={cx(
                adminLabel,
                "hidden gap-3 px-[18px] pt-4 pb-2.5 md:grid md:grid-cols-[1.1fr_1.8fr_90px_90px]",
              )}
            >
              <span>{t("texts.key")}</span>
              <span>{t("faq.question")}</span>
              <span>{t("col.status")}</span>
              <span>{t("col.updated")}</span>
            </div>
            {shown.length === 0 ? (
              <p className="px-[18px] py-4 text-[13px] text-ardoise">
                {q ? t("faq.searchEmpty") : t("faq.count", { count: 0 })}
              </p>
            ) : (
              <ul>
                {shown.map((entry) => {
                  const key = `${group}.q${entry.n}`;
                  const date = dates[key] ?? dates[`${group}.a${entry.n}`];
                  return (
                    <li
                      key={`${key}-${entry.question}-${entry.answer}`}
                      id={`question-${entry.n}`}
                      className="scroll-mt-24 border-brume not-first:border-t md:border-t"
                    >
                      <Link
                        href={`${base}&question=${entry.n}#editeur`}
                        aria-current={entry.n === selected ? "true" : undefined}
                        className={cx(
                          "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-[18px] py-3.5 text-[13px] md:grid-cols-[1.1fr_1.8fr_90px_90px]",
                          entry.n === selected ? "bg-lime-clair" : "hover:bg-creme/60",
                        )}
                      >
                        <code className="min-w-0 truncate text-[11.5px] max-md:col-start-1 max-md:text-ardoise">
                          {key}
                        </code>
                        <span
                          className={cx(
                            "min-w-0 truncate max-md:col-span-2 max-md:row-start-2 max-md:font-semibold",
                            entry.hidden && "text-ardoise line-through",
                          )}
                        >
                          {entry.question}
                        </span>
                        <span className="max-md:col-start-2 max-md:row-start-1">
                          <Tag tone={itemTone(entry)}>{status(entry)}</Tag>
                        </span>
                        <span className="text-[11px] text-ardoise max-md:hidden">
                          {date ? formatShortDate(date) : "·"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section
            id="editeur"
            aria-labelledby="content-editor-title"
            className={cx(adminCard, "flex scroll-mt-6 flex-col gap-3.5")}
          >
            {item ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col">
                    <span className={adminLabel}>{t("texts.key")}</span>
                    <h2 id="content-editor-title" className="text-[14px] font-semibold break-all">
                      <code>{itemKey}</code>
                    </h2>
                  </div>
                  <Tag tone={itemTone(item)}>{status(item)}</Tag>
                </div>
                {!item.hidden && (
                  <form
                    key={`${item.n}-${item.question}-${item.answer}`}
                    action={saveFaqItemAction}
                    className="flex flex-col gap-3.5"
                  >
                    <input type="hidden" name="group" value={group} />
                    <input type="hidden" name="n" value={item.n} />
                    <FaqFields prefix={`${item.n}`} question={item.question} answer={item.answer} />
                    <Rules />
                    <div className="flex flex-col gap-2 rounded-[16px] bg-creme p-3.5">
                      <span className={adminLabel}>{t("preview")}</span>
                      <div className="flex flex-col gap-1.5 rounded-[12px] bg-blanc px-4 py-3">
                        <p className="flex items-start justify-between gap-3 text-[13.5px] leading-5 font-semibold">
                          {item.question}
                          <Icon name="chev-d" className="mt-0.5 size-4 shrink-0" />
                        </p>
                        <p className="text-[12.5px] leading-[19px] whitespace-pre-line text-ardoise">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                    <ReasonField id={`content-faq-${item.n}-reason`} rows={2} />
                    <div className="flex flex-wrap justify-end gap-2">
                      <ButtonLink href={`${base}#editeur`} variant="tertiary">
                        {common("cancel")}
                      </ButtonLink>
                      <Button type="submit" variant="secondary">
                        {t("publish")}
                      </Button>
                    </div>
                  </form>
                )}
                <form action={setFaqItemHiddenAction} className="flex border-t border-brume pt-3.5">
                  <input type="hidden" name="group" value={group} />
                  <input type="hidden" name="n" value={item.n} />
                  <input
                    type="hidden"
                    name="hidden"
                    value={item.hidden || item.edited ? "0" : "1"}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="tertiary"
                    className={cx(item.added && !item.hidden && "text-corail-fonce")}
                  >
                    {item.hidden
                      ? t("faq.show")
                      : item.added
                        ? t("faq.delete")
                        : item.edited
                          ? t("faq.reset")
                          : t("faq.hide")}
                  </Button>
                </form>
              </>
            ) : (
              <form
                key={`${group}-${items.length}`}
                id="nouvelle-question"
                action={saveFaqItemAction}
                className="flex scroll-mt-24 flex-col gap-3.5"
              >
                <h2 id="content-editor-title" className={adminTitle}>
                  {t("faq.add")}
                </h2>
                <p className="text-[12.5px] leading-[18px] text-ardoise">{t("faq.pick")}</p>
                <input type="hidden" name="group" value={group} />
                <FaqFields prefix="new" />
                <Rules />
                <ReasonField id="content-faq-new-reason" rows={2} />
                <Button type="submit" variant="secondary" className="self-end">
                  {t("publish")}
                </Button>
              </form>
            )}
          </section>
        </div>
        <aside className="flex flex-col gap-4">
          <ContentHistoryCard history={history} versions={Boolean(item)} />
          <BannersSummaryCard banners={banners} />
          <AuditNotice />
        </aside>
      </div>
    </>
  );
}

async function Rules() {
  const t = await getTranslations("admin.content");
  return (
    <p className="flex items-start gap-2.5 rounded-[12px] bg-creme px-3 py-2.5 text-[11px] leading-4">
      <Icon name="check" className="mt-px size-3.5 shrink-0" />
      {t("texts.rules")}
    </p>
  );
}

async function FaqFields({
  prefix,
  question,
  answer,
}: {
  prefix: string;
  question?: string;
  answer?: string;
}) {
  const t = await getTranslations("admin.content.faq");
  return (
    <>
      <TextField
        id={`faq-${prefix}-question`}
        name="question"
        label={t("question")}
        defaultValue={question}
        minLength={3}
        maxLength={300}
        required
      />
      <TextArea
        id={`faq-${prefix}-answer`}
        name="answer"
        label={t("answer")}
        defaultValue={answer}
        minLength={3}
        maxLength={3000}
        rows={4}
        required
      />
    </>
  );
}

async function BannersTab({ banners, notice }: { banners: Banner[]; notice: string }) {
  const t = await getTranslations("admin.content");
  const history = await contentHistory(db);
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-4">
        <Notices notice={notice} />
        <section aria-labelledby="banners-title" className={cx(adminCard, "flex flex-col gap-3")}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="banners-title" className={adminTitle}>
              {t("tab.banners")}
            </h2>
            <span className="text-[12.5px] text-ardoise">
              {t("banner.count", { count: banners.length })}
            </span>
          </div>
          <p className="text-[12.5px] leading-[18px] text-ardoise">{t("banner.where")}</p>
          {banners.length === 0 ? (
            <p className="rounded-[14px] bg-creme px-4 py-3 text-[13px] leading-5">
              {t("banner.empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {banners.map((banner) => {
                const state = bannerState(banner);
                return (
                  <li
                    key={`${banner.id}-${JSON.stringify(banner)}`}
                    id={`banniere-${banner.id}`}
                    className="flex scroll-mt-24 flex-col gap-2.5 rounded-[18px] bg-creme p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-[13.5px] leading-5 font-semibold">{banner.text}</span>
                        <span className="text-[11.5px] leading-4 text-ardoise">
                          {t(`banner.audience.${banner.audience}`)}
                          {" · "}
                          {t(`banner.style.${banner.style}`)}
                          {" · "}
                          {banner.start || banner.end
                            ? t("banner.dates", {
                                start: banner.start || "…",
                                end: banner.end || "…",
                              })
                            : t("banner.always")}
                        </span>
                      </span>
                      <Tag tone={bannerStateTone[state]}>{t(`banner.status.${state}`)}</Tag>
                    </div>
                    <details className="group/banner">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[12.5px] font-semibold underline underline-offset-4 [&::-webkit-details-marker]:hidden">
                        <Icon name="edit" className="size-3.5" />
                        {t("faq.edit")}
                      </summary>
                      <form
                        action={saveBannerAction}
                        className="mt-3 flex flex-col gap-3 rounded-[14px] bg-blanc p-3.5"
                      >
                        <input type="hidden" name="id" value={banner.id} />
                        <BannerFields prefix={banner.id} banner={banner} />
                        <Button type="submit" size="sm" variant="secondary" className="self-start">
                          {t("banner.save")}
                        </Button>
                      </form>
                    </details>
                    <form action={deleteBannerAction}>
                      <input type="hidden" name="id" value={banner.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="tertiary"
                        className="bg-blanc text-corail-fonce"
                      >
                        {t("banner.delete")}
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <form
          key={banners.length}
          id="nouvelle-banniere"
          action={saveBannerAction}
          className={cx(adminCard, "flex scroll-mt-24 flex-col gap-3.5")}
        >
          <h2 className={adminTitle}>{t("banner.add")}</h2>
          <BannerFields prefix="new" />
          <Button type="submit" variant="secondary" className="self-end">
            {t("banner.save")}
          </Button>
        </form>
      </div>
      <aside className="flex flex-col gap-4">
        <ContentHistoryCard history={history} versions={false} />
        <AuditNotice />
      </aside>
    </div>
  );
}

async function BannerFields({ prefix, banner }: { prefix: string; banner?: Banner }) {
  const t = await getTranslations("admin.content.banner");
  return (
    <>
      <TextArea
        id={`banner-${prefix}-text`}
        name="text"
        label={t("text")}
        defaultValue={banner?.text}
        minLength={3}
        maxLength={300}
        rows={2}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          id={`banner-${prefix}-audience`}
          name="audience"
          label={t("audience.text")}
          defaultValue={banner?.audience ?? "all"}
          options={bannerAudiences.map((value) => ({ value, label: t(`audience.${value}`) }))}
        />
        <Select
          id={`banner-${prefix}-style`}
          name="style"
          label={t("style.text")}
          defaultValue={banner?.style ?? "info"}
          options={bannerStyles.map((value) => ({ value, label: t(`style.${value}`) }))}
        />
        <TextField
          id={`banner-${prefix}-start`}
          name="start"
          type="date"
          label={t("start")}
          defaultValue={banner?.start ?? ""}
        />
        <TextField
          id={`banner-${prefix}-end`}
          name="end"
          type="date"
          label={t("end")}
          defaultValue={banner?.end ?? ""}
        />
      </div>
    </>
  );
}
