import { renderHook, act } from "@testing-library/react";
import { useLogin } from "./useLogin";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignInWithPassword = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createSupabaseClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe("useLogin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns login function, isLoading, and error", () => {
    const { result } = renderHook(() => useLogin());
    expect(result.current.login).toBeDefined();
    expect(typeof result.current.login).toBe("function");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("redirects to home on successful login", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({ email: "a@b.com", password: "secret" });
    });

    expect(mockPush).toHaveBeenCalledWith("/");
    expect(result.current.error).toBeNull();
  });

  it("sets error on failed login", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: "Invalid credentials" } });

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({ email: "a@b.com", password: "wrong" });
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(result.current.error).toBe("An error occurred");
  });
});
