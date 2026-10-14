import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";

/** Breadcrumb: a few links then the current page. */
export async function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  const t = await getTranslations("ui");
  return (
    <nav aria-label={t("breadcrumb")} className="text-sm text-ardoise">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1">
            {index > 0 && <Icon name="suivant" className="size-3.5" />}
            {item.href ? (
              <Link href={item.href} className="underline hover:text-sapin">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-sapin">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Query string of a list page with one value changed (page, filter). Empty values are dropped. */
export function withParams(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "" && !(key === "page" && Number(value) === 1))
      query.set(key, String(value));
  }
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

/** Page numbers around the current one (at most five), for the numbered pagination. */
function pageWindow(page: number, pageCount: number) {
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const end = Math.min(pageCount, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

/** Mockups 01-10 and 01-12: ghost « Précédent / Suivant », page discs on wide screens. */
export async function Pagination({
  page,
  pageCount,
  path,
  params,
  labels,
}: {
  page: number;
  pageCount: number;
  path: string;
  params: Record<string, string | number | undefined>;
  labels: { prev: string; next: string; page: string };
}) {
  const t = await getTranslations("ui");
  if (pageCount <= 1) return null;
  const ghost =
    "flex h-11 items-center gap-1.5 rounded-pill px-[18px] text-sm font-semibold ring-[1.5px] ring-brume ring-inset";
  return (
    <nav aria-label={t("pagination")} className="flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link
          href={withParams(path, { ...params, page: page - 1 })}
          className={`${ghost} bg-blanc/0 transition-colors hover:bg-blanc`}
          rel="prev"
        >
          <Icon name="chev-l" className="size-4" />
          {labels.prev}
        </Link>
      ) : (
        <span aria-hidden className={`${ghost} text-ardoise`}>
          <Icon name="chev-l" className="size-4" />
          {labels.prev}
        </span>
      )}
      <div className="flex items-center gap-2">
        <ol className="hidden items-center gap-2 md:flex">
          {pageWindow(page, pageCount).map((number) => (
            <li key={number}>
              {number === page ? (
                <span
                  aria-hidden
                  className="flex size-10 items-center justify-center rounded-full bg-sapin text-sm font-semibold text-blanc"
                >
                  {number}
                </span>
              ) : (
                <Link
                  href={withParams(path, { ...params, page: number })}
                  className="flex size-10 items-center justify-center rounded-full bg-blanc text-sm font-semibold transition-colors hover:bg-lime"
                >
                  {number}
                </Link>
              )}
            </li>
          ))}
        </ol>
        <p className="text-[13px] text-ardoise md:ml-2" aria-current="page">
          {labels.page}
        </p>
      </div>
      {page < pageCount ? (
        <Link
          href={withParams(path, { ...params, page: page + 1 })}
          className={`${ghost} transition-colors hover:bg-blanc`}
          rel="next"
        >
          {labels.next}
          <Icon name="chev-r" className="size-4" />
        </Link>
      ) : (
        <span aria-hidden className={`${ghost} text-ardoise`}>
          {labels.next}
          <Icon name="chev-r" className="size-4" />
        </span>
      )}
    </nav>
  );
}
