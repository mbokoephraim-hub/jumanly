import { redirect } from "next/navigation";

/** The old list of paths: Orbi suggests a path in « Rechercher » when its courses are found. */
export default function LearnPathsRedirect() {
  redirect("/app/learn/rechercher");
}
