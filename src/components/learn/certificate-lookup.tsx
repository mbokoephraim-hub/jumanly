import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/brand/icon";
import { lookupCertificateAction } from "@/server/actions/certificates";

/** « Numéro d'attestation » → its verification page (mockup 01-15). Works without JavaScript. */
export async function CertificateLookup() {
  const t = await getTranslations("certificate.verify.form");
  return (
    <form
      action={lookupCertificateAction}
      className="flex flex-col gap-3 rounded-[28px] bg-blanc px-6 py-6 sm:flex-row sm:items-end lg:px-7"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <label htmlFor="certificate-code" className="text-[13px] font-semibold">
          {t("label")}
        </label>
        <span className="relative block">
          <Icon
            name="certificat"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2"
          />
          <input
            id="certificate-code"
            name="code"
            placeholder={t("placeholder")}
            autoComplete="off"
            required
            maxLength={20}
            className="h-12 w-full rounded-[14px] bg-blanc pr-4 pl-11 text-sm text-sapin ring-[1.5px] ring-brume ring-inset placeholder:text-ardoise focus:ring-2 focus:ring-sapin focus:outline-none"
          />
        </span>
      </div>
      <button
        type="submit"
        className="h-12 shrink-0 rounded-pill bg-sapin px-6 text-[15px] font-semibold text-blanc transition-colors hover:bg-feuille-fonce focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapin"
      >
        {t("submit")}
      </button>
    </form>
  );
}
