import type { User } from "@supabase/supabase-js";
import { userHasEmailPasswordIdentity } from "./userIdentity";

function makeUser(identities: { provider: string }[]): User {
  return { identities } as unknown as User;
}

describe("userHasEmailPasswordIdentity", () => {
  it("returns false for null", () => {
    expect(userHasEmailPasswordIdentity(null)).toBe(false);
  });

  it("returns false for Google-only user", () => {
    expect(userHasEmailPasswordIdentity(makeUser([{ provider: "google" }]))).toBe(false);
  });

  it("returns true when email identity exists", () => {
    expect(userHasEmailPasswordIdentity(makeUser([{ provider: "email" }]))).toBe(true);
  });

  it("returns true when email and google are both linked", () => {
    expect(
      userHasEmailPasswordIdentity(makeUser([{ provider: "google" }, { provider: "email" }])),
    ).toBe(true);
  });
});
