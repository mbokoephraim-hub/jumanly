import Link from "next/link";
import { HireIcon, type HireIconName } from "./icon";

/**
 * The empty state of a block of the recruiter's web app v3: the dashed frame of the prototype
 * (`.vempty`), an icon, a sentence and one action. It fills the block, so neighbouring blocks keep
 * the same height and an organization without offers never sees a big white block.
 */
export function HireEmpty({
  icon,
  title,
  text,
  action,
  compact,
}: {
  icon: HireIconName;
  title: string;
  text?: string;
  action?: { href: string; label: string; icon?: HireIconName };
  compact?: boolean;
}) {
  return (
    <div className={compact ? "vempty hv3-vide compact" : "vempty hv3-vide"}>
      <HireIcon name={icon} />
      <b>{title}</b>
      {text ? <span className="meta">{text}</span> : null}
      {action ? (
        <Link className="btn sm ghost" href={action.href}>
          {action.icon ? <HireIcon name={action.icon} size="s" /> : null}
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
