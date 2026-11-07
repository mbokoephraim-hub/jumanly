import { redirect } from "next/navigation";

/**
 * « /app/explorer » alone (évaluation talent du 07/11/2026): the Explorer tab lives at /app/jobs,
 * its lists under /app/explorer/[liste]. A typed or shared address lands on the tab instead of a 404.
 */
export default function ExplorerRootPage() {
  redirect("/app/jobs");
}
