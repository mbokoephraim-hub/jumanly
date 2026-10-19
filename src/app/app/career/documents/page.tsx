import { permanentRedirect } from "next/navigation";

/**
 * Letters moved to « CV et documents » (planche talent-4 § 6, onglet « Lettres »): the former
 * address keeps only this redirect. A letter itself stays at /app/career/documents/[id].
 */
export default function DocumentsPage() {
  permanentRedirect("/app/career/cv?vue=lettres");
}
