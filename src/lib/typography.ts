/**
 * French typography for large titles: the space before « ? ! : ; » and inside « » becomes a
 * narrow no-break space, so a question mark never ends up alone on its line.
 */
export function keepTogether(text: string): string {
  return text.replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« ");
}
