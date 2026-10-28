import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CvReader } from "@/components/phone/cv/reader";
import { CvTexts } from "@/components/phone/cv/texts";
import { previewData } from "@/features/cv/document";
import { cvSourceOf } from "@/features/cv/source";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("phoneCv.reader");
  return { title: t("seo"), robots: { index: false } };
}

const FILE_TYPES = ["pdf", "docx", "image"] as const;

/**
 * « Lire » a CV of « Mes CV » (Ephraïm, 27/10): opened from the library and closed back to it.
 * After an import, `?importe=garde|profil` says where the CV went.
 */
export default async function CvReaderPage({
  params,
  searchParams,
}: PageProps<"/app/career/cv/[id]/lire">) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser(`/app/career/cv/${id}/lire`);
  const cv = await db.document.findFirst({
    where: { id: id.slice(0, 60), kind: "cv", profile: { userId: user.id } },
  });
  if (!cv) notFound();
  const type = FILE_TYPES.find((kind) => kind === cv.fileType);
  const file = cv.fileKey && type ? { type, name: cv.fileName ?? cv.title } : null;
  // A PDF or a photo is shown as it is; a Word file and a CV made here through their layout.
  let preview = null;
  let empty = false;
  if (!file || file.type === "docx") {
    const owner = await db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { image: true },
    });
    const source = cvSourceOf(cv, owner.image);
    const { data, demo } = await previewData(source);
    preview = { data, template: source.template, style: source.style };
    empty = !file && demo;
  }
  const count = Number(query.ajouts);
  const notice =
    query.importe === "garde"
      ? ({ kind: "garde" } as const)
      : query.importe === "profil"
        ? ({ kind: "profil", count: Number.isFinite(count) ? count : 0 } as const)
        : null;
  return (
    <CvTexts>
      <CvReader
        cvId={cv.id}
        title={cv.title}
        primary={cv.isPrimary}
        file={file}
        preview={preview}
        empty={empty}
        notice={notice}
      />
    </CvTexts>
  );
}
