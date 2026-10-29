/**
 * What the screens of Messages on the phone receive (Modèle B, lot B8): plain values, already
 * worded on the server, so the browser only draws them.
 */
import type { InboxTab } from "@/server/services/messages-phone";

export type { InboxTab };

/** A person or an organization, as drawn in a row, a head or a card. */
export type WhoView = {
  name: string;
  /** « Patrick » for a person, the organization's name otherwise. */
  first: string;
  initials: string;
  image: string | null;
  tone: number;
  org: boolean;
  verified: boolean;
  online: boolean;
  /** « Analyste crédit · Fleuve Banque », « Fintech · Kinshasa ». */
  line: string;
  /** « En ligne », « Vu à 08:12 », « Compte entreprise ». */
  status: string;
  /** Their page in Explorer, or null when it does not open. */
  href: string | null;
  /** The person behind the face (for « En ligne » kept live), null for an organization. */
  personId: string | null;
  /** The colours of the ring around the face (Chat v2): their skills, or their name. */
  ring: string[];
};

export type InboxRow = {
  id: string;
  tab: InboxTab;
  who: WhoView;
  time: string;
  preview: string;
  unread: number;
  muted: boolean;
  pinned: boolean;
  typing: boolean;
  /** My last message, and whether it was read (the double check of the list). */
  lastMine: boolean;
  lastRead: boolean;
  /** The last message is a voice note (the microphone before the preview). */
  voice: boolean;
};

export type ConnectionView = {
  connectionId: string;
  conversationId: string | null;
  who: WhoView;
};

export type RequestView = {
  id: string;
  who: WhoView;
  note: string | null;
};

export type OrgRequestView = {
  id: string;
  who: WhoView;
  note: string;
  job: string | null;
};

export type InboxView = {
  rows: InboxRow[];
  connections: ConnectionView[];
  requests: RequestView[];
  orgRequests: OrgRequestView[];
};

export type PhotoView = { src: string; width: number; height: number };

export type Bubble =
  | { kind: "system"; text: string }
  | {
      /** A recruitment decision: a card, never a bubble, with a way to bounce back after a no. */
      kind: "decision";
      hired: boolean;
      title: string;
      paragraphs: string[];
      signer: string;
      bounce: { title: string; text: string; href: string; cta: string } | null;
    }
  | { kind: "text"; text: string }
  /** A post of the Fil sent from « Partager »: a card that opens it. */
  | { kind: "post"; gone: true; text: string }
  | {
      kind: "post";
      gone: false;
      href: string;
      name: string;
      label: string;
      initials: string;
      image: string | null;
      tone: number;
      org: boolean;
      title: string | null;
      body: string;
      photo: { src: string; alt: string } | null;
    }
  | { kind: "photos"; photos: PhotoView[]; hd: boolean }
  | { kind: "doc"; name: string; meta: string; ext: string; href: string }
  | {
      kind: "contact";
      name: string;
      line: string;
      initials: string;
      image: string | null;
      tone: number;
      href: string | null;
    }
  | {
      kind: "event";
      label: string;
      title: string;
      meta: string;
      action: { href: string; label: string; download: boolean } | null;
    }
  | {
      kind: "org";
      name: string;
      line: string;
      initials: string;
      image: string | null;
      tone: number;
      href: string;
    }
  | {
      /** An interview proposed in the conversation (planche Chat-conv, carte Entretien). */
      kind: "interview";
      id: string;
      title: string;
      meta: string;
      confirmed: boolean;
      /** The .ics of a confirmed interview (« Ajouter à l’agenda »). */
      agendaHref: string | null;
      /** « Choisir un créneau » while the time is not chosen. */
      chooseHref: string | null;
      /** « S’entraîner »: a simulation of this interview with Orbi. */
      practiceHref: string;
    }
  | { kind: "voice"; src: string; seconds: number; duration: string }
  | { kind: "link"; title: string; url: string; display: string; internal: boolean };

export type MessageView = {
  id: string;
  mine: boolean;
  at: string;
  time: string;
  /** Sent while « Messages éphémères » was on. */
  ephemeral: boolean;
  /** Read by the other side (« · Lu »), for my messages only. */
  read: boolean;
  /** The words of the message, for the search in the conversation. */
  words: string;
  /** « Vendredi 16 octobre », « Aujourd’hui »: the separator drawn when the day changes. */
  day: string;
  /** The reactions under it (Chat v2), and whether one can react to it. */
  reactions: { emojis: string[]; count: number; mine: string | null } | null;
  reactable: boolean;
  bubble: Bubble;
};

/** The application a conversation comes from, pinned under its head (Chat v2). */
export type ContextView = {
  initials: string;
  title: string;
  line: string;
  href: string;
};

export type AttachDoc = { id: string; title: string; line: string };

export type ThreadView = {
  id: string;
  kind: "peer" | "organization";
  who: WhoView;
  muted: boolean;
  ephemeral: number | null;
  blocked: boolean;
  blockedByMe: boolean;
  canWrite: boolean;
  messages: MessageView[];
  /** The application under the head, when the conversation comes from one. */
  context: ContextView | null;
  /** « Voir la candidature » in the menu ···. */
  applicationHref: string | null;
  /** The line under the name during a call: « Entretien · Analyste… » or their line. */
  callLine: string;
  /** A video call is possible here (connections, or the recruiter of an application). */
  canCall: boolean;
  pinned: boolean;
  /** The other side is typing (as the page was read). */
  typing: boolean;
  /** The replies Orbi suggests above the field (rules, no credit). */
  suggestions: string[];
  /** My initials, for my own tile during a call. */
  me: { initials: string };
  /** What « Joindre » offers. */
  certificates: AttachDoc[];
  cvs: AttachDoc[];
  documents: AttachDoc[];
  /** The next three working days for « Agenda », as `YYYY-MM-DD` with their label. */
  days: { value: string; label: string }[];
  /** The other conversations, for « Transférer ». */
  forwardTo: { id: string; who: WhoView }[];
  exportName: string;
};

export type FoundMessage = {
  conversationId: string;
  messageId: string;
  time: string;
  text: string;
  photo: string | null;
};

/** « Awa et 2 autres connexions en commun », with up to three faces. */
export type MutualView = {
  count: number;
  text: string;
  faces: { key: string; who: WhoView }[];
};

/** The page « Connexions » of the Chat (Ephraïm 29/10/2026). */
export type ConnexionsView = {
  received: (RequestView & { ago: string; mutual: MutualView })[];
  orgRequests: OrgRequestView[];
  sent: { id: string; who: WhoView; ago: string }[];
  connections: (ConnectionView & { since: string; mutual: MutualView })[];
  suggestions: { who: WhoView; mutual: MutualView; reason: "mutual" | "field" }[];
};
