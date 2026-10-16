import { getTranslations } from "next-intl/server";
import { Skeleton } from "@/components/ui";

/**
 * Shown the instant a page of the signed-in space or of the admin is opened, while its data loads
 * (ux-test, étape 1): the shell stays, the page takes its usual shape (title, figures, cards), so
 * the click is visibly taken into account even on a slow network.
 */
export async function PageLoading() {
  const t = await getTranslations("loading");
  return (
    <div role="status" aria-label={t("aria")} data-page-loading className="flex flex-col gap-5">
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="size-10 rounded-[12px]" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-64 max-w-[70vw]" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-28 rounded-[20px] bg-blanc" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Skeleton className="h-72 rounded-[22px] bg-blanc" />
        <Skeleton className="h-72 rounded-[22px] bg-blanc" />
      </div>
      <span className="sr-only">{t("generic")}</span>
    </div>
  );
}
