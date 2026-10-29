/** Mon profil › Statistiques: the periods the person can pick, in days. */
export const AUDIENCE_PERIODS = [7, 30, 90] as const;
export type AudiencePeriod = (typeof AUDIENCE_PERIODS)[number];

export type AudienceFigures = {
  visits: number;
  views: number;
  impressions: number;
  /** The same numbers over the period before, to show the change. */
  before: { visits: number; views: number; impressions: number };
  /** Visits per day (7 and 30 days) or per week (90 days), oldest first. */
  bars: number[];
};
