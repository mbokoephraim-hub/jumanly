/** The colour of a score pill: lime from 80, mint from 70, sand below (server and browser). */
export const levelOf = (score: number) => (score >= 80 ? "haut" : score >= 70 ? "bon" : "moyen");
