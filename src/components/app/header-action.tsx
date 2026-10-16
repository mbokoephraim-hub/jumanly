import Link from "next/link";
import { Icon, type IconName } from "@/components/brand/icon";

/**
 * « Reprendre… » / « Revoir… » in the top right of a page title (Admin v4, étape 8): the quickest
 * way back to what the person did last (a course, a CV, a session, a result).
 */
export function HeaderAction({
  href,
  label,
  icon = "suivant",
}: {
  href: string;
  label: string;
  icon?: IconName;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 max-w-full items-center gap-2 rounded-pill bg-sapin px-5 text-[14px] font-semibold text-blanc shadow-[0_6px_16px_rgb(15_63_55/0.18)] hover:bg-sapin/90"
    >
      <Icon name={icon} className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
