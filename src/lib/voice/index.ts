/**
 * Voice for interview simulations (E10), behind an adapter: synthesis reads the question aloud,
 * transcription turns the spoken answer into text the talent reviews before sending. The provider
 * is chosen by `NEXT_PUBLIC_VOICE_PROVIDER`: `browser` (default, Web Speech API, no audio leaves
 * the device through Jumanly) or `none` (questions shown only, answers typed). A hosted provider
 * (transcription and synthesis on a server) can be added as another implementation.
 */

export type ListenHandlers = {
  /** The transcript so far (final parts and the part still being recognised). */
  onText: (text: string) => void;
  onEnd: () => void;
  onError: (reason: "denied" | "other") => void;
};

export type SpeakEvents = { onStart?: () => void; onEnd?: () => void };

export interface VoiceAdapter {
  readonly name: string;
  readonly canSpeak: boolean;
  readonly canListen: boolean;
  speak(text: string, events?: SpeakEvents): void;
  stopSpeaking(): void;
  /** Starts listening; the returned function stops it. */
  listen(handlers: ListenHandlers): () => void;
}

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionConstructor = new () => Recognition;

const LANG = "fr-FR";

export class BrowserVoice implements VoiceAdapter {
  readonly name = "browser";

  private get Recognition(): RecognitionConstructor | null {
    if (typeof window === "undefined") return null;
    const scope = window as unknown as {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
  }

  get canSpeak() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  get canListen() {
    return this.Recognition !== null;
  }

  speak(text: string, events: SpeakEvents = {}) {
    if (!this.canSpeak) return events.onEnd?.();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG;
    const voice = window.speechSynthesis
      .getVoices()
      .find((item) => item.lang.toLowerCase().startsWith("fr"));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => events.onStart?.();
    utterance.onend = () => events.onEnd?.();
    utterance.onerror = () => events.onEnd?.();
    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.canSpeak) window.speechSynthesis.cancel();
  }

  listen(handlers: ListenHandlers) {
    const Recognition = this.Recognition;
    if (!Recognition) {
      handlers.onError("other");
      return () => undefined;
    }
    const recognition = new Recognition();
    recognition.lang = LANG;
    recognition.continuous = true;
    recognition.interimResults = true;
    const finals: string[] = [];
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        if (result.isFinal) finals.push(result[0].transcript.trim());
        else interim += result[0].transcript;
      }
      handlers.onText([...finals, interim.trim()].filter(Boolean).join(" "));
    };
    recognition.onerror = (event) =>
      handlers.onError(event.error === "not-allowed" ? "denied" : "other");
    recognition.onend = () => handlers.onEnd();
    recognition.start();
    return () => recognition.stop();
  }
}

export class NoVoice implements VoiceAdapter {
  readonly name = "none";
  readonly canSpeak = false;
  readonly canListen = false;
  speak(_text: string, events: SpeakEvents = {}) {
    events.onEnd?.();
  }
  stopSpeaking() {}
  listen(handlers: ListenHandlers) {
    handlers.onError("other");
    return () => undefined;
  }
}

export function voiceAdapter(): VoiceAdapter {
  return process.env.NEXT_PUBLIC_VOICE_PROVIDER === "none" ? new NoVoice() : new BrowserVoice();
}
