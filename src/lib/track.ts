import { readConsentCookie } from "./consent";

/**
 * The one measuring function of the app (docs/ux-mobile-talent/BRIEF-MOBILE-TALENT.md § 2.9,
 * cahier des charges § 14). No analytics provider is chosen yet: an event goes nowhere until one
 * is plugged in with `setTrackSink`. Nothing leaves without the « analytics » cookie consent, and
 * private content (CV, message, document, free text) never goes in: only listed events, with short
 * values whose keys are not on the list below.
 */
export const trackEvents = [
  "home_opened",
  "job_viewed",
  "job_filtered",
  "job_saved",
  "application_started",
  "application_sent",
  "course_opened",
  "lesson_resumed",
  "cv_opened",
  "cv_created",
  "cv_downloaded",
  "profile_photo_saved",
  "profile_step_opened",
  "search_used",
  "followup_opened",
  "notification_opened",
] as const;
export type TrackEvent = (typeof trackEvents)[number];
export type TrackProps = Record<string, string | number | boolean>;

/** Keys that could carry private content: dropped whatever their value. */
const privateKeys =
  /text|message|content|body|cv|letter|lettre|document|file|name|nom|email|mail|query|search|q$/i;
const MAX_VALUE = 40;

type Sink = (event: TrackEvent, props: TrackProps) => void;
let sink: Sink | null = null;

/** Plugs the provider the owner chooses (none today). */
export function setTrackSink(next: Sink | null) {
  sink = next;
}

/** What may leave: listed keys only, short values, nothing that looks like content. */
export function cleanProps(props: TrackProps = {}): TrackProps {
  return Object.fromEntries(
    Object.entries(props).filter(
      ([key, value]) =>
        !privateKeys.test(key) &&
        (typeof value !== "string" || (value.length <= MAX_VALUE && !value.includes("@"))),
    ),
  );
}

export function track(event: TrackEvent, props?: TrackProps, cookies?: string) {
  if (typeof document === "undefined" && cookies === undefined) return false;
  const consent = readConsentCookie(cookies ?? document.cookie);
  if (!consent?.analytics || !trackEvents.includes(event)) return false;
  sink?.(event, cleanProps(props));
  return true;
}
