"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { showToast } from "@/components/motion/toaster";
import { blockPhoneAction, sendTextAction, sendVoiceAction } from "@/server/actions/messages-phone";
import { PhoneBack } from "../back";
import { OrbiDisc, PhoneIcon } from "../icon";
import { AttachSheets, useSendError, type AttachSheet } from "./attach";
import { MessageBubble, type Open } from "./bubble";
import { PhoneCamera } from "./camera";
import { VOICE_MAX_SECONDS, WAVE_REC, clock, voiceType } from "./media";
import { OrbiHelp } from "./orbi-help";
import { WhoAvatar, WhoName } from "./parts";
import { ConversationSheets, useEphemeralLabel, useMute, type SettingsSheet } from "./settings";
import type { MessageView, ThreadView } from "./types";
import { MediaViewer } from "./viewer";

type Recording = { recorder: MediaRecorder; chunks: Blob[]; started: number; stream: MediaStream };

/** The voice note being recorded: the time, the bars, « Supprimer » and « Envoyer ». */
function useVoice(conversationId: string) {
  const t = useTranslations("phoneMsg");
  const sendError = useSendError();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [pending, start] = useTransition();
  const keep = useRef(false);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      const elapsed = (Date.now() - recording.started) / 1000;
      setSeconds(elapsed);
      if (elapsed >= VOICE_MAX_SECONDS) finish(true);
    }, 250);
    return () => clearInterval(timer);
    // `finish` reads the recording it stops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  const begin = async () => {
    const type = voiceType();
    if (type === null || !navigator.mediaDevices?.getUserMedia) {
      showToast({ message: t("voice.unavailable"), tone: "error" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.start(250);
      setSeconds(0);
      setRecording({ recorder, chunks, started: Date.now(), stream });
    } catch {
      showToast({ message: t("voice.denied"), tone: "error" });
    }
  };

  function finish(send: boolean) {
    const current = recording;
    if (!current) return;
    keep.current = send;
    const elapsed = Math.max(1, Math.round((Date.now() - current.started) / 1000));
    current.recorder.onstop = () => {
      for (const track of current.stream.getTracks()) track.stop();
      if (!keep.current) {
        showToast({ message: t("voice.deleted") });
        return;
      }
      const blob = new Blob(current.chunks, { type: current.recorder.mimeType || "audio/webm" });
      start(async () => {
        const form = new FormData();
        form.set("conversation", conversationId);
        form.set("seconds", String(elapsed));
        form.set("voice", blob, "note");
        const result = await sendVoiceAction(form).catch(() => null);
        if (!result?.ok) sendError(result);
      });
    };
    current.recorder.stop();
    setRecording(null);
  }

  return { recording: recording !== null, seconds, begin, finish, pending };
}

/**
 * A conversation on the phone (Modèle B, lot B8, planches Messages-discussion, -nadia, -baobab,
 * -joel, -ruth, -sarah, -moussa, -clarisse): the head with the face and « En ligne », the
 * bubbles and their cards, the search in the conversation, and the composer with « Joindre »,
 * Orbi's spark, the camera and the voice note. Blocked, it says so and offers « Débloquer ».
 */
export function PhoneThread({ view }: { view: ThreadView }) {
  const t = useTranslations("phoneMsg");
  const router = useRouter();
  const params = useSearchParams();
  const sendError = useSendError();
  const ephemeralLabel = useEphemeralLabel();
  const [draft, setDraft] = useState("");
  const field = useRef<HTMLInputElement>(null);
  // Words typed before the page was ready to listen are kept (slow network).
  useEffect(() => {
    const typedEarly = field.current?.value ?? "";
    if (typedEarly) setDraft(typedEarly);
  }, []);
  const [attach, setAttach] = useState<AttachSheet>(null);
  const [settings, setSettings] = useState<SettingsSheet>(null);
  const [helping, setHelping] = useState(false);
  const [camera, setCamera] = useState(false);
  const [open, setOpen] = useState<Open | null>(null);
  const [searching, setSearching] = useState(false);
  const [rq, setRq] = useState("");
  const [ri, setRi] = useState<number | null>(null);
  const [, startSend] = useTransition();
  const [pendingBlock, startBlock] = useTransition();
  const voice = useVoice(view.id);
  const mute = useMute(view);
  const list = useRef<HTMLDivElement>(null);
  const [messages, addOptimistic] = useOptimistic(
    view.messages,
    (current: MessageView[], text: string) => [
      ...current,
      {
        id: `envoi-${current.length}`,
        mine: true,
        at: new Date().toISOString(),
        time: t("sending"),
        ephemeral: view.ephemeral !== null,
        read: false,
        words: text,
        bubble: { kind: "text" as const, text },
      },
    ],
  );

  // `?q=` (a search of the tab), `?m=` (a message found), `?voir=` (a photo), `?chercher=1`.
  const askedQ = params.get("q");
  const askedM = params.get("m");
  const askedPhoto = params.get("voir");
  const askedSearch = params.get("chercher");
  useEffect(() => {
    if (askedQ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the address
      setSearching(true);
      setRq(askedQ);
      setRi(null);
    } else if (askedSearch) setSearching(true);
    if (askedPhoto) {
      const [messageId, index] = askedPhoto.split(":");
      if (messageId) setOpen({ kind: "photo", messageId, index: Number(index ?? 0) || 0 });
    }
    if (askedM)
      requestAnimationFrame(() =>
        document.getElementById(`m-${askedM}`)?.scrollIntoView({ block: "center" }),
      );
  }, [askedQ, askedM, askedPhoto, askedSearch]);

  const query = rq.trim().toLocaleLowerCase("fr");
  const matches = useMemo(
    () =>
      query
        ? messages
            .filter((message) => message.bubble.kind !== "system")
            .filter((message) => message.words.toLocaleLowerCase("fr").includes(query))
            .map((message) => message.id)
        : [],
    [messages, query],
  );
  const index = ri === null ? matches.length - 1 : Math.min(ri, matches.length - 1);
  const current = matches[index];
  useEffect(() => {
    if (current) document.getElementById(`m-${current}`)?.scrollIntoView({ block: "center" });
  }, [current]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    startSend(async () => {
      addOptimistic(text);
      const result = await sendTextAction(view.id, text).catch(() => null);
      if (!result?.ok) {
        setDraft(text);
        sendError(result);
      }
    });
  };

  const unblock = () =>
    startBlock(async () => {
      const result = await blockPhoneAction(view.id, false).catch(() => null);
      if (!result?.ok) {
        showToast({ message: t("error"), tone: "error" });
        return;
      }
      showToast({ message: t("confirm.unblocked", { name: view.who.first }) });
      router.refresh();
    });

  const who = view.who;
  const typed = draft.trim().length > 0;

  return (
    <div className="nb-page nb-ms nb-ms-conv" data-recherche={searching ? "" : undefined}>
      {!searching ? (
        <header className="nb-ms-conv-h">
          <PhoneBack fallback="/app/messages" label={t("back")} />
          <Link
            href={`/app/messages/${view.id}/infos`}
            className="nb-ms-conv-qui"
            aria-label={t("openInfos")}
          >
            <WhoAvatar who={who} size={40} />
            <span className="nb-ms-ligne-c">
              <span className="nb-ms-nomligne">
                <WhoName who={who} />
                {mute.muted ? <PhoneIcon name="muet" size={15} stroke={1.8} /> : null}
              </span>
              {who.status ? (
                <span className="nb-ms-statut" data-enligne={who.online ? "" : undefined}>
                  {who.status}
                </span>
              ) : null}
            </span>
          </Link>
          <button
            type="button"
            className="nb-rond"
            aria-label={t("options")}
            onClick={() => setSettings("menu")}
          >
            <PhoneIcon name="plusOptions" size={22} stroke={2.6} />
          </button>
        </header>
      ) : (
        <>
          <header className="nb-ms-conv-h nb-ms-conv-r">
            <label className="nb-ms-champ">
              <PhoneIcon name="recherche" size={17} stroke={1.8} />
              <input
                type="search"
                value={rq}
                autoFocus
                placeholder={t("convSearch.placeholder")}
                aria-label={t("convSearch.placeholder")}
                onChange={(event) => {
                  setRq(event.target.value);
                  setRi(null);
                }}
              />
              {query ? (
                <span className="nb-meta nb-ms-compte" aria-live="polite">
                  {matches.length
                    ? t("convSearch.count", { index: index + 1, total: matches.length })
                    : t("convSearch.none")}
                </span>
              ) : null}
            </label>
            <button
              type="button"
              className="nb-rond nb-ms-fl"
              aria-label={t("convSearch.previous")}
              disabled={index <= 0}
              onClick={() => setRi(Math.max(0, index - 1))}
            >
              <PhoneIcon name="haut" size={20} stroke={2} />
            </button>
            <button
              type="button"
              className="nb-rond nb-ms-fl"
              aria-label={t("convSearch.next")}
              disabled={index >= matches.length - 1}
              onClick={() => setRi(Math.min(matches.length - 1, index + 1))}
            >
              <PhoneIcon name="bas" size={20} stroke={2} />
            </button>
            <button
              type="button"
              className="nb-ms-annuler"
              onClick={() => {
                setSearching(false);
                setRq("");
              }}
            >
              {t("convSearch.close")}
            </button>
          </header>
          <div className="nb-ms-conv-puces">
            {(["medias", "docs", "liens"] as const).map((key) => (
              <Link
                key={key}
                href={`/app/messages/${view.id}/medias?onglet=${key}`}
                className="nb-chip"
              >
                <PhoneIcon
                  name={key === "medias" ? "photo" : key === "docs" ? "document" : "lien"}
                  size={16}
                  stroke={1.8}
                />
                {t(`medias.tab.${key}`)}
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="nb-ms-fil" ref={list}>
        <div className="nb-ms-fil-c">
          {view.ephemeral ? (
            <button type="button" className="nb-ms-ephem" onClick={() => setSettings("ephem")}>
              <PhoneIcon name="minuteur" size={15} stroke={1.8} />
              {t("ephemeral.banner", { duration: ephemeralLabel(view.ephemeral) })}
            </button>
          ) : null}
          <ol className="nb-ms-liste">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                hit={matches.includes(message.id)}
                current={message.id === current}
                onOpen={setOpen}
              />
            ))}
          </ol>
          {messages.length === 0 ? <p className="nb-meta nb-ms-vide">{t("thread.empty")}</p> : null}
        </div>
      </div>

      {view.blockedByMe ? (
        <div className="nb-ms-bloque">
          <p className="nb-meta">{t("thread.blocked", { name: who.first })}</p>
          <button type="button" className="nb-ms-ecrire" disabled={pendingBlock} onClick={unblock}>
            {t("thread.unblock")}
          </button>
        </div>
      ) : !view.canWrite ? (
        <div className="nb-ms-bloque">
          <p className="nb-meta">
            {view.kind === "peer" ? t("thread.notConnected") : t("thread.closed")}
          </p>
        </div>
      ) : voice.recording ? (
        <div className="nb-ms-enreg" role="group" aria-label={t("voice.recording")}>
          <button
            type="button"
            className="nb-rond nb-ms-rougeic"
            aria-label={t("voice.delete")}
            onClick={() => voice.finish(false)}
          >
            <PhoneIcon name="corbeille" size={22} stroke={1.8} />
          </button>
          <span className="nb-ms-rec" aria-hidden />
          <b className="nb-ms-duree">{clock(voice.seconds)}</b>
          <span className="nb-ms-onde nb-ms-onde-rec" aria-hidden>
            {WAVE_REC.map((height, at) => (
              <i key={at} style={{ height }} />
            ))}
          </span>
          <button
            type="button"
            className="nb-ms-envoyer"
            aria-label={t("voice.send")}
            onClick={() => voice.finish(true)}
          >
            <PhoneIcon name="envoyer" size={22} stroke={2.2} />
          </button>
        </div>
      ) : (
        <form
          className="nb-ms-compose"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <button
            type="button"
            className="nb-rond"
            aria-label={t("compose.attach")}
            onClick={() => setAttach("joindre")}
          >
            <PhoneIcon name="trombone" size={22} stroke={1.8} />
          </button>
          <label className="nb-ms-champ nb-ms-champ-c">
            <input
              ref={field}
              value={draft}
              placeholder={t("compose.placeholder")}
              aria-label={t("compose.placeholder")}
              maxLength={4000}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="button"
              className="nb-ms-etincelle"
              aria-label={t("compose.orbi")}
              data-orbi=""
              onClick={() => setHelping(true)}
            >
              <OrbiDisc size={30} />
            </button>
          </label>
          {typed ? (
            <button type="submit" className="nb-ms-envoyer" aria-label={t("compose.send")}>
              <PhoneIcon name="envoyer" size={22} stroke={2.2} />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="nb-rond"
                aria-label={t("compose.camera")}
                onClick={() => setCamera(true)}
              >
                <PhoneIcon name="appareil" size={22} stroke={1.8} />
              </button>
              <button
                type="button"
                className="nb-ms-micro"
                aria-label={t("compose.voice")}
                disabled={voice.pending}
                onClick={() => void voice.begin()}
              >
                <PhoneIcon name="micro" size={22} stroke={1.9} />
              </button>
            </>
          )}
        </form>
      )}

      <AttachSheets view={view} sheet={attach} setSheet={setAttach} />
      <ConversationSheets
        target={view}
        sheet={settings}
        setSheet={setSettings}
        onSearch={() => setSearching(true)}
        mute={mute}
      />
      <OrbiHelp
        open={helping}
        onClose={() => setHelping(false)}
        conversationId={view.id}
        name={who.first}
        draft={draft}
        onUse={setDraft}
      />
      <MediaViewer
        conversationId={view.id}
        open={open}
        messages={messages}
        title={who.name}
        forwardTo={view.forwardTo}
        onClose={() => setOpen(null)}
      />
      {camera ? (
        <PhoneCamera
          conversationId={view.id}
          onClose={() => setCamera(false)}
          onGallery={() => {
            setCamera(false);
            setAttach("joindre");
          }}
        />
      ) : null}
    </div>
  );
}
