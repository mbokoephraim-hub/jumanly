import { redirect } from "next/navigation";
import { isPhone } from "@/server/view";

/**
 * The old page of attestations: « Mes attestations » is a view of « Mes formations », and a
 * rubric of the Formation tab on the phone (Modèle B, lot B7).
 */
export default async function CertificatesRedirect() {
  redirect(
    (await isPhone())
      ? "/app/learn?onglet=attestations"
      : "/app/learn/mes-formations?vue=attestations",
  );
}
