import { renderHook, act } from "@testing-library/react";
import { useSignUp } from "./useSignUp";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignUp = jest.fn();
const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockProfileUpdate = jest.fn();
const mockProfileSelectMaybeSingle = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createSupabaseClient: () => ({
    auth: {
      signUp: mockSignUp,
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockProfileSelectMaybeSingle,
        }),
      }),
      update: (payload: unknown) => ({
        eq: () => mockProfileUpdate(payload),
      }),
    }),
  }),
}));

describe("useSignUp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockProfileSelectMaybeSingle.mockResolvedValue({ data: { avatar_url: null }, error: null });
  });

  it("returns signUp function, isLoading, error, and clearError", () => {
    const { result } = renderHook(() => useSignUp());
    expect(result.current.signUp).toBeDefined();
    expect(result.current.clearError).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("calls signUp with email, password, and profile metadata", async () => {
    mockSignUp.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      await result.current.signUp({
        email: "new@b.com",
        password: "secret",
        firstName: "Ada",
        lastName: "Lovelace",
        username: "ada.codes",
      });
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "new@b.com",
      password: "secret",
      options: {
        data: {
          first_name: "Ada",
          last_name: "Lovelace",
          username: "ada.codes",
        },
      },
    });
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("sets error on failed signup", async () => {
    mockSignUp.mockResolvedValue({ error: { message: "Email already registered" } });

    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      await result.current.signUp({
        email: "exists@b.com",
        password: "secret",
        firstName: "A",
        lastName: "B",
        username: "ab",
      });
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.error).toBe("An error occurred");
  });

  it("maps duplicate username database errors to a friendly message", async () => {
    mockSignUp.mockResolvedValue({ error: new Error("Database error saving new user") });

    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      await result.current.signUp({
        email: "exists@b.com",
        password: "secret",
        firstName: "Ada",
        lastName: "Lovelace",
        username: "ada.codes",
      });
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Username already in use.");
  });

  it("completePendingSignup updates profile and metadata when session exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "oauth-user-1" } },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockProfileUpdate.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      await result.current.completePendingSignup({
        firstName: "Pat",
        lastName: "Lee",
        username: "pat.codes",
      });
    });

    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: {
        first_name: "Pat",
        last_name: "Lee",
        username: "pat.codes",
      },
    });
    expect(mockProfileUpdate).toHaveBeenCalledWith({
      first_name: "Pat",
      last_name: "Lee",
      username: "pat.codes",
      signup_completed: true,
    });
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("completePendingSignup sets avatar_url from OAuth metadata when profile has none", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "oauth-user-2",
          user_metadata: { picture: "https://lh3.googleusercontent.com/a/example" },
        },
      },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockProfileSelectMaybeSingle.mockResolvedValue({ data: { avatar_url: null }, error: null });
    mockProfileUpdate.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      await result.current.completePendingSignup({
        firstName: "Sam",
        lastName: "OAuth",
        username: "sam.oauth",
      });
    });

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      first_name: "Sam",
      last_name: "OAuth",
      username: "sam.oauth",
      signup_completed: true,
      avatar_url: "https://lh3.googleusercontent.com/a/example",
    });
  });

  it("completePendingSignup does not overwrite existing avatar_url", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "oauth-user-3",
          user_metadata: { picture: "https://lh3.googleusercontent.com/a/google" },
        },
      },
      error: null,
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockProfileSelectMaybeSingle.mockResolvedValue({
      data: { avatar_url: "https://example.com/storage/avatar.jpg" },
      error: null,
    });
    mockProfileUpdate.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useSignUp());

    await act(async () => {
      await result.current.completePendingSignup({
        firstName: "Alex",
        lastName: "User",
        username: "alex.u",
      });
    });

    expect(mockProfileUpdate).toHaveBeenCalledWith({
      first_name: "Alex",
      last_name: "User",
      username: "alex.u",
      signup_completed: true,
    });
  });
});
