import { permanentRedirect } from "next/navigation";

/** Former Career home (ancien design, refonte étape 1 · lot 7): the CV is where the career tools start. */
export default function FormerCareerPage() {
  permanentRedirect("/app/career/cv");
}
