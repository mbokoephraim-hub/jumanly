"use server";

import { redirect } from "next/navigation";

/** Public form: the number typed leads to /attestations/{code}; the page says if it exists. */
export async function lookupCertificateAction(formData: FormData) {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 20);
  redirect(code ? `/attestations/${code}` : "/attestations");
}
