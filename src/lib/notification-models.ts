/**
 * « Les modèles de notifications » (Ephraïm, 03/11/2026): each notification shows what it is at a
 * glance. A coloured badge on the photo (message, connexion, candidature, agenda…), a short title
 * above the sentence (« Nouveau message », « Demande de connexion »…) and, for what calls for an
 * answer, the button that does it (« Répondre », « Voir la demande »…). Shared by the talent's
 * and the recruiter's lists on the phone.
 */
export const NOTIFICATION_KINDS = [
  "message",
  "connexion",
  "candidature",
  "agenda",
  "offre",
  "fil",
  "equipe",
  "formation",
  "compte",
  "autre",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** The icon of each kind (names of PhoneIcon). */
export const KIND_ICONS: Record<NotificationKind, string> = {
  message: "messages",
  connexion: "personne",
  candidature: "candidatures",
  agenda: "agenda",
  offre: "offres",
  fil: "jaime",
  equipe: "organisation",
  formation: "formation",
  compte: "cadenas",
  autre: "cloche",
};

export type NotificationModel = {
  kind: NotificationKind;
  /** Key of `notifModels.title.*`. */
  title: string;
  /** Key of `notifModels.action.*`, only for what awaits an answer. */
  action: string | null;
};

const MODELS: Record<string, NotificationModel> = {
  newMessage: { kind: "message", title: "newMessage", action: "reply" },
  teamMessage: { kind: "message", title: "teamMessage", action: "reply" },
  mention: { kind: "message", title: "mention", action: null },
  contactRequest: { kind: "connexion", title: "connectionRequest", action: "seeRequest" },
  connectionRequest: { kind: "connexion", title: "connectionRequest", action: "seeRequest" },
  contactAccepted: { kind: "connexion", title: "connectionAccepted", action: null },
  connectionAccepted: { kind: "connexion", title: "connectionAccepted", action: null },
  contactDeclined: { kind: "connexion", title: "connectionDeclined", action: null },
  newApplication: { kind: "candidature", title: "newApplication", action: "seeApplication" },
  statusChange: { kind: "candidature", title: "myApplication", action: null },
  notSelected: { kind: "candidature", title: "myApplication", action: null },
  matchReviewed: { kind: "candidature", title: "myApplication", action: null },
  profileViewed: { kind: "candidature", title: "profileViewed", action: null },
  jobUnavailable: { kind: "candidature", title: "myApplication", action: null },
  documentRequest: { kind: "candidature", title: "documentRequest", action: "send" },
  interviewInvite: { kind: "agenda", title: "interviewInvite", action: "answer" },
  interviewTeam: { kind: "agenda", title: "interview", action: null },
  interviewConfirmed: { kind: "agenda", title: "interviewConfirmed", action: null },
  interviewAccepted: { kind: "agenda", title: "interviewConfirmed", action: null },
  interviewReschedule: { kind: "agenda", title: "interviewReschedule", action: "answer" },
  interviewDeclined: { kind: "agenda", title: "interview", action: null },
  interviewCanceled: { kind: "agenda", title: "interviewCanceled", action: null },
  interviewSoon: { kind: "agenda", title: "reminder", action: "seeInterview" },
  reviewReminder: { kind: "agenda", title: "reminder", action: "review" },
  verificationCheck: { kind: "agenda", title: "reminder", action: "check" },
  orgTaskReminder: { kind: "agenda", title: "reminder", action: null },
  diagnosticReminder: { kind: "agenda", title: "reminder", action: null },
  jobApproved: { kind: "offre", title: "offer", action: null },
  jobRejected: { kind: "offre", title: "offer", action: null },
  jobChangesRequested: { kind: "offre", title: "offer", action: null },
  jobEnding: { kind: "offre", title: "offer", action: null },
  jobOpened: { kind: "offre", title: "offer", action: null },
  jobOpenFailed: { kind: "offre", title: "offer", action: null },
  atsReady: { kind: "offre", title: "ats", action: null },
  atsNotRun: { kind: "offre", title: "ats", action: null },
  feedReply: { kind: "fil", title: "feed", action: null },
  feedMention: { kind: "fil", title: "feed", action: null },
  feedLike: { kind: "fil", title: "feed", action: null },
  feedRepost: { kind: "fil", title: "feed", action: null },
  feedQuote: { kind: "fil", title: "feed", action: null },
  orgInvite: { kind: "equipe", title: "team", action: null },
  orgJoinRequest: { kind: "equipe", title: "team", action: null },
  orgJoinAccepted: { kind: "equipe", title: "team", action: null },
  orgJoinDeclined: { kind: "equipe", title: "team", action: null },
  candidateAssigned: { kind: "equipe", title: "team", action: null },
  talentShared: { kind: "equipe", title: "team", action: null },
  colleagueProposed: { kind: "equipe", title: "team", action: null },
  planRequested: { kind: "equipe", title: "team", action: null },
  orgTaskAssigned: { kind: "equipe", title: "team", action: null },
  orgTaskDone: { kind: "equipe", title: "team", action: null },
  certificateIssued: { kind: "formation", title: "learning", action: null },
  diagnosticReady: { kind: "formation", title: "learning", action: null },
  referenceConfirmed: { kind: "formation", title: "reference", action: null },
  referenceDeclined: { kind: "formation", title: "reference", action: null },
  paymentSucceeded: { kind: "compte", title: "billing", action: null },
  paymentFailed: { kind: "compte", title: "billing", action: null },
  renewalDue: { kind: "compte", title: "billing", action: null },
  grace: { kind: "compte", title: "billing", action: null },
  downgraded: { kind: "compte", title: "billing", action: null },
  upgraded: { kind: "compte", title: "billing", action: null },
  renewed: { kind: "compte", title: "billing", action: null },
  licenseActivated: { kind: "compte", title: "billing", action: null },
  licenseOnHold: { kind: "compte", title: "billing", action: null },
  licenseExpiring: { kind: "compte", title: "billing", action: null },
  licenseExpired: { kind: "compte", title: "billing", action: null },
  licensesLow: { kind: "compte", title: "billing", action: null },
};

export function notificationModel(type: string): NotificationModel {
  return MODELS[type] ?? { kind: "autre", title: "jumanly", action: null };
}
