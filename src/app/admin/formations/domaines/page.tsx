import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminPageHeader, adminCard } from "@/components/admin/kit";
import { Icon } from "@/components/brand/icon";
import { Alert, Button, ButtonLink, Select, TextArea, TextField } from "@/components/ui";
import { requireCourseEditor } from "@/server/auth/session";
import {
  createDomainAction,
  deleteDomainAction,
  updateDomainAction,
} from "@/server/actions/learn-domains";
import { db } from "@/server/db";
import { domainIcons, listDomains, type DomainSummary } from "@/server/services/learn-domains";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.courses.domains");
  return { title: t("title"), robots: { index: false } };
}

/**
 * Domains of the Learn catalog (Learn v2, étape 1): content editors and administrators rename,
 * describe, order and create them; only an administrator deletes one (its courses stay published).
 */
export default async function AdminDomains({
  searchParams,
}: PageProps<"/admin/formations/domaines">) {
  const user = await requireCourseEditor();
  if (!user) notFound();
  const params = await searchParams;
  const t = await getTranslations("admin.courses.domains");
  const domains = await listDomains(db);
  const canDelete = user.platformRole === "platform_admin";
  const ok = typeof params.ok === "string" ? params.ok : undefined;
  const error = typeof params.erreur === "string" ? params.erreur : undefined;

  return (
    <>
      <AdminPageHeader
        title={t("title")}
        eyebrow={t("eyebrow")}
        subtitle={t("subtitle")}
        action={
          <ButtonLink
            href="/admin/formations"
            variant="secondary"
            icon={<Icon name="chev-l" />}
            size="sm"
          >
            {t("back")}
          </ButtonLink>
        }
      />
      {(ok === "created" || ok === "saved" || ok === "deleted") && (
        <Alert tone="success" title={t(`ok.${ok}`)} />
      )}
      {error && <Alert tone="error" title={t("error")} />}

      <ul className="grid gap-4 xl:grid-cols-2">
        {domains.map((domain) => (
          <li key={domain.id} id={`domaine-${domain.slug}`} className="scroll-mt-24">
            <DomainCard domain={domain} canDelete={canDelete} />
          </li>
        ))}
      </ul>

      <section id="nouveau" aria-labelledby="new-domain" className={adminCard}>
        <h2 id="new-domain" className="mb-4 text-[18px] font-semibold">
          {t("new.title")}
        </h2>
        <form action={createDomainAction} className="flex flex-col gap-3">
          <DomainFields prefix="new" />
          <Button type="submit" icon={<Icon name="plus" />} className="w-full sm:w-fit">
            {t("new.submit")}
          </Button>
        </form>
      </section>
    </>
  );
}

async function DomainCard({ domain, canDelete }: { domain: DomainSummary; canDelete: boolean }) {
  const t = await getTranslations("admin.courses.domains");
  return (
    <article className={`${adminCard} flex h-full flex-col gap-4`}>
      <header className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-lime"
        >
          <Icon name={domain.icon} className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <h2 className="truncate text-[16px] font-semibold">{domain.name}</h2>
          <p className="text-[12.5px] text-ardoise">{t("count", { count: domain.courseCount })}</p>
        </div>
      </header>
      <form action={updateDomainAction} className="flex flex-col gap-3">
        <input type="hidden" name="domain" value={domain.id} />
        <DomainFields prefix={domain.slug} domain={domain} />
        <Button type="submit" variant="secondary" className="w-full sm:w-fit">
          {t("save")}
        </Button>
      </form>
      {canDelete && (
        <form
          action={deleteDomainAction}
          className="flex flex-col gap-1.5 border-t border-brume pt-3"
        >
          <input type="hidden" name="domain" value={domain.id} />
          <p className="text-[12.5px] text-ardoise">{t("deleteHint")}</p>
          <Button type="submit" variant="tertiary" size="sm" className="w-fit">
            {t("delete")}
          </Button>
        </form>
      )}
    </article>
  );
}

async function DomainFields({ prefix, domain }: { prefix: string; domain?: DomainSummary }) {
  const t = await getTranslations("admin.courses.domains");
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_110px]">
        <TextField
          id={`domain-${prefix}-name`}
          name="name"
          label={t("field.name")}
          defaultValue={domain?.name}
          required
          minLength={2}
          maxLength={80}
        />
        <Select
          id={`domain-${prefix}-icon`}
          name="icon"
          label={t("field.icon")}
          defaultValue={domain?.icon ?? "learn"}
          options={domainIcons.map((icon) => ({ value: icon, label: icon }))}
        />
        <TextField
          id={`domain-${prefix}-order`}
          name="order"
          type="number"
          label={t("field.order")}
          defaultValue={String(domain?.order ?? 0)}
          min={0}
          max={999}
        />
      </div>
      <TextArea
        id={`domain-${prefix}-description`}
        name="description"
        label={t("field.description")}
        defaultValue={domain?.description}
        maxLength={300}
        rows={2}
      />
    </>
  );
}
