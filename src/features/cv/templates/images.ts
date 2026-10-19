import { cvTemplateRegistry, type CvTemplate } from "./registry";

/**
 * The real preview of a template (public/cv-templates, made from docs/modeles-cv): « 05-colonne.png »
 * for the fifth template of the registry.
 */
export function templateImage(template: Pick<CvTemplate, "id">) {
  const index = cvTemplateRegistry.findIndex((item) => item.id === template.id);
  return `/cv-templates/${String(index + 1).padStart(2, "0")}-${template.id}.png`;
}
