import Link from "next/link";
import { notFound } from "next/navigation";
import { getMessages, getTranslations } from "next-intl/server";
import { Alert, Badge, Button, Select, TextArea, TextField } from "@/components/ui";
import { cx } from "@/lib/cx";
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
  faqItems,
  listBanners,
  listOverrides,
} from "@/server/services/contents";

const tabs = { faq: "faq", bannieres: "banners" } as const;
type Tab = keyof typeof tabs;

/**
 * Editable contents (partie 07, `/admin/contenus`): FAQ questions and banners. Content editors and
 * administrators; every change goes to the audit log and shows on the site at once.
 */
export default async function AdminContents({ searchParams }: PageProps<"/admin/contenus">) {
  const params = await searchParams;
  if (!(await requireCourseEditor())) notFound();
  const t = await getTranslations();
  const tab: Tab = params.onglet === "bannieres" ? "bannieres" : "faq";
  const group: FaqGroup = (FAQ_GROUPS as readonly string[]).includes(String(params.groupe))
    ? (params.groupe as FaqGroup)
    : FAQ_GROUPS[0];
  const [messages, overrides] = await Promise.all([getMessages(), listOverrides(db)]);

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-h1">{t("admin.content.title")}</h1>
        <p className="text-[15px] text-ardoise">{t("admin.content.subtitle")}</p>
      </header>
      <nav aria-label={t("admin.content.title")} className="flex flex-wrap gap-2">
        {(Object.keys(tabs) as Tab[]).map((id) => (
          <Link
            key={id}
            href={`/admin/contenus?onglet=${id}`}
            aria-current={tab === id ? "page" : undefined}
            className={cx(
              "rounded-pill px-4 py-2 text-[15px] font-medium",
              tab === id ? "bg-sapin text-blanc" : "bg-blanc",
            )}
          >
            {t(`admin.content.tab.${tabs[id]}`)}
          </Link>
        ))}
      </nav>
      {params.ok === "enregistre" && <Alert tone="success" title={t("admin.content.saved")} />}
      {params.ok === "supprime" && <Alert tone="success" title={t("admin.content.deleted")} />}
      {params.erreur === "champs" && <Alert tone="error" title={t("admin.content.error")} />}

      {tab === "faq" ? (
        <FaqTab group={group} items={faqItems(messages, overrides, group, { withHidden: true })} />
      ) : (
        <BannersTab banners={listBanners(overrides)} />
      )}
    </>
  );
}

async function groupLabel(group: FaqGroup) {
  const t = await getTranslations();
  if (group === "home.faq") return t("admin.content.group.home");
  if (group === "pricing.faq") return t("admin.content.group.pricing");
  return t(`faq.theme.${group.slice("faq.".length) as "general"}`);
}

async function FaqTab({ group, items }: { group: FaqGroup; items: ReturnType<typeof faqItems> }) {
  const t = await getTranslations("admin.content");
  const labels = await Promise.all(FAQ_GROUPS.map(groupLabel));
  return (
    <section aria-labelledby="faq-title" className="flex flex-col gap-4">
      <h2 id="faq-title" className="sr-only">
        {t("tab.faq")}
      </h2>
      <form
        method="get"
        className="flex flex-col gap-3 rounded-card bg-blanc p-5 sm:flex-row sm:items-end"
      >
        <input type="hidden" name="onglet" value="faq" />
        <div className="flex-1">
          <Select
            id="content-group"
            name="groupe"
            label={t("faq.theme")}
            defaultValue={group}
            options={FAQ_GROUPS.map((value, index) => ({ value, label: labels[index]! }))}
          />
        </div>
        <Button type="submit" variant="secondary">
          {t("faq.edit")}
        </Button>
      </form>
      <p className="text-sm text-ardoise">{t("faq.count", { count: items.length })}</p>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={`${group}-${item.n}-${item.question}-${item.answer}`}
            id={`question-${item.n}`}
            className="flex scroll-mt-24 flex-col gap-3 rounded-card bg-blanc p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={cx("text-h3 font-semibold", item.hidden && "text-ardoise line-through")}
              >
                {item.question}
              </h3>
              {item.added && <Badge tone="learn">{t("faq.status.added")}</Badge>}
              {item.edited && !item.added && !item.hidden && (
                <Badge tone="warning">{t("faq.status.edited")}</Badge>
              )}
              {item.hidden && <Badge tone="neutral">{t("faq.status.hidden")}</Badge>}
            </div>
            {!item.hidden && (
              <details>
                <summary className="cursor-pointer text-sm font-medium underline">
                  {t("faq.edit")}
                </summary>
                <form action={saveFaqItemAction} className="mt-3 flex flex-col gap-3">
                  <input type="hidden" name="group" value={group} />
                  <input type="hidden" name="n" value={item.n} />
                  <FaqFields prefix={`${item.n}`} question={item.question} answer={item.answer} />
                  <div>
                    <Button type="submit" size="sm">
                      {t("publish")}
                    </Button>
                  </div>
                </form>
              </details>
            )}
            <form action={setFaqItemHiddenAction}>
              <input type="hidden" name="group" value={group} />
              <input type="hidden" name="n" value={item.n} />
              <input type="hidden" name="hidden" value={item.hidden || item.edited ? "0" : "1"} />
              <Button type="submit" size="sm" variant="tertiary">
                {item.hidden
                  ? t("faq.show")
                  : item.added
                    ? t("faq.delete")
                    : item.edited
                      ? t("faq.reset")
                      : t("faq.hide")}
              </Button>
            </form>
          </li>
        ))}
      </ul>
      <form
        key={`${group}-${items.length}`}
        id="nouvelle-question"
        action={saveFaqItemAction}
        className="flex scroll-mt-24 flex-col gap-3 rounded-card bg-blanc p-5"
      >
        <h3 className="text-h3 font-semibold">{t("faq.add")}</h3>
        <input type="hidden" name="group" value={group} />
        <FaqFields prefix="new" />
        <div>
          <Button type="submit">{t("publish")}</Button>
        </div>
      </form>
    </section>
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

async function BannersTab({ banners }: { banners: Banner[] }) {
  const t = await getTranslations("admin.content");
  return (
    <section aria-labelledby="banners-title" className="flex flex-col gap-4">
      <h2 id="banners-title" className="sr-only">
        {t("tab.banners")}
      </h2>
      <p className="text-sm text-ardoise">{t("banner.where")}</p>
      {banners.length === 0 ? (
        <p className="rounded-card bg-blanc p-5">{t("banner.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {banners.map((banner) => (
            <li
              key={`${banner.id}-${JSON.stringify(banner)}`}
              id={`banniere-${banner.id}`}
              className="flex scroll-mt-24 flex-col gap-3 rounded-card bg-blanc p-5"
            >
              <p className="font-semibold">{banner.text}</p>
              <p className="text-sm text-ardoise">
                {t(`banner.audience.${banner.audience}`)}
                {" · "}
                {banner.start || banner.end
                  ? t("banner.dates", { start: banner.start || "…", end: banner.end || "…" })
                  : t("banner.always")}
              </p>
              <details>
                <summary className="cursor-pointer text-sm font-medium underline">
                  {t("faq.edit")}
                </summary>
                <form action={saveBannerAction} className="mt-3 flex flex-col gap-3">
                  <input type="hidden" name="id" value={banner.id} />
                  <BannerFields prefix={banner.id} banner={banner} />
                  <div>
                    <Button type="submit" size="sm">
                      {t("banner.save")}
                    </Button>
                  </div>
                </form>
              </details>
              <form action={deleteBannerAction}>
                <input type="hidden" name="id" value={banner.id} />
                <Button type="submit" size="sm" variant="tertiary">
                  {t("banner.delete")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form
        key={banners.length}
        id="nouvelle-banniere"
        action={saveBannerAction}
        className="flex scroll-mt-24 flex-col gap-3 rounded-card bg-blanc p-5"
      >
        <h3 className="text-h3 font-semibold">{t("banner.add")}</h3>
        <BannerFields prefix="new" />
        <div>
          <Button type="submit">{t("banner.save")}</Button>
        </div>
      </form>
    </section>
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
