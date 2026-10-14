import "server-only";
import { cvTextLabels } from "./labels";
import { documentFromCv, documentFromExample } from "./render/build";
import type { CvDocumentData } from "./render/model";
import { cvExamples, type CvExampleId } from "./examples";
import type { CvSource } from "./source";
import type { CvStyle } from "./style";
import { isEmptyCv } from "@/server/services/cv";

/** What a CV prints, with its titles in the language chosen for it. */
export async function cvDocumentData(source: CvSource): Promise<CvDocumentData> {
  const labels = await cvTextLabels(source.style.titlesLanguage);
  return documentFromCv(source.content, labels, source.photoUrl);
}

/** A demonstration CV, for an empty CV in the gallery and for the visual tests. */
export async function exampleDocumentData(
  id: CvExampleId,
  style: Pick<CvStyle, "titlesLanguage">,
): Promise<CvDocumentData> {
  return documentFromExample(cvExamples[id], await cvTextLabels(style.titlesLanguage));
}

/** The person's CV, or the demonstration one while theirs is empty (§ 8.4). */
export async function previewData(source: CvSource) {
  if (isEmptyCv(source.content)) {
    return { data: await exampleDocumentData("junior", source.style), demo: true };
  }
  return { data: await cvDocumentData(source), demo: false };
}
