import { redirect } from "next/navigation";

/** The edit form is the Page entreprise itself since étape 3 (A3): old links lead there. */
export default function OrganizationEditPage() {
  redirect("/app/organisation");
}
