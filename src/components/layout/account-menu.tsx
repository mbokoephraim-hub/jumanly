import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/brand/icon";
import { Avatar, Badge } from "@/components/ui";
import { cx } from "@/lib/cx";
import { signOut } from "@/server/actions/auth";

export type AccountSummary = { name: string; planName: string; isAdmin: boolean };

const items = [
  { key: "account.menu.profile", href: "/app/profil", icon: "profil" },
  { key: "account.menu.subscription", href: "/app/abonnement", icon: "portefeuille" },
  { key: "account.menu.quotas", href: "/app/abonnement", icon: "statistiques" },
  { key: "account.menu.certificates", href: "/app/learn/attestations", icon: "certificat" },
  { key: "account.menu.settings", href: "/app/parametres", icon: "reglages" },
  {
    key: "account.menu.howMatchingWorks",
    href: "/comment-fonctionne-le-matching",
    icon: "transparence",
  },
  { key: "account.menu.activateLicense", href: "/activer", icon: "lock" },
] as const satisfies readonly { key: string; href: string; icon: IconName }[];

/**
 * Account menu (mockup 00-04): a white pill with the avatar opens a floating card. A native
 * disclosure, no JavaScript needed.
 */
export function AccountMenu({
  account,
  tone,
}: {
  account: AccountSummary;
  tone: "light" | "dark";
}) {
  const t = useTranslations();
  const item = "flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm hover:bg-creme";
  const roleBadge = t("account.menu.roleBadge.text", {
    space: t("account.menu.roleBadge.talent"),
    plan: account.planName,
  });
  return (
    <details className="relative">
      <summary
        aria-label={t("account.menu.aria")}
        className={cx(
          "flex cursor-pointer list-none items-center gap-2.5 rounded-pill [&::-webkit-details-marker]:hidden",
          tone === "light" && "bg-blanc py-[5px] pr-3.5 pl-[5px]",
        )}
      >
        <Avatar name={account.name} size="sm" />
        {tone === "light" && (
          <span className="hidden max-w-36 flex-col leading-tight xl:flex">
            <span className="truncate text-[13px] font-semibold">{account.name}</span>
            <span className="truncate text-[11px] text-ardoise">{roleBadge}</span>
          </span>
        )}
        {tone === "light" && <Icon name="chev-d" className="size-4 text-ardoise" />}
      </summary>
      <div className="absolute right-0 z-30 mt-2 flex w-[300px] flex-col rounded-box bg-blanc p-2.5 text-sapin shadow-menu">
        <div className="flex items-center gap-2.5 p-2.5">
          <Avatar name={account.name} size="md" />
          <div className="flex min-w-0 flex-col items-start gap-1">
            <span className="truncate text-[13px] font-semibold">{account.name}</span>
            <Badge tone="lime" className="h-5 text-[10px]">
              {roleBadge}
            </Badge>
          </div>
        </div>
        <ul className="flex flex-col border-y border-brume py-1">
          {items.map(({ key, href, icon }) => (
            <li key={key}>
              <Link href={href} className={item}>
                <Icon name={icon} className="size-[18px]" />
                {t(key)}
              </Link>
            </li>
          ))}
          {account.isAdmin && (
            <li>
              <Link href="/admin" className={item}>
                <Icon name="securite" className="size-[18px]" />
                {t("appNav.admin")}
              </Link>
            </li>
          )}
        </ul>
        <form action={signOut} className="pt-1">
          <button type="submit" className={cx(item, "w-full text-left text-down-texte")}>
            <Icon name="logout" className="size-[18px]" />
            {t("account.menu.logout")}
          </button>
        </form>
      </div>
    </details>
  );
}
