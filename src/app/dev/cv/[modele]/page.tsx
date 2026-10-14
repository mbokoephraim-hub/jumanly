import { notFound } from "next/navigation";
import { Suspense } from "react";
import "@/features/cv/templates/print.css";
import { exampleDocumentData } from "@/features/cv/document";
import { cvExamples, type CvExampleId } from "@/features/cv/examples";
import { CvDocument } from "@/features/cv/render/CvDocument";
import { EXAMPLE_PHOTO } from "@/features/cv/render/build";
import { PrintReady } from "@/features/cv/render/PrintReady";
import { cvStyleSchema, defaultStyle, resolveStyle } from "@/features/cv/style";
import { findTemplate } from "@/features/cv/templates/registry";

/**
 * A template with a demonstration CV, exactly as the export prints it (local and preview only):
 * visual comparison with docs/modeles-cv/modeles/apercus and page counts of the tests.
 * `?donnees=junior|senior|academique&densite=&couleur=&police=&lg=fr|en&photo=1&vide=1`
 */
export default function DevCvPage(props: PageProps<"/dev/cv/[modele]">) {
  return (
    <Suspense>
      <DevCv {...props} />
    </Suspense>
  );
}

async function DevCv({ params, searchParams }: PageProps<"/dev/cv/[modele]">) {
  const [{ modele }, query] = await Promise.all([params, searchParams]);
  const template = findTemplate(modele);
  if (!template) notFound();
  const value = (key: string) => (typeof query[key] === "string" ? query[key] : undefined);
  const example = (value("donnees") ?? "junior") as CvExampleId;
  if (!(example in cvExamples)) notFound();
  const style = resolveStyle(
    {
      ...defaultStyle(template),
      density: value("densite"),
      accent: value("couleur"),
      font: value("police"),
      titlesLanguage: value("lg"),
      showPhoto: value("photo") === "1",
    },
    template,
  );
  cvStyleSchema.parse(style);
  const data = await exampleDocumentData(example, style);
  if (value("vide") === "1") data.blocks = [];
  if (!style.showPhoto) delete data.photoUrl;
  else data.photoUrl ??= EXAMPLE_PHOTO;
  return (
    <>
      <CvDocument data={data} template={template} style={style} />
      <PrintReady />
    </>
  );
}
