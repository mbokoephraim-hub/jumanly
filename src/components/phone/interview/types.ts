/** The views of the interview practice on the phone (Modèle B, lot B6), built on the server. */
import type { PhoneFocus } from "@/lib/interview-options";

export type Origin = {
  /** Query kept from the settings to the report (`candidature=…`, `depuis=…`). */
  query: string;
  /** « Candidature », « Formation » or « Retour » beside the chevron. */
  backLabel: string;
  /** Where the settings go back to, and where the report's cross goes. */
  backHref: string;
  /** « Retour : ma candidature » under the report, or null. */
  endLabel: string | null;
};

export type ModeAccess = {
  included: boolean;
  trial: boolean;
  trialLeft: boolean;
  plan: string | null;
};

export type SetupView = {
  origin: Origin;
  job: { id: string; title: string; initials: string; line: string } | null;
  company: string | null;
  cv: string | null;
  jobTitle: string;
  plan: string | null;
  modes: { text: ModeAccess; voice: ModeAccess };
  /** Not open yet (no application, or no simulation in the plan): what is missing. */
  reserved: { applied: boolean; plan: boolean; planName: string | null } | null;
  initial: { mode: "text" | "voice"; focus: PhoneFocus; minutes: number; tone: "easy" | "hard" };
};

export type RunView = {
  id: string;
  origin: Origin;
  mode: "text" | "voice";
  english: boolean;
  minutes: number;
  questions: { question: string; hint: string }[];
  /** The first question without an answer. */
  start: number;
  company: string | null;
  settings: string;
};

export type ReportView = {
  id: string;
  origin: Origin;
  fromHistory: boolean;
  overall: number | null;
  summary: string;
  criteria: { label: string; score: number; reason: string }[];
  works: string[];
  toWork: string[];
  toWorkTitle: string;
  questions: { n: number; question: string; score: number | null; href: string }[];
  weak: number[];
  settings: string;
};

export type AnswerView = {
  id: string;
  n: number;
  index: number;
  score: number | null;
  question: string;
  saidTitle: string;
  text: string | null;
  meta: string | null;
  followUp: string | null;
  works: string[];
  improve: string[];
  tip: string;
  back: string;
  next: string | null;
};

export type HistoryRow = {
  href: string;
  title: string;
  meta: string;
  score: number | null;
  ongoing: boolean;
};
