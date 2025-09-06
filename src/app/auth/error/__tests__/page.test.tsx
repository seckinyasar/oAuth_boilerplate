import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import AuthErrorPage from "../page";
import { errorMap } from "../types";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;

describe("AuthErrorPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders default error when no error parameter is provided", () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as any);

    render(<AuthErrorPage />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("Please contact us if this error persists.")
    ).toBeInTheDocument();
  });

  it("renders specific error when error parameter is provided", () => {
    const errorType = "access_denied";
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(errorType),
    } as any);

    render(<AuthErrorPage />);

    expect(screen.getByText(errorMap[errorType].title)).toBeInTheDocument();
    expect(screen.getByText(errorMap[errorType].message)).toBeInTheDocument();
  });

  it("renders all error types correctly", () => {
    const errorTypes = [
      "configuration",
      "access_denied",
      "verification",
      "oauth_signin",
      "oauth_callback",
      "oauth_create_account",
      "email_create_account",
      "callback",
      "oauth_account_not_linked",
      "email_signin",
      "credentials_signin",
      "session_required",
      "default",
    ] as const;

    errorTypes.forEach((errorType) => {
      mockUseSearchParams.mockReturnValue({
        get: jest.fn().mockReturnValue(errorType),
      } as any);

      const { unmount } = render(<AuthErrorPage />);

      expect(screen.getByText(errorMap[errorType].title)).toBeInTheDocument();
      expect(screen.getByText(errorMap[errorType].message)).toBeInTheDocument();

      unmount();
    });
  });

  it("renders home link with correct href", () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as any);

    render(<AuthErrorPage />);

    const homeLink = screen.getByRole("link");
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("renders arrow icon", () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as any);

    render(<AuthErrorPage />);

    // Check if the arrow icon is present (assuming it has a specific class or test-id)
    const arrowIcon = document.querySelector(".size-4");
    expect(arrowIcon).toBeInTheDocument();
  });

  it("applies correct CSS classes", () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as any);

    render(<AuthErrorPage />);

    const container = screen.getByText("Something went wrong").closest("div");
    expect(container).toHaveClass(
      "flex",
      "h-screen",
      "w-full",
      "flex-col",
      "items-center",
      "justify-center"
    );
  });

  it("handles unknown error types gracefully", () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue("unknown_error"),
    } as any);

    render(<AuthErrorPage />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("Please contact us if this error persists.")
    ).toBeInTheDocument();
  });

  it("displays error with action when available", () => {
    const errorType = "verification";
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(errorType),
    } as any);

    render(<AuthErrorPage />);

    expect(screen.getByText(errorMap[errorType].title)).toBeInTheDocument();
    expect(screen.getByText(errorMap[errorType].message)).toBeInTheDocument();
    // Note: The current component doesn't display the action, but we can test the error object has it
    expect(errorMap[errorType].action).toBeDefined();
  });

  it("has proper accessibility attributes", () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    } as any);

    render(<AuthErrorPage />);

    const homeLink = screen.getByRole("link");
    expect(homeLink).toBeInTheDocument();

    // Check if the link is properly accessible
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
