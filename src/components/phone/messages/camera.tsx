"use client";

/* eslint-disable @next/next/no-img-element -- the photo just taken, before it is sent */
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { sendPhotosAction } from "@/server/actions/messages-phone";
import { PhoneIcon } from "../icon";
import { useSendError } from "./attach";
import { shrinkPhoto } from "./media";

/**
 * « Appareil photo » of a conversation (planche Messages-camera): what the camera sees, the shutter,
 * the other camera; once taken, « HD », a caption and « Envoyer ». Without a camera (refused, or a
 * computer), the phone's own picker takes the photo instead.
 */
export function PhoneCamera({
  conversationId,
  onClose,
  onGallery,
}: {
  conversationId: string;
  onClose: () => void;
  onGallery: () => void;
}) {
  const t = useTranslations("phoneMsg.camera");
  const tm = useTranslations("phoneMsg");
  const sendError = useSendError();
  const video = useRef<HTMLVideoElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [live, setLive] = useState<boolean | null>(null);
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);
  const [hd, setHd] = useState(false);
  const [caption, setCaption] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (shot) return;
    let stream: MediaStream | null = null;
    let stopped = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no camera on this device
      setLive(false);
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((media) => {
        if (stopped) {
          for (const track of media.getTracks()) track.stop();
          return;
        }
        stream = media;
        if (video.current) video.current.srcObject = media;
        setLive(true);
      })
      .catch(() => setLive(false));
    return () => {
      stopped = true;
      for (const track of stream?.getTracks() ?? []) track.stop();
    };
  }, [facing, shot]);

  useEffect(
    () => () => {
      if (shot) URL.revokeObjectURL(shot.url);
    },
    [shot],
  );

  const take = () => {
    const node = video.current;
    if (!node || !node.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = node.videoWidth;
    canvas.height = node.videoHeight;
    canvas.getContext("2d")?.drawImage(node, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) setShot({ blob, url: URL.createObjectURL(blob) });
      },
      "image/jpeg",
      0.92,
    );
  };

  const send = () => {
    if (!shot) return;
    start(async () => {
      const form = new FormData();
      form.set("conversation", conversationId);
      form.set("hd", hd ? "1" : "0");
      form.set("caption", caption);
      form.append("photo", await shrinkPhoto(shot.blob, hd), "photo.jpg");
      const result = await sendPhotosAction(form).catch(() => null);
      if (!result?.ok) {
        sendError(result);
        return;
      }
      onClose();
      showToast({ message: hd ? t("sentHd") : t("sent") });
    });
  };

  return (
    <div className="nb-ms-camera" role="dialog" aria-modal="true" aria-label={t("title")}>
      <input
        ref={picker}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) setShot({ blob: file, url: URL.createObjectURL(file) });
        }}
      />
      {shot ? (
        <img src={shot.url} alt="" className="nb-ms-camera-v" />
      ) : (
        <video
          ref={video}
          className="nb-ms-camera-v"
          autoPlay
          playsInline
          muted
          aria-label={t("seen")}
          hidden={!live}
        />
      )}
      {!shot && live === false ? (
        <div className="nb-ms-camera-off">
          <p>{t("off")}</p>
          <button type="button" className="nb-ms-oui" onClick={() => picker.current?.click()}>
            {t("pick")}
          </button>
        </div>
      ) : null}
      <div className="nb-ms-camera-h">
        <button type="button" className="nb-rond" aria-label={t("close")} onClick={onClose}>
          <PhoneIcon name="fermer" size={22} stroke={2} />
        </button>
        {shot ? (
          <button type="button" className="nb-ms-hdb" aria-pressed={hd} onClick={() => setHd(!hd)}>
            {tm("hd")}
          </button>
        ) : null}
      </div>
      {shot ? (
        <div className="nb-ms-camera-envoi">
          <label className="nb-ms-champ">
            <input
              value={caption}
              placeholder={t("caption")}
              aria-label={t("captionLabel")}
              maxLength={1000}
              onChange={(event) => setCaption(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="nb-ms-envoyer"
            aria-label={t("send")}
            disabled={pending}
            onClick={send}
          >
            <PhoneIcon name="envoyer" size={22} stroke={2.2} />
          </button>
        </div>
      ) : (
        <div className="nb-ms-camera-b">
          <button
            type="button"
            className="nb-ms-galerie-b"
            aria-label={t("gallery")}
            onClick={onGallery}
          >
            <PhoneIcon name="photo" size={24} stroke={1.8} />
          </button>
          <button
            type="button"
            className="nb-ms-declencheur"
            aria-label={t("take")}
            onClick={() => (live ? take() : picker.current?.click())}
          >
            <span />
          </button>
          <button
            type="button"
            className="nb-rond"
            aria-label={t("switch")}
            disabled={!live}
            onClick={() => {
              setFacing(facing === "environment" ? "user" : "environment");
              showToast({ message: facing === "environment" ? t("front") : t("back") });
            }}
          >
            <PhoneIcon name="echanger" size={24} stroke={1.8} />
          </button>
        </div>
      )}
    </div>
  );
}
