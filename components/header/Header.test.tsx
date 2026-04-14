import { render, screen } from "@testing-library/react";
import { Header } from "./Header";

const mockUsePathname = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock("./AuthNav", () => ({
  AuthNav: () => <div data-testid="auth-nav">AuthNav</div>,
}));
jest.mock("./HeaderNavTabs", () => ({
  HeaderNavTabs: () => <div data-testid="header-nav-tabs">Tabs</div>,
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
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("renders as banner", () => {
    render(<Header />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders logo link to home", () => {
    render(<Header />);
    const homeLink = screen.getByRole("link", { name: /connectplate/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("renders AuthNav and nav tabs on main chrome", () => {
    render(<Header />);
    expect(screen.getByTestId("auth-nav")).toBeInTheDocument();
    expect(screen.getByTestId("header-nav-tabs")).toBeInTheDocument();
  });

  it("renders centered auth header on login page without chrome extras", () => {
    mockUsePathname.mockReturnValue("/login");
    render(<Header />);
    expect(screen.getByRole("link", { name: /connectplate/i })).toBeInTheDocument();
    expect(screen.queryByTestId("auth-nav")).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-nav-tabs")).not.toBeInTheDocument();
  });
});
