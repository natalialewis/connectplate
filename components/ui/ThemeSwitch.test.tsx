import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeSwitch } from "./ThemeSwitch";

describe("ThemeSwitch", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    localStorage.clear();
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add("light");
  });

  it("renders switch after theme is resolved", async () => {
    render(<ThemeSwitch />);
    const sw = await screen.findByRole("switch");
    expect(sw).toBeInTheDocument();
  });

  it("toggles theme on click", async () => {
    localStorage.setItem("theme", "light");
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add("light");
    render(<ThemeSwitch />);
    const sw = await screen.findByRole("switch");
    fireEvent.click(sw);
    await waitFor(() => {
      expect(localStorage.getItem("theme")).toBe("dark");
    });
    fireEvent.click(sw);
    await waitFor(() => {
      expect(localStorage.getItem("theme")).toBe("light");
    });
  });
});
