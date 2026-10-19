/** Id of the filter sheet of Offres: the header's filter button opens it when the page has it. */
export const OFFER_FILTERS_ID = "t-filtres";

/** Query keys set by the filter sheet: the header counts them on its filter button. */
export const offerFilterKeys = [
  "secteur",
  "ville",
  "teletravail",
  "contrat",
  "experience",
  "verifiees",
] as const;
