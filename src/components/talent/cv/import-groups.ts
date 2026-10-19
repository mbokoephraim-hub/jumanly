import type { getTranslations } from "next-intl/server";
import type { parseImport } from "@/server/services/cv-import";

type Read = NonNullable<ReturnType<typeof parseImport>>;
type T = Awaited<ReturnType<typeof getTranslations<"docs.import">>>;

/**
 * What a CV import found, group by group (planche talent-4 § 6, studio-cv § 1): experiences,
 * skills, diplomas, each with its first items. Empty groups are left out.
 */
export function importGroups(read: Read, t: T) {
  const preview = (items: string[]) =>
    items.length > 2 ? `${items.slice(0, 2).join(", ")}…` : items.join(", ");
  return [
    {
      key: "experiences",
      icon: "entreprise" as const,
      tone: "t-c2",
      title: t("found.experiences", { count: read.experiences.length }),
      line: preview(
        read.experiences.map((item) => [item.title, item.company].filter(Boolean).join(", ")),
      ),
      count: read.experiences.length,
    },
    {
      key: "skills",
      icon: "cap" as const,
      tone: "t-c1",
      title: t("found.skills", { count: read.skills.length }),
      line: preview(read.skills),
      count: read.skills.length,
    },
    {
      key: "educations",
      icon: "former" as const,
      tone: "t-c3",
      title: t("found.educations", { count: read.educations.length }),
      line: preview(
        read.educations.map((item) => [item.degree, item.school].filter(Boolean).join(", ")),
      ),
      count: read.educations.length,
    },
  ].filter((group) => group.count > 0);
}
