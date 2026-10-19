import { initials } from "@/components/ui/avatar";
import { cx } from "@/lib/cx";

/** A person of the talent space (planche `.av`): the photo, or the initials on the accent. */
export function TalentAvatar({
  name,
  image,
  className,
}: {
  name: string;
  image?: string | null;
  className?: string;
}) {
  return (
    <span aria-hidden className={cx("t-av", className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- the photo is a 512 px square
        <img src={image} alt="" loading="lazy" decoding="async" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
