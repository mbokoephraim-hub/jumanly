import { redirect } from "next/navigation";

/** The old page of attestations: « Mes attestations » is a view of « Mes formations ». */
export default function CertificatesRedirect() {
  redirect("/app/learn/mes-formations?vue=attestations");
}
