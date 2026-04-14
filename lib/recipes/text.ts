/**
 * Uppercase the first Unicode letter in a string (skips leading non-letters).
 */
export function capitalizeFirstLetter(input: string): string {
  const t = input.trim();
  if (!t) {
    return t;
  }
  const i = t.search(/\p{L}/u);
  if (i === -1) {
    return t;
  }
  const ch = t[i];
  const upper = ch.toLocaleUpperCase();
  return t.slice(0, i) + upper + t.slice(i + 1);
}
