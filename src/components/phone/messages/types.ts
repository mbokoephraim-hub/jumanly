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
};

export type InboxRow = {
  id: string;
  tab: InboxTab;
  who: WhoView;
  time: string;
  preview: string;
  unread: number;
  muted: boolean;
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
  bubble: Bubble;
};

export type AttachDoc = { id: string; title: string; line: string };
export type ShareOrg = {
  id: string;
  name: string;
  line: string;
  initials: string;
  image: string | null;
  tone: number;
};

export type ThreadView = {
  id: string;
  kind: "peer" | "organization";
  who: WhoView;
  /** The organization a letter is written for (« Orbi rédige une lettre pour… »). */
  company: string | null;
  muted: boolean;
  ephemeral: number | null;
  blocked: boolean;
  blockedByMe: boolean;
  canWrite: boolean;
  messages: MessageView[];
  /** What « Joindre » offers. */
  cvs: AttachDoc[];
  letters: AttachDoc[];
  documents: AttachDoc[];
  contacts: ConnectionView[];
  orgs: ShareOrg[];
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
