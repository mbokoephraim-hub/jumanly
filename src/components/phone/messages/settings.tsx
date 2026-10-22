"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import {
  blockPhoneAction,
  clearAction,
  ephemeralAction,
  muteAction,
} from "@/server/actions/messages-phone";
import { PhoneIcon } from "../icon";
import { PhoneSheet } from "../sheet";
import { Radio, Toggle } from "./parts";
import type { WhoView } from "./types";

export type SettingsSheet =
  "menu" | "plus" | "ephem" | "export" | "bloquer" | "effacer" | "raccourci" | null;

const EPHEMERAL = [null, 86_400, 7 * 86_400, 90 * 86_400] as const;
const EPHEMERAL_KEY = { 86400: "day", 604800: "week", 7776000: "quarter" } as const;

export type SettingsTarget = {
  id: string;
  kind: "peer" | "organization";
  who: WhoView;
  muted: boolean;
  ephemeral: number | null;
  blockedByMe: boolean;
};

export function useEphemeralLabel() {
  const t = useTranslations("phoneMsg.ephemeral");
  return (seconds: number | null) =>
    seconds ? t(EPHEMERAL_KEY[seconds as keyof typeof EPHEMERAL_KEY] ?? "off") : t("off");
}

/** « Mode silencieux » kept in step with the server, answered at once on the screen. */
export function useMute(target: SettingsTarget) {
  const t = useTranslations("phoneMsg");
  const [muted, setMuted] = useState(target.muted);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the server
    setMuted(target.muted);
  }, [target.muted]);
  const toggle = () => {
    const next = !muted;
    setMuted(next);
    void muteAction(target.id, next).then((result) => {
      if (!result.ok) {
        setMuted(!next);
        showToast({ message: t("error"), tone: "error" });
        return;
      }
      showToast({ message: next ? t("mute.on") : t("mute.off") });
    });
  };
  return { muted, toggle };
}

/**
 * The sheets of a conversation's settings (planches Messages-menu, -plus, -ephem, -export,
 * -bloquer): shared by the conversation and its « Infos ». Blocking and clearing ask first;
 * clearing hides the messages for this person only, nothing is deleted.
 */
export function ConversationSheets({
  target,
  sheet,
  setSheet,
  onSearch,
  mute,
}: {
  target: SettingsTarget;
  sheet: SettingsSheet;
  setSheet: (sheet: SettingsSheet) => void;
  /** « Rechercher dans la discussion ». */
  onSearch: () => void;
  mute: ReturnType<typeof useMute>;
}) {
  const t = useTranslations("phoneMsg");
  const router = useRouter();
  const label = useEphemeralLabel();
  const [withMedia, setWithMedia] = useState(false);
  const [pending, start] = useTransition();
  const close = () => setSheet(null);
  const name = target.who.first;
  const peer = target.kind === "peer";

  const run = (task: () => Promise<{ ok: boolean }>, done: string, after?: () => void) =>
    start(async () => {
      const result = await task().catch(() => ({ ok: false }));
      if (!result.ok) {
        showToast({ message: t("error"), tone: "error" });
        return;
      }
      close();
      showToast({ message: done });
      after?.();
    });

  const exportFile = () => {
    const link = document.createElement("a");
    link.href = `/app/messages/${target.id}/export${withMedia ? "?medias=1" : ""}`;
    link.download = "";
    document.body.append(link);
    link.click();
    link.remove();
    close();
    showToast({
      message: t("export.done", {
        file: `Discussion_${target.who.name.replace(/\s+/g, "_")}.${withMedia ? "zip" : "txt"}`,
      }),
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/app/messages/${target.id}`);
      showToast({ message: t("shortcut.copied") });
    } catch {
      showToast({ message: t("error"), tone: "error" });
    }
    close();
  };

  return (
    <PhoneSheet
      open={sheet !== null}
      onClose={close}
      label={sheet ? t(`sheet.${sheet}`, { name }) : t("close")}
      closeLabel={t("close")}
    >
      {sheet === "menu" ? (
        <div className="nb-ms-menu">
          {target.who.href ? (
            <Link href={target.who.href} className="nb-opt" onClick={close}>
              <PhoneIcon
                name={target.who.org ? "organisation" : "personne"}
                size={22}
                stroke={1.8}
              />
              {target.who.org ? t("menu.page") : t("menu.profile")}
            </Link>
          ) : null}
          <button
            type="button"
            className="nb-opt"
            onClick={() => {
              close();
              onSearch();
            }}
          >
            <PhoneIcon name="recherche" size={22} stroke={1.8} />
            {t("menu.search")}
          </button>
          <Link href={`/app/messages/${target.id}/medias`} className="nb-opt" onClick={close}>
            <PhoneIcon name="document" size={22} stroke={1.8} />
            {t("menu.medias")}
          </Link>
          <button
            type="button"
            className="nb-opt"
            role="switch"
            aria-checked={mute.muted}
            onClick={mute.toggle}
          >
            <PhoneIcon name="muet" size={22} stroke={1.8} />
            <span className="nb-ms-grow">{t("menu.mute")}</span>
            <Toggle on={mute.muted} />
          </button>
          {peer ? (
            <button type="button" className="nb-opt" onClick={() => setSheet("ephem")}>
              <PhoneIcon name="minuteur" size={22} stroke={1.8} />
              <span className="nb-ms-grow">{t("menu.ephemeral")}</span>
              <span className="nb-meta">{label(target.ephemeral)}</span>
            </button>
          ) : null}
          <button type="button" className="nb-opt nb-ms-sansfilet" onClick={() => setSheet("plus")}>
            <PhoneIcon name="plusOptions" size={22} stroke={2.6} />
            <span className="nb-ms-grow">{t("menu.more")}</span>
            <PhoneIcon name="chevron" size={18} />
          </button>
        </div>
      ) : null}

      {sheet === "plus" ? (
        <div>
          <h2 className="nb-ms-sht">{target.who.name}</h2>
          {target.blockedByMe ? (
            <button
              type="button"
              className="nb-opt"
              disabled={pending}
              onClick={() =>
                run(() => blockPhoneAction(target.id, false), t("confirm.unblocked", { name }))
              }
            >
              {t("plus.unblock", { name })}
            </button>
          ) : (
            <button
              type="button"
              className="nb-opt"
              data-alerte=""
              onClick={() => setSheet("bloquer")}
            >
              {t("plus.block", { name })}
            </button>
          )}
          <button
            type="button"
            className="nb-opt"
            data-alerte=""
            onClick={() => setSheet("effacer")}
          >
            {t("plus.clear")}
          </button>
          <button type="button" className="nb-opt" onClick={() => setSheet("export")}>
            {t("plus.export")}
          </button>
          <button
            type="button"
            className="nb-opt nb-ms-sansfilet"
            onClick={() => setSheet("raccourci")}
          >
            {t("plus.shortcut")}
          </button>
        </div>
      ) : null}

      {sheet === "ephem" ? (
        <div>
          <h2 className="nb-ms-sht">{t("ephemeral.title")}</h2>
          <p className="nb-meta nb-ms-shtnote">{t("ephemeral.text", { name })}</p>
          {EPHEMERAL.map((seconds) => (
            <button
              key={String(seconds)}
              type="button"
              className="nb-opt"
              role="radio"
              aria-checked={target.ephemeral === seconds}
              disabled={pending}
              onClick={() =>
                target.ephemeral === seconds
                  ? close()
                  : run(
                      () => ephemeralAction(target.id, seconds),
                      seconds ? t("ephemeral.toastOn") : t("ephemeral.toastOff"),
                    )
              }
            >
              <span className="nb-ms-grow">{label(seconds)}</span>
              <Radio on={target.ephemeral === seconds} />
            </button>
          ))}
        </div>
      ) : null}

      {sheet === "export" ? (
        <div>
          <h2 className="nb-ms-sht">{t("export.title")}</h2>
          {[false, true].map((media) => (
            <button
              key={String(media)}
              type="button"
              className="nb-opt"
              role="radio"
              aria-checked={withMedia === media}
              onClick={() => setWithMedia(media)}
            >
              <span className="nb-ms-grow">
                {media ? t("export.with") : t("export.without")}
                <small>{media ? t("export.withNote") : t("export.withoutNote")}</small>
              </span>
              <Radio on={withMedia === media} />
            </button>
          ))}
          <button type="button" className="nb-bp nb-ms-go" onClick={exportFile}>
            {t("export.go")}
          </button>
        </div>
      ) : null}

      {sheet === "bloquer" || sheet === "effacer" ? (
        <div className="nb-ms-confirm">
          <h2 className="nb-ms-sht">
            {sheet === "bloquer" ? t("confirm.blockTitle", { name }) : t("confirm.clearTitle")}
          </h2>
          <p className="nb-meta">
            {sheet === "bloquer"
              ? peer
                ? t("confirm.blockPerson", { name })
                : t("confirm.blockOrg", { name })
              : t("confirm.clearText", { name })}
          </p>
          <button
            type="button"
            className="nb-ms-rouge"
            disabled={pending}
            onClick={() =>
              sheet === "bloquer"
                ? run(
                    () => blockPhoneAction(target.id, true),
                    t("confirm.blocked", { name }),
                    () => router.replace(`/app/messages/${target.id}`),
                  )
                : run(
                    () => clearAction(target.id),
                    t("confirm.cleared"),
                    () => router.replace(`/app/messages/${target.id}`),
                  )
            }
          >
            {sheet === "bloquer" ? t("confirm.block") : t("confirm.clear")}
          </button>
          <button type="button" className="nb-bs" onClick={close}>
            {t("cancel")}
          </button>
        </div>
      ) : null}

      {sheet === "raccourci" ? (
        <div className="nb-ms-confirm">
          <h2 className="nb-ms-sht">{t("shortcut.title")}</h2>
          <p className="nb-meta">{t("shortcut.text", { name })}</p>
          <button type="button" className="nb-bp" onClick={copyLink}>
            {t("shortcut.copy")}
          </button>
          <button type="button" className="nb-bs" onClick={close}>
            {t("shortcut.ok")}
          </button>
        </div>
      ) : null}
    </PhoneSheet>
  );
}
