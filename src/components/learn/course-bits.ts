/** Small helpers shared by the course page, the player and the quiz (mockups 03-04 to 03-06). */

/** "08:12" for a lesson of 492 seconds. */
export function clock(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${String(minutes).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Duration of a module in minutes, from its lessons. */
export function moduleMinutes(module: { lessons: { durationSec: number }[] }) {
  return Math.round(module.lessons.reduce((sum, lesson) => sum + lesson.durationSec, 0) / 60);
}

/** "KA" for "Dr Kofi Asante": the two last words, as on the instructor tile. */
export function initialsOf(name: string) {
  const words = name.split(/\s+/).filter((word) => /^\p{L}/u.test(word));
  return words
    .slice(-2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
