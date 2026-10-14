import { getTranslations } from "next-intl/server";
import { Button, TextField } from "@/components/ui";
import { lookupCertificateAction } from "@/server/actions/certificates";

/** « Numéro d'attestation » → its verification page. Works without JavaScript. */
export async function CertificateLookup() {
  const t = await getTranslations("certificate.verify.form");
  return (
    <form
      action={lookupCertificateAction}
      className="flex flex-col gap-3 rounded-card bg-blanc p-5 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <TextField
          id="certificate-code"
          name="code"
          label={t("label")}
          placeholder={t("placeholder")}
          autoComplete="off"
          required
          maxLength={20}
        />
      </div>
      <Button type="submit" variant="secondary" className="h-12">
        {t("submit")}
      </Button>
    </form>
  );
}
