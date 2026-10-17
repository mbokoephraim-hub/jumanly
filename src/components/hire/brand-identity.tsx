"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/brand/icon";
import { OrgBanner } from "@/components/jobs/org-banner";
import { BodyPortal } from "@/components/layout/body-portal";
import { CompanyLogo } from "@/components/ui/avatar";
import { BrandImageEditor } from "./brand-image-editor";

export type JobBrand = { banner: string | null; logo: string | null; canEdit: boolean };

/**
 * « Identité de l'entreprise » (V6 § B9, screen 66): the banner and the logo shown on every offer,
 * with « Bannière » and « Logo » for administrators. Each opens the framing in a window over the
 * page, so a job being written is kept; the page refreshes once the image is saved.
 */
export function BrandIdentity({ org, brand }: { org: string; brand: JobBrand }) {
  const t = useTranslations("hire.jobForm.brand");
  const router = useRouter();
  const [editing, setEditing] = useState<"banner" | "logo" | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  // The window takes the focus when it opens, so the keyboard and screen readers start there.
  useEffect(() => {
    if (editing) title.current?.focus();
  }, [editing]);
  const button =
    "inline-flex h-9 items-center gap-2 rounded-pill bg-blanc px-3.5 text-[13px] font-semibold text-sapin ring-[1.5px] ring-brume ring-inset hover:ring-sapin/40 focus-visible:shadow-[0_0_0_4px_rgb(166_242_107/0.9)] focus-visible:outline-none";

  return (
    <section aria-labelledby="brand-identity" className="flex flex-col gap-2">
      <h3 id="brand-identity" className="text-[13px] font-semibold text-ardoise">
        {t("title")}
      </h3>
      <div className="relative overflow-hidden rounded-[22px] bg-blanc pb-3.5 shadow-carte">
        <OrgBanner src={brand.banner} className="h-[110px]" sizes="400px" />
        <CompanyLogo
          name={org}
          src={brand.logo}
          size="lg"
          className="absolute! top-[76px] left-4 size-[60px]! rounded-[18px]! border-4 border-blanc text-[17px]!"
        />
        <div className="flex min-h-12 justify-end gap-2 px-3 pt-2.5">
          {brand.canEdit && (
            <>
              <button type="button" onClick={() => setEditing("banner")} className={button}>
                <Icon name="edit" className="size-4" />
                {t("banner")}
              </button>
              <button type="button" onClick={() => setEditing("logo")} className={button}>
                <Icon name="edit" className="size-4" />
                {t("logo")}
              </button>
            </>
          )}
        </div>
        <p className="px-4 pt-3 text-[12px] leading-[17px] text-ardoise">
          {brand.canEdit ? t("hint") : t("adminOnly")}
        </p>
      </div>
      {editing && (
        <BodyPortal>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-editor-title"
            className="fixed inset-0 z-[70] flex items-end justify-center bg-nuit/55 p-0 sm:items-center sm:p-6"
            onKeyDown={(event) => event.key === "Escape" && setEditing(null)}
          >
            <div className="flex max-h-[92dvh] w-full max-w-[520px] flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-creme p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[28px]">
              <h2
                id="brand-editor-title"
                ref={title}
                tabIndex={-1}
                className="text-[20px] font-bold outline-none"
              >
                {editing === "banner" ? t("editBanner") : t("editLogo")}
              </h2>
              <p className="-mt-2 text-[13px] text-ardoise">
                {editing === "banner" ? t("bannerHint") : t("logoHint")}
              </p>
              <BrandImageEditor
                kind={editing}
                current={editing === "banner" ? brand.banner : brand.logo}
                onDone={(saved) => {
                  setEditing(null);
                  if (saved) router.refresh();
                }}
                labels={{
                  choose: t("editor.choose"),
                  zoom: t("editor.zoom"),
                  drag: t("editor.drag"),
                  empty: t("editor.empty"),
                  cancel: t("editor.cancel"),
                  save: t("editor.save"),
                  remove: editing === "banner" ? t("editor.removeBanner") : t("editor.removeLogo"),
                  error: t("editor.error"),
                }}
              />
            </div>
          </div>
        </BodyPortal>
      )}
    </section>
  );
}
