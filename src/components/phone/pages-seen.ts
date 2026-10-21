/** Pages shown in this tab since it opened (counted by the stack): more than one, « Retour » stays in Jumanly. */
let seen = 0;

export function countPage() {
  seen += 1;
}

export function pagesSeen() {
  return seen;
}
