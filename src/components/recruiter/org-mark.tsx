import { initials } from "@/components/ui/avatar";
import { cx } from "@/lib/cx";

/** Logo of an organization in its round (planche `.lg-e`): the logo, or its initials on Sapin. */
export function OrgMark({
  name,
  logo,
  size = "xs",
}: {
  name: string;
  logo?: string | null;
  size?: "xs" | "sm" | "md";
}) {
  return (
    <span aria-hidden className={cx("t-lg-e t-sap", size !== "md" && `t-${size}`)}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- a small WebP already resized
        <img src={logo} alt="" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
