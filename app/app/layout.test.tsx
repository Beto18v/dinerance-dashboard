import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AppLayout from "./layout";
import { getSiteText } from "@/lib/site";

const {
  cacheProfileMock,
  clearCachedProfileMock,
  getCachedProfileMock,
  getPreferredSessionNameMock,
  replaceMock,
  resolveAuthenticatedProfileMock,
  signOutMock,
  toastErrorMock,
  useSessionMock,
} = vi.hoisted(() => ({
  cacheProfileMock: vi.fn(),
  clearCachedProfileMock: vi.fn(),
  getCachedProfileMock: vi.fn(),
  getPreferredSessionNameMock: vi.fn(),
  replaceMock: vi.fn(),
  resolveAuthenticatedProfileMock: vi.fn(),
  signOutMock: vi.fn(),
  toastErrorMock: vi.fn(),
  useSessionMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: () => "/app/balance",
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useSession: useSessionMock,
}));

vi.mock("@/components/providers/site-preferences-provider", () => ({
  useSitePreferences: () => ({
    site: getSiteText("es"),
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SheetDescription: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  SheetHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
  },
}));

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
}));

vi.mock("@/lib/profile", () => ({
  cacheProfile: cacheProfileMock,
  clearCachedProfile: clearCachedProfileMock,
  getCachedProfile: getCachedProfileMock,
  getPreferredSessionName: getPreferredSessionNameMock,
  resolveAuthenticatedProfile: resolveAuthenticatedProfileMock,
}));

import { ApiError } from "@/lib/api";

describe("AppLayout", () => {
  beforeEach(() => {
    cacheProfileMock.mockReset();
    clearCachedProfileMock.mockReset();
    getCachedProfileMock.mockReset();
    getPreferredSessionNameMock.mockReset();
    replaceMock.mockReset();
    resolveAuthenticatedProfileMock.mockReset();
    signOutMock.mockReset();
    toastErrorMock.mockReset();
    useSessionMock.mockReset();

    getCachedProfileMock.mockReturnValue(null);
    getPreferredSessionNameMock.mockReturnValue("Test User");
    signOutMock.mockResolvedValue(undefined);
  });

  it("redirects to login when there is no authenticated session", async () => {
    useSessionMock.mockReturnValue({
      session: null,
      loading: false,
      signOut: signOutMock,
    });

    render(
      <AppLayout>
        <div>child</div>
      </AppLayout>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/auth/login");
    });
    expect(clearCachedProfileMock).toHaveBeenCalled();
  });

  it("resolves the authenticated profile only once per session user", async () => {
    const session = {
      user: {
        id: "user-1",
        email: "test@example.com",
        user_metadata: {},
      },
    };
    const profile = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      base_currency: "COP",
      timezone: "America/Bogota",
      created_at: "2026-03-26T12:00:00Z",
    };

    useSessionMock.mockReturnValue({
      session,
      loading: false,
      signOut: signOutMock,
    });
    resolveAuthenticatedProfileMock.mockResolvedValue(profile);

    const { rerender } = render(
      <AppLayout>
        <div>child</div>
      </AppLayout>,
    );

    expect(await screen.findByText("child")).toBeInTheDocument();
    expect(resolveAuthenticatedProfileMock).toHaveBeenCalledTimes(1);
    expect(cacheProfileMock).toHaveBeenCalledWith(profile);

    rerender(
      <AppLayout>
        <div>child</div>
      </AppLayout>,
    );

    await waitFor(() => {
      expect(resolveAuthenticatedProfileMock).toHaveBeenCalledTimes(1);
    });
  });

  it("signs out and redirects when profile resolution fails with 401", async () => {
    useSessionMock.mockReturnValue({
      session: {
        user: {
          id: "user-1",
          email: "test@example.com",
          user_metadata: {},
        },
      },
      loading: false,
      signOut: signOutMock,
    });
    resolveAuthenticatedProfileMock.mockRejectedValue(
      new ApiError(401, "Expired session"),
    );

    render(
      <AppLayout>
        <div>child</div>
      </AppLayout>,
    );

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
    });
    expect(toastErrorMock).toHaveBeenCalledWith("Expired session");
    expect(replaceMock).toHaveBeenCalledWith("/auth/login");
    expect(clearCachedProfileMock).toHaveBeenCalled();
  });
});
