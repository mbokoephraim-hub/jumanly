import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Icon, type IconName } from "@/components/brand/icon";
import { SpaceSwitcher } from "@/components/layout/space-switcher";
import { Avatar, Pressable, ProgressBar, VisualTile } from "@/components/ui";
import { cx } from "@/lib/cx";
import { ADMIN_ROLES, requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";
import { signOut } from "@/server/actions/auth";
import { lockedTools } from "@/server/services/career-offer";
import { hireMemberships, partnerMemberships } from "@/server/services/organization";
import { completeness, getFullProfile } from "@/server/services/profile";
import { isTester } from "@/server/services/tester";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("talent.espace");
  return { title: { absolute: t("seo") }, robots: { index: false } };
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5" aria-label={title}>
      <h2 className="px-1 text-[11.5px] font-semibold tracking-[0.12em] text-ardoise uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  href,
  icon,
  tone = "bg-lime-clair",
  title,
  line,
  aside,
}: {
  href: string;
  icon: IconName;
  tone?: string;
  title: string;
  line?: string;
  aside?: React.ReactNode;
}) {
  return (
    <Pressable href={href}>
      <span
        aria-hidden
        className={cx("grid size-11 shrink-0 place-items-center rounded-[13px]", tone)}
      >
        <Icon name={icon} className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[14.5px] leading-snug font-semibold">{title}</span>
        {line && <span className="truncate text-[12.5px] text-ardoise">{line}</span>}
      </span>
      {aside}
    </Pressable>
  );
}

/**
 * Mon espace (docs/ux-mobile-talent, prompt 2, screen 17): the whole personal space on one page,
 * opened from « Tout Mon espace » in the avatar menu, so that Back works. Profile first, then the
 * career tools as visual tiles, what was acquired, and the account. Real figures only.
 */
export default async function EspacePage() {
  const user = await requireUser("/app/espace");
  // Organization and partner spaces keep their own home.
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  if (await getPartnerSpace(user.id)) redirect("/app/partenaire");
  const t = await getTranslations("talent.espace");
  const tr = await getTranslations();
  const to = await getTranslations("org.roles");
  const [plan, profile, cvs, certificates, hire, partners] = await Promise.all([
    resolvePlan(db, { type: "user", id: user.id }),
    getFullProfile(db, user.id),
    db.document.count({ where: { kind: "cv", profile: { userId: user.id } } }),
    db.certificate.count({ where: { revokedAt: null, enrollment: { userId: user.id } } }),
    hireMemberships(db, user.id),
    partnerMemberships(db, user.id),
  ]);
  const { percent, missing } = completeness(profile);
  const locked = plan ? lockedTools(plan.values) : [];
  const planName = plan?.planName ?? "";
  const sectionNames: Record<string, string> = {
    identity: tr("talent.profile.identity.title"),
    summary: tr("talent.profile.summary.title"),
    experience: tr("talent.profile.experience.title"),
    education: tr("talent.profile.education.title"),
    skills: tr("talent.profile.skills.title"),
    languages: tr("talent.profile.languages.title"),
    preferences: tr("talent.profile.preferences.title"),
  };
  const subtitle = [profile.headline, profile.user.city].filter(Boolean).join(" · ");
  const lockedLabel = (tool: (typeof locked)[number]) =>
    locked.includes(tool) ? t("tools.locked") : undefined;
  const spaces = [...hire, ...partners].map((membership) => ({
    id: membership.organizationId,
    name: membership.organization.name,
    role: to(`${membership.role}.text`),
  }));

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 pb-6">
      <div className="flex items-center gap-2">
        <Link
          href="/app"
          aria-label={t("back")}
          className="-ml-2 grid size-11 shrink-0 place-items-center rounded-full hover:bg-blanc"
        >
          <Icon name="chev-l" className="size-5" />
        </Link>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{t("title")}</h1>
        {spaces.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="sr-only">{t("spaces")}</span>
            <SpaceSwitcher current={null} spaces={spaces} tone="light" />
          </div>
        )}
      </div>

      <section className="flex flex-col gap-4 rounded-[24px] bg-blanc p-4 shadow-douce">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} image={user.image ?? undefined} size="lg" />
          <div className="flex min-w-0 flex-col items-start gap-1">
            <p className="truncate text-[18px] font-semibold">{user.name}</p>
            {subtitle && <p className="truncate text-[13px] text-ardoise">{subtitle}</p>}
            {planName && (
              <span className="rounded-pill bg-lime-clair px-2.5 py-0.5 text-[12px] font-semibold">
                {tr("account.menu.roleBadge.text", {
                  space: tr("account.menu.roleBadge.talent"),
                  plan: planName,
                })}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-[18px] bg-creme p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13.5px] font-semibold">{t("completeness", { percent })}</p>
            {missing.length > 0 && (
              <Link
                href="/app/profil"
                className="flex min-h-9 items-center gap-1 text-[13.5px] font-semibold text-feuille-fonce"
              >
                {t("complete")}
                <Icon name="chev-r" className="size-4" />
              </Link>
            )}
          </div>
          <ProgressBar value={percent} label={t("completeness", { percent })} />
          {missing.length > 0 && (
            <p className="text-[12.5px] text-ardoise">
              {t("missing", {
                sections: missing.map((key) => sectionNames[key]?.toLowerCase()).join(", "),
              })}
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <VisualTile
          href="/app/tableau-de-bord"
          title={t("tiles.dashboard")}
          line={t("tiles.dashboardLine")}
          scene="profile"
          tone="brume"
        />
        <VisualTile
          href="/app/abonnement"
          title={t("tiles.subscription")}
          line={planName ? t("tiles.subscriptionLine", { plan: planName }) : undefined}
          scene="documents"
          tone="lime"
        />
      </div>

      <Group title={t("groups.profile")}>
        <Row
          href="/app/profil"
          icon="profil"
          tone="bg-lime"
          title={t("rows.edit")}
          line={t("rows.editLine")}
        />
        <Row
          href="/app/profil#competences"
          icon="competence"
          tone="bg-lime"
          title={t("rows.skills")}
          line={t("rows.skillsLine", { count: profile._count.skills })}
        />
        <Row
          href="/app/career/portfolio"
          icon="portefeuille"
          tone="bg-menthe-claire"
          title={t("rows.portfolio")}
          line={t("rows.portfolioLine")}
        />
        <Row
          href="/app/profil#visibilite"
          icon="eye"
          tone="bg-creme"
          title={t("rows.visibility")}
          line={t("rows.visibilityLine")}
          aside={
            <span className="shrink-0 rounded-pill bg-creme px-2.5 py-1 text-[12px] font-semibold">
              {tr(`talent.profile.visibility.${profile.visibility}.text`)}
            </span>
          }
        />
      </Group>

      <Group title={t("groups.tools")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <VisualTile
            href="/app/career/cv/modeles"
            title={t("tools.builder")}
            line={t("tools.builderLine")}
            scene="cv"
            tone="lime"
          />
          <VisualTile
            href="/app/career/cv"
            title={t("tools.cvs")}
            line={t("tools.cvsLine", { count: cvs })}
            scene="cv"
            tone="neon"
          />
          <VisualTile
            href="/app/career/documents"
            title={t("tools.documents")}
            line={t("tools.documentsLine")}
            scene="documents"
            tone="menthe"
            locked={lockedLabel("documents")}
          />
          <VisualTile
            href="/app/career/linkedin"
            title={t("tools.linkedin")}
            line={t("tools.linkedinLine")}
            scene="profile"
            tone="brume"
            locked={lockedLabel("linkedin")}
          />
          <VisualTile
            href="/app/career/entretiens"
            title={t("tools.interviews")}
            line={t("tools.interviewsLine")}
            scene="interview"
            tone="lime"
            locked={lockedLabel("interviews")}
          />
          <VisualTile
            href="/app/career"
            title={t("tools.career")}
            line={t("tools.careerLine")}
            scene="jobs"
            tone="menthe"
          />
        </div>
      </Group>

      <Group title={t("groups.acquired")}>
        <Row
          href="/app/learn/attestations"
          icon="certificat"
          tone="bg-lime"
          title={t("acquired.certificates")}
          line={t("acquired.certificatesLine", { count: certificates })}
        />
        <Row
          href="/app/learn/evaluations"
          icon="quiz"
          tone="bg-menthe-claire"
          title={t("acquired.evaluations")}
          line={t("acquired.evaluationsLine")}
        />
      </Group>

      <Group title={t("groups.account")}>
        <ul className="flex flex-col overflow-hidden rounded-[22px] bg-blanc shadow-douce">
          {(
            [
              ["/app/abonnement", "portefeuille", t("account.billing")],
              ["/app/notifications", "notification", t("account.notifications")],
              ["/app/parametres", "reglages", t("account.settings")],
              ["/comment-fonctionne-le-matching", "transparence", t("account.matching")],
              ["/activer", "lock", t("account.license")],
              ...(isTester(user)
                ? [["/app/testeur", "portefeuille", tr("account.menu.tester")] as const]
                : []),
              ...((ADMIN_ROLES as readonly string[]).includes(user.platformRole)
                ? [["/admin", "securite", tr("appNav.admin")] as const]
                : []),
              ["/contact", "info", t("account.help")],
            ] as const satisfies readonly (readonly [string, IconName, string])[]
          ).map(([href, icon, label]) => (
            <li key={href} className="border-b border-brume last:border-b-0">
              <Link
                href={href}
                className="jm-press flex min-h-14 items-center gap-3 px-4 text-[15px] hover:bg-creme active:bg-lime-clair"
              >
                <Icon name={icon} className="size-5 shrink-0" />
                <span className="min-w-0 flex-1">{label}</span>
                <Icon name="chev-r" className="size-4 shrink-0 text-ardoise" />
              </Link>
            </li>
          ))}
        </ul>
        <form action={signOut}>
          <button
            type="submit"
            className="jm-press flex min-h-14 w-full items-center gap-3 rounded-[22px] bg-blanc px-4 text-left text-[15px] font-semibold text-down-texte shadow-douce hover:bg-creme"
          >
            <Icon name="logout" className="size-5 shrink-0" />
            {tr("account.menu.logout")}
          </button>
        </form>
      </Group>
    </div>
  );
}
