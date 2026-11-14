/**
 * The class of a score (`cls()` of the prototype): fort from 75, consolidé from 50, limité below.
 * Kept out of the client components so server pages can call it (calling a function exported by a
 * "use client" module from the server throws).
 */
export const clsOf = (score: number) => (score >= 75 ? "fort" : score >= 50 ? "cons" : "lim");
