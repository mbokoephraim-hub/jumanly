import { redirect } from "next/navigation";

/** Former address of the saved offers: they are the « Enregistrées » tab of Offres (lot 3). */
export default function SavedJobsRedirect() {
  redirect("/app/jobs?vue=enregistrees");
}
