import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MobileCvEditor } from "@/components/talent/cv/mobile-editor";
import { CvStudio } from "@/components/talent/cv/studio/studio";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docs.editor");
  return { title: t("seo"), robots: { index: false } };
}

/**
 * The CV studio, one address for every width: the phone editor below 768 px (planche talent-4
 * § 6, `.t-mob`), the studio in three panels on a tablet and a computer (planche studio-cv,
 * `.t-sc-studio`). Both read the same address (`?vue=`, `?partie=`, `?adapter=`).
 */
export default async function CvEditorPage({
  params,
  searchParams,
}: PageProps<"/app/career/cv/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <>
      <div className="t-mob">
        <MobileCvEditor id={id} query={query} />
      </div>
      <CvStudio id={id} query={query} />
    </>
  );
}
