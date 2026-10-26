"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { cx } from "@/lib/cx";
import { publishAction } from "@/server/actions/feed";
import { connectAction } from "@/server/actions/explore";

const MAX = 220;

/**
 * « Partagez une offre, une recrue, un conseil… » on a computer (Modèle B, lot N2, capture 033):
 * 220 characters, in one's own name or in the name of the company when the member manages its
 * offers. The Fil below shows the post once published.
 */
export function WebFilCompose({
  org,
}: {
  /** The company's short name, when this member may publish in its name. */
  org: string | null;
}) {
  const t = useTranslations("rhWeb.fil.compose");
  const [body, setBody] = useState("");
  const [as, setAs] = useState<"me" | "org">("me");
  const [pending, start] = useTransition();
  const text = body.trim();
  return (
    <form
      className="rb-carte rb-compose"
      aria-label={t("aria")}
      onSubmit={(event) => {
        event.preventDefault();
        if (!text) return;
        start(async () => {
          const result = await publishAction({ body: text, as });
          if (!result.ok) {
            showToast({ message: t("failed"), tone: "error" });
            return;
          }
          setBody("");
          showToast({ message: t("done"), tone: "success" });
        });
      }}
    >
      <textarea
        value={body}
        maxLength={MAX}
        rows={3}
        aria-label={t("placeholder")}
        placeholder={t("placeholder")}
        onChange={(event) => setBody(event.target.value)}
      />
      <div className="rb-compose-b">
        <button
          type="button"
          aria-pressed={as === "me"}
          className={cx("rb-pill t-press", as === "me" && "rb-on")}
          onClick={() => setAs("me")}
        >
          {t("me")}
        </button>
        {org && (
          <button
            type="button"
            aria-pressed={as === "org"}
            className={cx("rb-pill t-press", as === "org" && "rb-on")}
            onClick={() => setAs("org")}
          >
            {t("org", { org })}
          </button>
        )}
        <span className="rb-sp" />
        <span className="rb-meta" aria-live="polite">
          {t("count", { count: body.length, max: MAX })}
        </span>
        <button type="submit" className="rb-btn t-press" disabled={pending || !text}>
          {t("publish")}
        </button>
      </div>
    </form>
  );
}

/** « Se connecter » of « À connaître »: the request leaves, the button says so. */
export function ConnectButton({ personId, name }: { personId: string; name: string }) {
  const t = useTranslations("rhWeb.fil.know");
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={cx("rb-btn rb-s t-press", sent && "rb-btn-fait")}
      aria-label={sent ? t("sent") : t("connectAria", { name })}
      disabled={pending || sent}
      onClick={() =>
        start(async () => {
          const result = await connectAction(personId);
          if (!result.ok) {
            showToast({ message: t("failed"), tone: "error" });
            return;
          }
          setSent(true);
          showToast({ message: t("sent"), tone: "success" });
        })
      }
    >
      {sent ? t("sent") : t("connect")}
    </button>
  );
}
