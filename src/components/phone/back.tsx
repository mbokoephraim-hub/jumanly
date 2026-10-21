"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhoneIcon } from "./icon";
import { pagesSeen } from "./pages-seen";

/**
 * « Retour » of the phone interface (brief § 3, rule 3): one page back. A page opened directly
 * (no earlier page of Jumanly in this tab) goes to `fallback`, its parent. `history={false}`: the
 * end of a journey that always goes to the same place (the interview's report → the application).
 */
export function PhoneBack({
  fallback,
  label,
  text,
  history = true,
}: {
  fallback: string;
  label: string;
  /** A word beside the chevron (« Fil »), as on some screens of the mockup. */
  text?: string;
  history?: boolean;
}) {
  const router = useRouter();
  return (
    <Link
      href={fallback}
      className="nb-retour"
      aria-label={text ? undefined : label}
      data-retour=""
      onClick={(event) => {
        if (!history || event.metaKey || event.ctrlKey || event.shiftKey) return;
        if (pagesSeen() <= 1) return;
        event.preventDefault();
        router.back();
      }}
    >
      <PhoneIcon name="retour" size={22} stroke={2} />
      {text ? <span>{text}</span> : null}
    </Link>
  );
}
