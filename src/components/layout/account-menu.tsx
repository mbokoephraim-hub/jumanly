import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui";
import { signOut } from "@/server/actions/auth";

export type AccountSummary = { name: string; planName: string; isAdmin: boolean };

/** Account menu (textes `account.menu.*`): a native disclosure, no JavaScript needed. */
export function AccountMenu({
  account,
  tone,
}: {
  account: AccountSummary;
  tone: "light" | "dark";
}) {
  const t = useTranslations();
  const item = "block rounded-sm px-3 py-2 hover:bg-creme";
  return (
    <details className="relative">
      <summary
        aria-label={t("account.menu.aria")}
        className="flex cursor-pointer list-none items-center rounded-full [&::-webkit-details-marker]:hidden"
      >
        <Avatar name={account.name} size="sm" />
      </summary>
      <div
        className={
          tone === "dark"
            ? "absolute right-0 z-30 mt-2 w-64 rounded-md bg-blanc p-2 text-sapin shadow-lg"
            : "absolute right-0 z-30 mt-2 w-64 rounded-md border border-brume bg-blanc p-2 text-sapin"
        }
      >
        <p className="px-3 pt-2 font-semibold">{account.name}</p>
        <p className="px-3 pb-2 text-ardoise text-caption">
          {t("account.menu.roleBadge.text", {
            space: t("account.menu.roleBadge.talent"),
            plan: account.planName,
          })}
        </p>
        <ul className="flex flex-col border-t border-brume pt-2 text-[15px]">
          <li>
            <Link href="/app/profil" className={item}>
              {t("account.menu.profile")}
            </Link>
          </li>
          <li>
            <Link href="/app/abonnement" className={item}>
              {t("account.menu.subscription")}
            </Link>
          </li>
          <li>
            <Link href="/app/parametres" className={item}>
              {t("account.menu.settings")}
            </Link>
          </li>
          {account.isAdmin && (
            <li>
              <Link href="/admin" className={item}>
                {t("appNav.admin")}
              </Link>
            </li>
          )}
          <li>
            <Link href="/faq" className={item}>
              {t("account.menu.help")}
            </Link>
          </li>
          <li>
            <form action={signOut}>
              <button type="submit" className={`${item} w-full text-left`}>
                {t("account.menu.logout")}
              </button>
            </form>
          </li>
        </ul>
      </div>
    </details>
  );
}
