import { cx } from "@/lib/cx";
import { getActiveBanners } from "@/server/queries/public";
import type { BannerAudience } from "@/server/services/contents";

/** Banners published in /admin/contenus for this public (none: nothing is rendered). */
export async function ContentBanners({ audience }: { audience: BannerAudience }) {
  const banners = await getActiveBanners(audience);
  if (banners.length === 0) return null;
  return (
    <div className="flex flex-col">
      {banners.map((banner) => (
        <p
          key={banner.id}
          data-banner={banner.id}
          className={cx(
            "page-x py-2.5 text-center text-sm font-medium",
            // Sapin text on Lime, never white (CLAUDE.md § 10).
            banner.style === "warning" ? "bg-ambre/20 text-nuit" : "bg-lime text-sapin",
          )}
        >
          {banner.text}
        </p>
      ))}
    </div>
  );
}
