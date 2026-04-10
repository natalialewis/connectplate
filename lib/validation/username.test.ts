import { validateUsername } from "./username";

describe("validateUsername", () => {
  it("accepts valid handles", () => {
    expect(validateUsername("ada.codes").ok).toBe(true);
    expect(validateUsername("a_b_c").ok).toBe(true);
    expect(validateUsername("abc").ok).toBe(true);
  });

  it("rejects leading or trailing spaces", () => {
    const r = validateUsername(" ada ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/space/i);
  });

  it("rejects uppercase", () => {
    const r = validateUsername("Ada");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/lowercase/i);
  });

  it("rejects ending with a period or underscore", () => {
    expect(validateUsername("ada.").ok).toBe(false);
    expect(validateUsername("ada_").ok).toBe(false);
  });

  it("rejects adjacent dots or underscores", () => {
    const r = validateUsername("ada..codes");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/row/i);
  });
});
