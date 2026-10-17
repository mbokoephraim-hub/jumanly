import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations, getFormatter } from "next-intl/server";
import { redirect } from "next/navigation";
import { InviteButton, ThemeSwitch } from "@/components/account/account-controls";
import { Icon, type IconName } from "@/components/brand/icon";
import { initials } from "@/components/ui/avatar";
import { dynamic } from "@/i18n/dynamic";
import { cx } from "@/lib/cx";
import { siteUrl } from "@/lib/seo";
import { AI_CREDITS_KEY } from "@/server/ai";
import { signOut } from "@/server/actions/auth";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { resolvePlan, usage } from "@/server/entitlements";
import { getActiveSpace } from "@/server/hire-context";
import { getPartnerSpace } from "@/server/partner-context";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountPage");
  return { title: t("metaTitle"), robots: { index: false } };
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h2 className="mx-1 text-[11.5px] font-bold tracking-[0.06em] text-ardoise uppercase">
        {title}
      </h2>
      <ul className="overflow-hidden rounded-[22px] bg-blanc shadow-douce">{children}</ul>
    </section>
  );
}

const row = "flex min-h-[58px] w-full items-center gap-3 px-3.5 text-left";

function Tile({ icon, tone }: { icon: IconName; tone: string }) {
  return (
    <span
      aria-hidden
      className={cx("grid size-9 shrink-0 place-items-center rounded-[12px]", tone)}
    >
      <Icon name={icon} className="size-[18px]" />
    </span>
  );
}

function LinkRow({
  href,
  icon,
  tone,
  label,
  aside,
}: {
  href: string;
  icon: IconName;
  tone: string;
  label: string;
  aside?: string;
}) {
  return (
    <li className="border-t border-sapin/6 first:border-0">
      <Link href={href} className={cx(row, "hover:bg-sapin/3")}>
        <Tile icon={icon} tone={tone} />
        <span className="min-w-0 flex-1 text-[15px] font-semibold">{label}</span>
        {aside ? (
          <span className="shrink-0 rounded-pill bg-[#F6F3EE] px-2.5 py-1 text-[12.5px] font-semibold">
            {aside}
          </span>
        ) : (
          <Icon name="chev-r" className="size-4 shrink-0 text-ardoise" />
        )}
      </Link>
    </li>
  );
}

/**
 * Compte (docs/ux-mobile-talent V6 § B6, screens 61 and 62): a page, not a menu. The profile card
 * with its pencil, « Protégez votre compte » while there is no password, the plan, Orbi's credits,
 * account and privacy, preferences (theme, language), help and invitation, sign out. Each row opens
 * the existing page; nothing here is invented.
 */
export default async function AccountPage() {
  const user = await requireUser("/app/compte");
  // Organization and partner spaces keep their own pages.
  if (await getActiveSpace(user.id)) redirect("/app/hire");
  if (await getPartnerSpace(user.id)) redirect("/app/partenaire");
  const t = await getTranslations("accountPage");
  const tv = await getTranslations("talent.profile.visibility");
  const format = await getFormatter();
  const subject = { type: "user" as const, id: user.id };
  const [profile, password, plan, credits] = await Promise.all([
    db.talentProfile.findUnique({
      where: { userId: user.id },
      select: { headline: true, desiredJobTitles: true, visibility: true },
    }),
    db.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { id: true },
    }),
    resolvePlan(db, subject),
    usage(db, subject, AI_CREDITS_KEY),
  ]);
  const subscription = plan?.subscriptionId
    ? await db.subscription.findUnique({
        where: { id: plan.subscriptionId },
        select: { currentPeriodEnd: true, cancelAtPeriodEnd: true },
      })
    : null;
  const role = profile?.headline || profile?.desiredJobTitles[0];
  const line = [role, user.city].filter(Boolean).join(" · ");
  const date = (value: Date) => format.dateTime(value, { day: "numeric", month: "short" });
  const planLine = !subscription
    ? t("plan.free")
    : subscription.cancelAtPeriodEnd || plan?.status === "canceled"
      ? t("plan.ends", { date: date(subscription.currentPeriodEnd) })
      : t("plan.renews", { date: date(subscription.currentPeriodEnd) });
  const creditsLine =
    credits.limit < 0
      ? t("orbi.unlimited")
      : credits.limit === 0
        ? t("orbi.none")
        : t("orbi.credits", { used: credits.used, limit: credits.limit });
  const visibility = profile?.visibility ?? "private";

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4">
      <h1 className="sr-only">{t("metaTitle")}</h1>

      <section className="relative flex items-center gap-3.5 rounded-[24px] bg-blanc p-4 shadow-douce">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- the photo is a 512 px square
          <img src={user.image} alt="" className="size-16 shrink-0 rounded-full object-cover" />
        ) : (
          <span
            aria-hidden
            className="grid size-16 shrink-0 place-items-center rounded-full bg-lime text-[18px] font-bold text-sapin"
          >
            {initials(user.name)}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-[3px] pr-10">
          <p className="truncate text-[17px] font-semibold">{user.name}</p>
          <p className="truncate text-[13px] text-ardoise">{line || t("noTitle")}</p>
          {plan && (
            <span className="mt-1 self-start rounded-pill bg-lime-clair px-2.5 py-1 text-[12px] font-medium">
              {plan.planName}
            </span>
          )}
        </div>
        <Link
          href="/app/profil"
          aria-label={t("edit")}
          className="jm-top-plus absolute top-3 right-3 grid size-[38px] place-items-center rounded-full"
        >
          <Icon name="edit" className="size-[18px]" />
        </Link>
      </section>

      {!password && (
        <section className="jm-alert-secure flex items-center gap-3 rounded-[22px] p-3.5">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[#FCE7BC] text-[#7a4d00]"
          >
            <Icon name="lock" className="size-5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="text-[15px] font-semibold">{t("protect.title")}</h2>
            <p className="text-[13px] text-ardoise">{t("protect.text")}</p>
          </div>
          <Link
            href="/mot-de-passe-oublie"
            className="flex min-h-11 shrink-0 items-center rounded-pill bg-gradient-principal px-5 text-[15px] font-semibold text-blanc shadow-[var(--jm-ombre-principal)]"
          >
            {t("protect.cta")}
          </Link>
        </section>
      )}

      <section aria-label={t("group.subscription")} className="flex flex-col gap-2">
        <h2 className="mx-1 text-[11.5px] font-bold tracking-[0.06em] text-ardoise uppercase">
          {t("group.subscription")}
        </h2>
        <Link
          href="/app/abonnement"
          className="flex min-h-[64px] items-center gap-3 rounded-[22px] bg-blanc px-3.5 shadow-douce"
        >
          <Tile icon="portefeuille" tone="bg-lime" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-semibold">
              {t("plan.title", { plan: plan?.planName ?? "" })}
            </span>
            <span className="truncate text-[13px] text-ardoise">{planLine}</span>
          </span>
          <span className="shrink-0 rounded-pill bg-[#F6F3EE] px-2.5 py-1 text-[12.5px] font-semibold">
            {t("plan.manage")}
          </span>
        </Link>
        <Link
          href="/app/parametres?onglet=confidentialite"
          className="jm-ai-surface flex min-h-[64px] items-center gap-3 rounded-[22px] px-3.5 text-blanc"
        >
          <span
            aria-hidden
            className="jm-orbi-dot grid size-8 shrink-0 place-items-center rounded-full text-sapin"
          >
            <Icon name="intelligence" className="size-4" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[15px] font-semibold">{t("orbi.title")}</span>
            <span className="truncate text-[13px] text-blanc/75">{creditsLine}</span>
          </span>
          <Icon name="chev-r" className="size-4 shrink-0 text-lime" />
        </Link>
      </section>

      <Group title={t("group.account")}>
        <LinkRow
          href="/app/parametres?onglet=compte"
          icon="profil"
          tone="bg-neon"
          label={t("info")}
        />
        <LinkRow
          href="/app/parametres?onglet=securite"
          icon="securite"
          tone="bg-[#BFEFDF]"
          label={t("security")}
        />
        <LinkRow
          href="/app/parametres?onglet=donnees"
          icon="confidentialite"
          tone="bg-brume"
          label={t("privacy")}
        />
        <LinkRow
          href="/app/profil?partie=visibilite"
          icon="eye"
          tone="bg-[#F6F3EE]"
          label={t("visibility")}
          aside={dynamic(tv)(`${visibility}.text`)}
        />
      </Group>

      <Group title={t("group.preferences")}>
        <LinkRow
          href="/app/notifications"
          icon="notification"
          tone="bg-lime"
          label={t("notifications")}
        />
        <li className={cx(row, "border-t border-sapin/6")}>
          <Tile icon="reglages" tone="bg-[#BFEFDF]" />
          <span className="min-w-0 flex-1 text-[15px] font-semibold">{t("theme.label")}</span>
          <ThemeSwitch
            current={user.theme}
            labels={{
              group: t("theme.label"),
              light: t("theme.light"),
              green: t("theme.green"),
              saved: t("theme.saved"),
            }}
          />
        </li>
        <li className={cx(row, "border-t border-sapin/6")}>
          <Tile icon="langue" tone="bg-neon" />
          <span className="min-w-0 flex-1 text-[15px] font-semibold">{t("language.label")}</span>
          <span className="shrink-0 rounded-pill bg-[#F6F3EE] px-2.5 py-1 text-[12.5px] font-semibold">
            {t("language.value")}
          </span>
        </li>
      </Group>

      <Group title={t("group.help")}>
        <LinkRow href="/contact" icon="info" tone="bg-[#BFEFDF]" label={t("helpLink")} />
        <li className="border-t border-sapin/6">
          <InviteButton
            url={siteUrl()}
            labels={{
              title: t("invite.title"),
              text: t("invite.text"),
              copied: t("invite.copied"),
            }}
            className={cx(row, "hover:bg-sapin/3")}
          >
            <Tile icon="partager" tone="bg-lime" />
            <span className="min-w-0 flex-1 text-[15px] font-semibold">{t("invite.label")}</span>
          </InviteButton>
        </li>
      </Group>

      <form action={signOut}>
        <button
          type="submit"
          className="jm-logout flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[20px] bg-blanc text-[16px] font-semibold text-[#B8412F] shadow-douce"
        >
          <Icon name="logout" className="size-5" />
          {t("logout")}
        </button>
      </form>
    </div>
  );
}
