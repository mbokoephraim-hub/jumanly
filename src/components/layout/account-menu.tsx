import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon, type IconName } from "@/components/brand/icon";
import { Avatar, Badge } from "@/components/ui";
import { cx } from "@/lib/cx";
import { signOut } from "@/server/actions/auth";

export type AccountSummary = {
  name: string;
  planName: string;
  isAdmin: boolean;
  image?: string | null;
  /** Listed in TESTER_EMAILS: the « Mode testeur » panel (compte passe-partout). */
  isTester?: boolean;
};

/** Talent space on a computer (prompt 2): the shortcuts of the phone's avatar menu come first. */
const talentItems = [
  { key: "appNav.topMenu.messages", href: "/app/messages", icon: "message" },
  { key: "appNav.topMenu.cvs", href: "/app/career/cv", icon: "cv" },
  { key: "appNav.topMenu.dashboard", href: "/app/tableau-de-bord", icon: "statistiques" },
] as const satisfies readonly { key: string; href: string; icon: IconName }[];

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
  talent = false,
}: {
  account: AccountSummary;
  /** Personal space: adds the talent shortcuts and « Tout Mon espace ». */
  talent?: boolean;
  /** "rail": the avatar at the foot of the column of icons, the menu opening beside it. */
  tone: "light" | "dark" | "rail";
}) {
  const t = useTranslations();
  const item = "flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm hover:bg-creme";
  const roleBadge = t("account.menu.roleBadge.text", {
    space: t("account.menu.roleBadge.talent"),
    plan: account.planName,
  });
  return (
    <details className="group/account relative shrink-0">
      <summary
        aria-label={t("account.menu.aria")}
        className={cx(
          "flex cursor-pointer list-none items-center gap-2.5 rounded-pill [&::-webkit-details-marker]:hidden",
          tone === "light" && "bg-blanc py-[5px] pr-3.5 pl-[5px]",
          tone === "rail" &&
            "jm-admin-link relative mt-1 ring-2 ring-lime/70 group-open/account:ring-lime",
        )}
      >
        <Avatar name={account.name} size="sm" />
        {tone === "rail" && (
          <span aria-hidden className="jm-admin-tip">
            {account.name} · {account.planName}
          </span>
        )}
        {tone === "light" && (
          <span className="hidden max-w-36 flex-col leading-tight xl:flex">
            <span className="truncate text-[13px] font-semibold">{account.name}</span>
            <span className="truncate text-[11px] text-ardoise">{roleBadge}</span>
          </span>
        )}
        {tone === "light" && <Icon name="chev-d" className="size-4 text-ardoise" />}
      </summary>
      <div
        className={cx(
          "absolute z-30 flex max-h-[calc(100dvh-24px)] w-[300px] flex-col overflow-y-auto rounded-box bg-blanc p-2.5 text-sapin shadow-menu",
          tone === "rail" ? "bottom-0 left-[calc(100%+22px)]" : "right-0 mt-2",
        )}
      >
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
          {[...(talent ? talentItems : []), ...items].map(({ key, href, icon }) => (
            <li key={key}>
              <Link href={href} className={item}>
                <Icon name={icon} className="size-[18px]" />
                {t(key)}
              </Link>
            </li>
          ))}
          {account.isTester && (
            <li>
              <Link href="/app/testeur" className={item}>
                <Icon name="portefeuille" className="size-[18px]" />
                {t("account.menu.tester")}
              </Link>
            </li>
          )}
          {account.isAdmin && (
            <li>
              <Link href="/admin" className={item}>
                <Icon name="securite" className="size-[18px]" />
                {t("appNav.admin")}
              </Link>
            </li>
          )}
        </ul>
        {talent && (
          <Link href="/app/espace" className={cx(item, "mt-1 font-semibold text-feuille-fonce")}>
            {t("appNav.topMenu.all")}
            <Icon name="chev-r" className="ml-auto size-4" />
          </Link>
        )}
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
