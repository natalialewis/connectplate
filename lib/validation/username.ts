/**
 * Client-side validation matching `profiles.username` in the database:
 * 3–30 chars, lowercase letters, digits, `.` or `_` in the middle only;
 * must start and end with a letter or digit; no adjacent `.` or `_`.
 */
export function validateUsername(raw: string): { ok: true } | { ok: false; message: string } {
  if (raw !== raw.trim()) {
    return { ok: false, message: "Username cannot have leading or trailing spaces." };
  }
  const username = raw.trim();
  if (username.length === 0) {
    return { ok: false, message: "Username is required." };
  }
  if (username !== username.toLowerCase()) {
    return { ok: false, message: "Username must use lowercase letters only." };
  }
  if (username.length < 3 || username.length > 30) {
    return { ok: false, message: "Username must be between 3 and 30 characters." };
  }
  if (!/^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$/.test(username)) {
    return {
      ok: false,
      message:
        "Username can only use lowercase letters, numbers, periods, and underscores, and cannot start or end with a period or underscore.",
    };
  }
  if (/[._]{2}/.test(username)) {
    return { ok: false, message: "Username cannot contain two periods or underscores in a row." };
  }
  return { ok: true };
}
