import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

jest.mock("./AuthNav", () => ({
  AuthNav: () => <div data-testid="auth-nav">AuthNav</div>,
}));
jest.mock("@/components/ui/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button" aria-label="Theme">Theme</button>,
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

describe("Header", () => {
  it("renders as banner", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders logo link to home", () => {
    render(<Header />);
    const homeLink = screen.getByRole("link", { name: /connectplate/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("renders AuthNav and ThemeToggle", () => {
    render(<Header />);
    expect(screen.getByTestId("auth-nav")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /theme/i })).toBeInTheDocument();
  });
});
