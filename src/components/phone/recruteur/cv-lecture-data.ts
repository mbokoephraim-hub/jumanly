import "server-only";
import { previewData } from "@/features/cv/document";
import { loadCvSource } from "@/features/cv/source";
import { db } from "@/server/db";
import { originalCvRef } from "@/server/services/application-cv";

/**
 * What the CV reader needs for one application: its file (an imported PDF or a photo), or the
 * layout of a CV made on Jumanly, and its title. The demo layout never stands in for a real CV.
 */
export async function cvReadingOf(
  application: { id: string; cvSnapshot: unknown },
  fallbackTitle: string,
) {
  const ref = await originalCvRef(application.cvSnapshot);
  const file = ref?.type === "pdf" || ref?.type === "image" ? ref.type : null;
  let preview = null;
  if (!file) {
    const source = await loadCvSource(db, "application", application.id);
    if (source) {
      const { data, demo } = await previewData(source);
      preview = demo ? null : { data, template: source.template, style: source.style };
    }
  }
  const snapshot = application.cvSnapshot as { title?: unknown } | null;
  const title =
    snapshot?.title && typeof snapshot.title === "string" ? snapshot.title : fallbackTitle;
  return { file, preview, title, fileUrl: `/app/hire/candidats/${application.id}/cv` };
}
