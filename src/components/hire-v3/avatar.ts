/** The initials of the prototype's avatars (`ini()`): the first letter of the first two words. */
export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** One of the seven avatar colours of the prototype (`a1` to `a7`), steady for a name. */
export function avatarColor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `a${(hash % 7) + 1}`;
}
