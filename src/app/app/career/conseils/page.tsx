import { permanentRedirect } from "next/navigation";

/** Former preparation tips (ancien design, refonte étape 1 · lot 7): they open inline in « S’entraîner aux entretiens », the courses are in Learn. */
export default function FormerTipsPage() {
  permanentRedirect("/app/learn");
}
