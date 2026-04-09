import { render, screen } from "@testing-library/react";
import AuthPage from "./AuthPage";

describe("AuthPage", () => {
  it("renders title and description", () => {
    render(
      <AuthPage title="Log in" description="Enter your credentials.">
        <form>Form content</form>
      </AuthPage>
    );
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByText(/enter your credentials/i)).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <AuthPage title="Sign up" description="Create an account.">
        <form aria-label="Sign up form">Form content</form>
      </AuthPage>
    );
    expect(screen.getByRole("form", { name: /sign up form/i })).toBeInTheDocument();
    expect(screen.getByText("Form content")).toBeInTheDocument();
  });

  it("does not render a back link", () => {
    render(
      <AuthPage title="Login" description="Desc">
        <div />
      </AuthPage>
    );
    expect(screen.queryByRole("link", { name: /back to home/i })).not.toBeInTheDocument();
  });
});
