"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * « À ouvrir sur un ordinateur » (étape 3, brief § 2): sous 768 px, à la place des écrans de
 * l'entreprise. On copie le lien pour l'ouvrir sur un ordinateur, ou l'on revient en arrière.
 */
export function DesktopOnly({
  variant,
  className = "",
}: {
  /** `signup`: la création de l'espace ; `app`: les écrans de l'entreprise. */
  variant: "signup" | "app";
  className?: string;
}) {
  const t = useTranslations("desktopOnly");
  const [copied, setCopied] = useState(false);
  return (
    <div className={`ae ae-ordi-seul ${className}`}>
      <span
        className="ae-rond"
        style={{ width: 64, height: 64, color: "#A6F26B" }}
        aria-hidden="true"
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.5 5.5h17v11h-17zM8 20h8M12 16.5V20" />
        </svg>
      </span>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>{t("title")}</h1>
      <p className="ae-meta" style={{ fontSize: 14.5, lineHeight: 1.5 }}>
        {variant === "signup" ? t("signupText") : t("text")}
      </p>
      <button
        type="button"
        className="ae-btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {t("copy")}
      </button>
      {copied && (
        <p role="status" className="ae-meta" style={{ textAlign: "center" }}>
          {t("copied")}
        </p>
      )}
      {variant === "signup" ? (
        <>
          <Link href="/inscription?profil=rh" className="ae-btn2">
            {t("recruiter")}
          </Link>
          <Link href="/" className="ae-lien" style={{ textAlign: "center" }}>
            {t("home")}
          </Link>
        </>
      ) : (
        <Link href="/app" className="ae-btn2">
          {t("app")}
        </Link>
      )}
    </div>
  );
}
