import { useAuth } from "@repo/shared/providers/authentication/provider";
import { SignInGate } from "@repo/shared/views/AccountView/components/SignInGate/signInGate";
import { render, screen } from "@testing-library/react";
// jest-dom matchers (toBeInTheDocument, toHaveTextContent, toHaveAttribute)
// aren't registered globally in this repo's jest config; the existing tsx
// test pattern here avoids them, but this suite needs them, so opt in locally.
import "@testing-library/jest-dom";

jest.mock("@repo/shared/providers/authentication/provider", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("SignInGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders nothing when login is not configured and not loading", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isConfigured: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      user: null,
    });

    const { container } = render(
      <SignInGate message="Sign in to see this.">
        <span>child</span>
      </SignInGate>
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  test("renders a spinner while loading on a configured site", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isConfigured: true,
      isLoading: true,
      login: jest.fn(),
      logout: jest.fn(),
      user: null,
    });

    render(
      <SignInGate message="Sign in to see this.">
        <span>child</span>
      </SignInGate>
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("renders the sign-in prompt when configured, loaded, and signed out", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isConfigured: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      user: null,
    });

    render(
      <SignInGate message="Sign in to see your analyses.">
        <span>child</span>
      </SignInGate>
    );

    expect(
      screen.getByText("Sign in to see your analyses.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.queryByText("child")).not.toBeInTheDocument();
  });

  test("renders children when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isConfigured: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      user: {
        email: "person@example.com",
        name: "Person",
        preferred_username: "person",
        sub: "abc123",
      },
    });

    render(
      <SignInGate message="Sign in to see this.">
        <span>child</span>
      </SignInGate>
    );

    expect(screen.getByText("child")).toBeInTheDocument();
    expect(screen.queryByText("Sign in to see this.")).not.toBeInTheDocument();
  });
});
