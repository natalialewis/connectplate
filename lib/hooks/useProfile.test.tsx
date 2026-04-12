import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { ProfileProvider, useProfileContext } from "@/lib/contexts/ProfileContext";
import { useProfile } from "./useProfile";

jest.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

const mockProfile = {
  id: "user-1",
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  avatar_url: null,
  updated_at: "2024-01-01T00:00:00Z",
  created_at: "2024-01-01T00:00:00Z",
  signup_completed: true,
};

jest.mock("@/lib/supabase/client", () => ({
  createSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({ data: mockProfile, error: null }),
        }),
      }),
    }),
  }),
}));

describe("useProfile", () => {
  it("throws when used outside ProfileProvider", () => {
    expect(() => renderHook(() => useProfile())).toThrow(
      "useProfileContext must be used within ProfileProvider"
    );
  });

  it("returns profile context when inside ProfileProvider", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider>{children}</ProfileProvider>
    );

    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current).toHaveProperty("profile");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
      expect(result.current).toHaveProperty("refetch");
    });
  });
});
