import { permanentRedirect } from "next/navigation";

/** Former « Mon espace » (ancien design, refonte étape 1 · lot 7): Compte replaces it. */
export default function FormerSpacePage() {
  permanentRedirect("/app/compte");
}
