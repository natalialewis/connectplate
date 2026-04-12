import { renderHook, act } from "@testing-library/react";
import { useChangePassword } from "./useChangePassword";

const mockGetUser = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockUpdateUser = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createSupabaseClient: () => ({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      updateUser: mockUpdateUser,
    },
  }),
}));

describe("useChangePassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { email: "user@example.com" } },
      error: null,
    });
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
  });

  it("returns idle state initially", () => {
    const { result } = renderHook(() => useChangePassword());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(false);
  });

  it("rejects incorrect current password", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: "Invalid" } });

    const { result } = renderHook(() => useChangePassword());

    await act(async () => {
      await result.current.changePassword("wrong", "Newpass1!");
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Current password is incorrect.");
    expect(result.current.success).toBe(false);
  });

  it("updates password after verifying current password", async () => {
    const { result } = renderHook(() => useChangePassword());

    await act(async () => {
      await result.current.changePassword("Oldpass1!", "Newpass1!");
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "Oldpass1!",
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "Newpass1!" });
    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("rejects weak new password after successful reauth", async () => {
    const { result } = renderHook(() => useChangePassword());

    await act(async () => {
      await result.current.changePassword("Oldpass1!", "weak");
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(result.current.success).toBe(false);
    expect(result.current.error).toContain("uppercase");
  });
});
