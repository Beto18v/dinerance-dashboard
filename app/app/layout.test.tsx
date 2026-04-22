import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AppLayout from "./layout";
import { getSiteText } from "@/lib/site";

const {
  cacheProfileMock,
  clearCachedProfileMock,
  getCachedProfileMock,
  getUpcomingObligationsMock,
  getPreferredSessionNameMock,
  replaceMock,
  resolveAuthenticatedProfileMock,
  setThemeMock,
  signOutMock,
  toastErrorMock,
  useSessionMock,
} = vi.hoisted(() => ({
  cacheProfileMock: vi.fn(),
  clearCachedProfileMock: vi.fn(),
  getCachedProfileMock: vi.fn(),
  getUpcomingObligationsMock: vi.fn(),
  getPreferredSessionNameMock: vi.fn(),
  replaceMock: vi.fn(),
  resolveAuthenticatedProfileMock: vi.fn(),
  setThemeMock: vi.fn(),
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

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: setThemeMock,
  }),
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AvatarImage: ({ alt, src }: { alt?: string; src?: string }) => (
    <div aria-label={alt ?? ""} data-src={src} />
  ),
  AvatarFallback: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => <div />,
  DropdownMenuSub: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuSubContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuSubTrigger: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuRadioGroup: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuRadioItem: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
  ),
  DropdownMenuItem: ({
    asChild,
    children,
    onSelect,
    ...props
  }: {
    asChild?: boolean;
    children: ReactNode;
    onSelect?: () => void;
  }) =>
    asChild ? (
      <div {...props}>{children}</div>
    ) : (
      <button type="button" onClick={onSelect} {...props}>
        {children}
      </button>
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
  SheetFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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
  api: {
    getUpcomingObligations: getUpcomingObligationsMock,
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
    window.localStorage.clear();
    cacheProfileMock.mockReset();
    clearCachedProfileMock.mockReset();
    getCachedProfileMock.mockReset();
    getUpcomingObligationsMock.mockReset();
    getPreferredSessionNameMock.mockReset();
    replaceMock.mockReset();
    resolveAuthenticatedProfileMock.mockReset();
    setThemeMock.mockReset();
    signOutMock.mockReset();
    toastErrorMock.mockReset();
    useSessionMock.mockReset();

    getCachedProfileMock.mockReturnValue(null);
    getUpcomingObligationsMock.mockResolvedValue({
      reference_date: "2026-04-07",
      window_end_date: "2026-04-14",
      summary: {
        currency: "COP",
        total_active: 3,
        items_in_window: 3,
        overdue_count: 0,
        due_today_count: 0,
        due_soon_count: 0,
        expected_account_risk_count: 0,
        total_expected_amount: "0.00",
      },
      items: [],
    });
    getPreferredSessionNameMock.mockReturnValue("Test User");
    signOutMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    window.localStorage.clear();
    cleanup();
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
    await waitFor(() => {
      expect(getUpcomingObligationsMock).toHaveBeenCalledWith({
        days_ahead: 7,
        limit: 1,
      });
    });

    rerender(
      <AppLayout>
        <div>child</div>
      </AppLayout>,
    );

    await waitFor(() => {
      expect(resolveAuthenticatedProfileMock).toHaveBeenCalledTimes(1);
    });
  });

  it("shows an obligations badge and banner when there are urgent obligations", async () => {
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
    resolveAuthenticatedProfileMock.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      base_currency: "COP",
      timezone: "America/Bogota",
      created_at: "2026-03-26T12:00:00Z",
    });
    getUpcomingObligationsMock.mockResolvedValue({
      reference_date: "2026-04-07",
      window_end_date: "2026-04-14",
      summary: {
        currency: "COP",
        total_active: 4,
        items_in_window: 4,
        overdue_count: 1,
        due_today_count: 1,
        due_soon_count: 2,
        expected_account_risk_count: 0,
        total_expected_amount: "0.00",
      },
      items: [],
    });

    render(
      <AppLayout>
        <div>child</div>
      </AppLayout>,
    );

    expect(
      await screen.findByText(
        "Tienes 1 obligacion vencida activa y 1 que vence hoy.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Abrir obligaciones").length).toBeGreaterThan(0);
  });

  it("offers a quick sign out action from the user menu", async () => {
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
    resolveAuthenticatedProfileMock.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      base_currency: "COP",
      timezone: "America/Bogota",
      created_at: "2026-03-26T12:00:00Z",
    });

    render(
      <AppLayout>
        <div>child</div>
      </AppLayout>,
    );

    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Cerrar sesion" }))[0],
    );

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
    });
    expect(replaceMock).toHaveBeenCalledWith("/auth/login");
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
