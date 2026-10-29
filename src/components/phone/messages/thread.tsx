"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { showToast } from "@/components/motion/toaster";
import { reactAction } from "@/server/actions/chat";
import {
  blockPhoneAction,
  ephemeralAction,
  sendTextAction,
  sendVoiceAction,
} from "@/server/actions/messages-phone";
import { PhoneBack } from "../back";
import { PhoneIcon } from "../icon";
import { AttachSheets, useSendError, type AttachSheet } from "./attach";
import { MessageBubble, type Open } from "./bubble";
import { AudioGlyph, CallConfirm, VideoCall, VideoGlyph } from "./call";
import { PhoneCamera } from "./camera";
import { useChatPulse, useTypingPing } from "./live";
import { VOICE_BITS_PER_SECOND, VOICE_MAX_SECONDS, clock, voiceType } from "./media";
import { ChatMenu, useMute, type MenuSheet } from "./menu";
import { OrbiHelp } from "./orbi-help";
import { Spark, Typing, WhoAvatar, WhoName } from "./parts";
import type { CallMode } from "./rtc";
import type { MessageView, ThreadView } from "./types";
import { MediaViewer } from "./viewer";

type Recording = { recorder: MediaRecorder; chunks: Blob[]; started: number; stream: MediaStream };

/** The bars of a voice note being recorded (planche Chat-vocal). */
const WAVE = Array.from({ length: 26 }, (_, index) => ({
  height: 6 + ((index * 7) % 18),
  delay: `${((index % 6) * 0.11).toFixed(2)}s`,
}));

/** A voice note leaving the phone: shown at once in the conversation, before the server answers. */
type Sending = { kind: "text"; text: string } | { kind: "voice"; src: string; seconds: number };

/**
 * The voice note being recorded: the time, the bars, delete and send. Recorded light (speech at
 * 24 kb/s, about 3 Ko a second) so that it leaves quickly on a slow network, and shown in the
 * conversation as soon as « Envoyer » is touched.
 */
function useVoice(conversationId: string, showSending: (sending: Sending) => void) {
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
      const recorder = new MediaRecorder(stream, {
        ...(type ? { mimeType: type } : {}),
        audioBitsPerSecond: VOICE_BITS_PER_SECOND,
      });
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
        const src = URL.createObjectURL(blob);
        showSending({ kind: "voice", src, seconds: elapsed });
        const form = new FormData();
        form.set("conversation", conversationId);
        form.set("seconds", String(elapsed));
        form.set("voice", blob, "note");
        const result = await sendVoiceAction(form).catch(() => null);
        if (!result?.ok) sendError(result);
        // The note read with the page takes its place; the copy on the phone is let go.
        setTimeout(() => URL.revokeObjectURL(src), 60_000);
      });
    };
    current.recorder.stop();
    setRecording(null);
  }

  return { recording: recording !== null, seconds, begin, finish, pending };
}

/** The reactions of a message once the person's own choice (not yet saved) is applied. */
function withMine(
  reactions: MessageView["reactions"],
  mine: string | null | undefined,
): MessageView["reactions"] {
  if (mine === undefined) return reactions;
  const before = reactions?.mine ?? null;
  if (before === mine) return reactions;
  const count = (reactions?.count ?? 0) - (before ? 1 : 0) + (mine ? 1 : 0);
  if (count <= 0) return null;
  const emojis = [...(reactions?.emojis ?? [])];
  if (mine && !emojis.includes(mine)) emojis.push(mine);
  return { emojis: emojis.slice(0, 3), count, mine };
}

/**
 * A discussion of the Chat (docs/chat-v2, planches Chat-conv, -reaction, -envoye, -orbi,
 * -joindre, -vocal, -menu, -video): the blurred head (back, face, « En ligne · … » or « écrit… »,
 * the video call, ···), the application pinned under it, the bubbles with their days, reactions
 * and the interview card, Orbi's suggested replies (one touch sends), and the composer: « + »
 * (Joindre), the field with Orbi's button, the microphone and its voice note. Kept live.
 */
export function PhoneThread({ view }: { view: ThreadView }) {
  const t = useTranslations("phoneChat");
  const tm = useTranslations("phoneMsg");
  const router = useRouter();
  const params = useSearchParams();
  const sendError = useSendError();
  const [draft, setDraft] = useState("");
  const field = useRef<HTMLInputElement>(null);
  // Words typed before the page was ready to listen are kept (slow network).
  useEffect(() => {
    const typedEarly = field.current?.value ?? "";

    if (typedEarly) setDraft(typedEarly);
  }, []);
  const [attach, setAttach] = useState<AttachSheet>(null);
  const [menu, setMenu] = useState<MenuSheet>(null);
  const [helping, setHelping] = useState(false);
  const [camera, setCamera] = useState(false);
  const [asking, setAsking] = useState<CallMode | null>(null);
  const [calling, setCalling] = useState<CallMode | null>(null);
  const [open, setOpen] = useState<Open | null>(null);
  const [searching, setSearching] = useState(false);
  const [rq, setRq] = useState("");
  const [ri, setRi] = useState<number | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [mine, setMine] = useState<Record<string, string | null>>({});
  const [used, setUsed] = useState<string[]>([]);
  const [, startSend] = useTransition();
  const [pendingBlock, startBlock] = useTransition();
  const mute = useMute(view);
  const ping = useTypingPing(view.id);
  const live = useChatPulse({ conversationId: view.id, every: 3_000, active: calling === null });
  // The messages read with the page; the ones arriving after rise gently.
  const [seen] = useState(() => new Set(view.messages.map((message) => message.id)));

  const [messages, addOptimistic] = useOptimistic(
    view.messages,
    (current: MessageView[], sending: Sending) => [
      ...current,
      {
        id: `envoi-${current.length}`,
        mine: true,
        at: new Date().toISOString(),
        time: tm("sending"),
        ephemeral: view.ephemeral !== null,
        read: false,
        words: sending.kind === "text" ? sending.text : "",
        day: current.at(-1)?.day ?? "",
        reactions: null,
        reactable: false,
        bubble:
          sending.kind === "text"
            ? { kind: "text" as const, text: sending.text }
            : {
                kind: "voice" as const,
                src: sending.src,
                seconds: sending.seconds,
                duration: clock(sending.seconds),
              },
      },
    ],
  );
  const voice = useVoice(view.id, addOptimistic);

  // The suggestions are read again with the page: the ones already sent go away until then.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- follows the server
    setUsed([]);
    setMine({});
  }, [view.messages]);

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

  const sendText = (text: string, onFail?: () => void) => {
    if (!text) return;
    setPicking(null);
    startSend(async () => {
      addOptimistic({ kind: "text", text });
      const result = await sendTextAction(view.id, text).catch(() => null);
      if (!result?.ok) {
        onFail?.();
        sendError(result);
      }
    });
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    sendText(text, () => setDraft(text));
  };

  const react = (message: MessageView, emoji: string) => {
    const before =
      mine[message.id] !== undefined ? mine[message.id] : (message.reactions?.mine ?? null);
    const next = before === emoji ? null : emoji;
    setMine((state) => ({ ...state, [message.id]: next }));
    setPicking(null);
    void reactAction(view.id, message.id, next).then((result) => {
      if (result.ok) return;
      setMine((state) => ({ ...state, [message.id]: before }));
      showToast({ message: tm("error"), tone: "error" });
    });
  };

  const unblock = () =>
    startBlock(async () => {
      const result = await blockPhoneAction(view.id, false).catch(() => null);
      if (!result?.ok) {
        showToast({ message: tm("error"), tone: "error" });
        return;
      }
      showToast({ message: tm("confirm.unblocked", { name: view.who.first }) });
      router.refresh();
    });

  const stopEphemeral = () =>
    void ephemeralAction(view.id, null).then((result) => {
      if (!result.ok) {
        showToast({ message: tm("error"), tone: "error" });
        return;
      }
      showToast({ message: tm("ephemeral.toastOff") });
      router.refresh();
    });

  const who = view.who;
  const online = who.personId && live.online ? live.online.has(who.personId) : who.online;
  const typing = live.typing ? live.typing.has(view.id) : view.typing;
  const place = who.line.split(" · ").at(-1) ?? "";
  const status = typing
    ? null
    : online
      ? t("status.online", { place: place || "none" })
      : who.online
        ? ""
        : who.status;
  const typed = draft.trim().length > 0;
  const suggestions = view.canWrite ? view.suggestions.filter((text) => !used.includes(text)) : [];

  return (
    <div
      className="nb-page nb-ch nb-ch-conv"
      data-recherche={searching ? "" : undefined}
      onClick={() => setPicking(null)}
    >
      {!searching ? (
        <div className="nb-ch-tete-c">
          <header className="nb-ch-conv-h">
            {/* Opened from « Connexions » (Ephraïm 29/10/2026): « Retour » goes to the Chat list. */}
            <PhoneBack
              fallback="/app/messages"
              label={tm("back")}
              history={params.get("de") !== "connexions"}
            />
            {who.href ? (
              <Link
                href={who.href}
                className="nb-ch-conv-qui"
                aria-label={t("openProfile", { name: who.name })}
              >
                <WhoAvatar who={who} size={42} online={online} />
                <span className="nb-ch-conv-n">
                  <WhoName who={who} />
                  <span className="nb-ch-conv-s" aria-live="polite">
                    {typing ? <Typing label={t("typing")} /> : status}
                  </span>
                </span>
              </Link>
            ) : (
              <span className="nb-ch-conv-qui">
                <WhoAvatar who={who} size={42} online={online} />
                <span className="nb-ch-conv-n">
                  <WhoName who={who} />
                  <span className="nb-ch-conv-s" aria-live="polite">
                    {typing ? <Typing label={t("typing")} /> : status}
                  </span>
                </span>
              </span>
            )}
            {view.canCall && !view.blockedByMe ? (
              <>
                <button
                  type="button"
                  className="nb-ch-rb"
                  aria-label={t("call.buttonAudio", { name: who.first })}
                  onClick={() => setAsking("audio")}
                >
                  <AudioGlyph />
                </button>
                <button
                  type="button"
                  className="nb-ch-rb"
                  aria-label={t("call.button", { name: who.first })}
                  onClick={() => setAsking("video")}
                >
                  <VideoGlyph />
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="nb-ch-rb"
              aria-label={t("options")}
              onClick={() => setMenu("menu")}
            >
              <PhoneIcon name="plusOptions" size={20} stroke={2.6} />
            </button>
          </header>
          {view.context ? (
            <Link href={view.context.href} className="nb-ch-contexte">
              <span className="nb-ch-contexte-i" aria-hidden>
                {view.context.initials}
              </span>
              <span className="nb-ch-contexte-t">
                <b>{view.context.title}</b>
                <span>{view.context.line}</span>
              </span>
              <span className="nb-ch-contexte-v">{t("context.see")}</span>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="nb-ch-tete-c">
          <header className="nb-ms-conv-h nb-ms-conv-r">
            <label className="nb-ms-champ">
              <PhoneIcon name="recherche" size={17} stroke={1.8} />
              <input
                type="search"
                value={rq}
                autoFocus
                placeholder={tm("convSearch.placeholder")}
                aria-label={tm("convSearch.placeholder")}
                onChange={(event) => {
                  setRq(event.target.value);
                  setRi(null);
                }}
              />
              {query ? (
                <span className="nb-meta nb-ms-compte" aria-live="polite">
                  {matches.length
                    ? tm("convSearch.count", { index: index + 1, total: matches.length })
                    : tm("convSearch.none")}
                </span>
              ) : null}
            </label>
            <button
              type="button"
              className="nb-rond nb-ms-fl"
              aria-label={tm("convSearch.previous")}
              disabled={index <= 0}
              onClick={() => setRi(Math.max(0, index - 1))}
            >
              <PhoneIcon name="haut" size={20} stroke={2} />
            </button>
            <button
              type="button"
              className="nb-rond nb-ms-fl"
              aria-label={tm("convSearch.next")}
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
              {tm("convSearch.close")}
            </button>
          </header>
        </div>
      )}

      <div className="nb-ch-fil">
        <div className="nb-ch-fil-c">
          {view.ephemeral ? (
            <button type="button" className="nb-ch-jour nb-ch-ephem" onClick={stopEphemeral}>
              <PhoneIcon name="minuteur" size={14} stroke={1.8} />
              {t("ephemeralOn")}
            </button>
          ) : null}
          <ol className="nb-ch-liste-m">
            {messages.map((message, at) => {
              const day = message.day && message.day !== messages[at - 1]?.day ? message.day : null;
              const shown = {
                ...message,
                reactions: withMine(message.reactions, mine[message.id]),
              };
              return (
                <MessageRow key={message.id} day={day}>
                  <MessageBubble
                    message={shown}
                    hit={matches.includes(message.id)}
                    current={message.id === current}
                    onOpen={setOpen}
                    picking={picking === message.id}
                    onPick={setPicking}
                    onReact={react}
                    fresh={!seen.has(message.id)}
                  />
                </MessageRow>
              );
            })}
            {typing ? (
              <li className="nb-ch-m" aria-label={t("typingOf", { name: who.first })}>
                <span className="nb-ch-bulle nb-ch-tape" aria-hidden>
                  <span className="nb-ch-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                </span>
              </li>
            ) : null}
          </ol>
          {messages.length === 0 ? <p className="nb-ch-vide-c">{tm("thread.empty")}</p> : null}
        </div>
      </div>

      {view.blockedByMe ? (
        <div className="nb-ch-ferme">
          <p>{tm("thread.blocked", { name: who.first })}</p>
          <button type="button" className="nb-ch-oui" disabled={pendingBlock} onClick={unblock}>
            {tm("thread.unblock")}
          </button>
        </div>
      ) : !view.canWrite ? (
        <div className="nb-ch-ferme">
          <p>{view.kind === "peer" ? tm("thread.notConnected") : tm("thread.closed")}</p>
        </div>
      ) : (
        <div className="nb-ch-bas">
          {suggestions.length && !voice.recording && !searching ? (
            <div className="nb-ch-suggest" role="group" aria-label={t("suggest.label")}>
              <span className="nb-ch-suggest-o" aria-hidden>
                <Spark size={15} />
              </span>
              {suggestions.map((text) => (
                <button
                  key={text}
                  type="button"
                  className="nb-ch-qr"
                  onClick={() => {
                    setUsed((state) => [...state, text]);
                    sendText(text, () => setUsed((state) => state.filter((item) => item !== text)));
                  }}
                >
                  {text}
                </button>
              ))}
            </div>
          ) : null}
          {voice.recording ? (
            <div className="nb-ch-saisie" role="group" aria-label={tm("voice.recording")}>
              <button
                type="button"
                className="nb-ch-plus"
                aria-label={tm("voice.delete")}
                onClick={() => voice.finish(false)}
              >
                <PhoneIcon name="corbeille" size={20} stroke={1.9} />
              </button>
              <div className="nb-ch-champ nb-ch-enreg">
                <span className="nb-ch-rec" aria-hidden />
                <b role="timer">{clock(voice.seconds)}</b>
                <span className="nb-ch-onde" aria-hidden>
                  {WAVE.map((bar, at) => (
                    <i key={at} style={{ height: bar.height, animationDelay: bar.delay }} />
                  ))}
                </span>
              </div>
              <button
                type="button"
                className="nb-ch-envoyer"
                aria-label={tm("voice.send")}
                onClick={() => voice.finish(true)}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          ) : (
            <form
              className="nb-ch-saisie"
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
            >
              <button
                type="button"
                className="nb-ch-plus"
                data-ouvert={attach ? "" : undefined}
                aria-label={tm("compose.attach")}
                aria-expanded={attach !== null}
                onClick={() => setAttach(attach ? null : "joindre")}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <label className="nb-ch-champ">
                <input
                  ref={field}
                  value={draft}
                  placeholder={t("compose.placeholder", { name: who.first })}
                  aria-label={t("compose.placeholder", { name: who.first })}
                  maxLength={4000}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (event.target.value.trim()) ping();
                  }}
                />
                <button
                  type="button"
                  className="nb-ch-orbi-b"
                  aria-label={tm("compose.orbi")}
                  data-orbi=""
                  onClick={() => setHelping(true)}
                >
                  <Spark size={14} />
                </button>
              </label>
              {typed ? (
                <button type="submit" className="nb-ch-envoyer" aria-label={tm("compose.send")}>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  className="nb-ch-envoyer"
                  aria-label={tm("compose.voice")}
                  onClick={() => void voice.begin()}
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3" />
                  </svg>
                </button>
              )}
            </form>
          )}
        </div>
      )}

      <AttachSheets
        view={view}
        sheet={attach}
        setSheet={setAttach}
        onCamera={() => setCamera(true)}
      />
      <ChatMenu
        view={view}
        sheet={menu}
        setSheet={setMenu}
        onSearch={() => setSearching(true)}
        mute={mute}
      />
      <OrbiHelp
        open={helping}
        onClose={() => setHelping(false)}
        conversationId={view.id}
        draft={draft}
        onSend={(text) => {
          setDraft("");
          sendText(text, () => setDraft(text));
        }}
      />
      <MediaViewer
        conversationId={view.id}
        open={open}
        messages={messages}
        title={who.name}
        forwardTo={view.forwardTo}
        onClose={() => setOpen(null)}
      />
      <CallConfirm
        view={view}
        open={asking !== null}
        mode={asking ?? "video"}
        online={online}
        onClose={() => setAsking(null)}
        onCall={() => {
          setCalling(asking ?? "video");
          setAsking(null);
        }}
      />
      {calling ? <VideoCall view={view} mode={calling} onEnd={() => setCalling(null)} /> : null}
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

/** A message, preceded by the day when it changes (« Vendredi 16 octobre », « Aujourd’hui »). */
function MessageRow({ day, children }: { day: string | null; children: ReactNode }) {
  return (
    <>
      {day ? (
        <li className="nb-ch-jour-l">
          <span className="nb-ch-jour">{day}</span>
        </li>
      ) : null}
      {children}
    </>
  );
}
