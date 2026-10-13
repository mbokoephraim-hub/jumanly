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
  const linkClass = "flex h-11 items-center gap-1 rounded-pill px-4 font-medium hover:bg-blanc";
  return (
    <nav aria-label={t("pagination")} className="flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link
          href={withParams(path, { ...params, page: page - 1 })}
          className={linkClass}
          rel="prev"
        >
          <Icon name="suivant" className="size-4 rotate-180" />
          {labels.prev}
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-ardoise" aria-current="page">
        {labels.page}
      </p>
      {page < pageCount ? (
        <Link
          href={withParams(path, { ...params, page: page + 1 })}
          className={linkClass}
          rel="next"
        >
          {labels.next}
          <Icon name="suivant" className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
