import { redirect } from "next/navigation";

/** The former « Demandes de connexion » page: now the « Demandes » tab of « Connexions ». */
export default function RequestsPage() {
  redirect("/app/messages/connexions?onglet=demandes");
}
