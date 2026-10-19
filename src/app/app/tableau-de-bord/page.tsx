import { permanentRedirect } from "next/navigation";

/** Former dashboard (ancien design, refonte étape 1 · lot 7): the home of the talent space replaces it. */
export default function FormerDashboardPage() {
  permanentRedirect("/app");
}
