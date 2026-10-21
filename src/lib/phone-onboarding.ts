import type { WelcomeGoal } from "./welcome";

/** Situations of step 4 (Modèle B, planche Accueil), `phoneAccueil.profile.situation.*`. */
export const phoneSituations = ["student", "graduate", "seeking", "employed", "switching"] as const;
export type PhoneSituation = (typeof phoneSituations)[number];

/** The goal that orders the home (`homeFocus`), for each situation. */
export const situationGoal: Record<PhoneSituation, WelcomeGoal> = {
  student: "firstJob",
  graduate: "firstJob",
  seeking: "newJob",
  employed: "promotion",
  switching: "reconversion",
};

/** Contracts of step 5 (planche: CDI, CDD, Stage, Freelance, Temps partiel). */
export const phoneContracts = ["cdi", "cdd", "internship", "freelance", "partTime"] as const;
export type PhoneContract = (typeof phoneContracts)[number];

/** Tastes of « Trouvons votre Cap » (Orbi during the sign-up). */
export const phoneTastes = ["numbers", "people", "create"] as const;

/**
 * Skills offered first at step 6 (planche Accueil `COMPS`), when the reference has them; the list
 * is completed with the skills most asked for by the offers.
 */
export const phoneFirstSkills = [
  "Excel",
  "SQL",
  "Power BI",
  "Python",
  "Analyse de données",
  "Communication",
  "Anglais",
  "Gestion de projet",
  "Comptabilité",
  "Service client",
  "Réseaux sociaux",
  "Rédaction",
];
