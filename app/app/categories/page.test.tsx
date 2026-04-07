import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CategoriesPage from "./page";
import { getSiteText } from "@/lib/site";

const {
  cacheStore,
  getCategoriesMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  cacheStore: new Map<string, unknown>(),
  getCategoriesMock: vi.fn(),
  toastErrorMock: vi.fn(),
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
    getCategories: getCategoriesMock,
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

vi.mock("@/components/providers/site-preferences-provider", () => ({
  useSitePreferences: () => ({
    site: getSiteText("es"),
  }),
}));

vi.mock("@/lib/cache", () => ({
  cacheKeys: {
    categories: "cache:categories",
  },
  cacheTtls: {
    categories: 60_000,
  },
  getCache: (key: string) => cacheStore.get(key) ?? null,
  setCache: (key: string, value: unknown) => {
    cacheStore.set(key, value);
  },
  invalidateCacheKey: (key: string) => {
    cacheStore.delete(key);
  },
  subscribeToCacheKeys: () => () => {},
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: vi.fn(),
  },
}));

vi.mock("./components/create-category-modal", () => ({
  CreateCategoryModal: () => <button type="button">Agregar categoria</button>,
}));

vi.mock("./components/grouped-categories-view", () => ({
  GroupedCategoriesView: ({
    categories,
  }: {
    categories: Array<{ id: string; name: string }>;
  }) => <div>{categories.map((category) => category.name).join(", ")}</div>,
}));

vi.mock("@/components/ui/select", async () => {
  const React = await import("react");
  type ElementProps = {
    children?: React.ReactNode;
    id?: string;
    value?: string;
  };

  function readText(node: React.ReactNode): string {
    if (typeof node === "string" || typeof node === "number") {
      return String(node);
    }
    if (!node || typeof node !== "object") {
      return "";
    }
    if (Array.isArray(node)) {
      return node.map((item) => readText(item)).join("");
    }
    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<ElementProps>;
      return readText(element.props.children);
    }
    return "";
  }

  function collectOptions(children: React.ReactNode) {
    const options: Array<{ value: string; label: string }> = [];
    let triggerId: string | undefined;

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        return;
      }

      const element = child as React.ReactElement<ElementProps>;

      if (element.type === SelectTrigger && element.props.id) {
        triggerId = element.props.id;
      }

      if (element.type === SelectItem) {
        options.push({
          value: element.props.value ?? "",
          label: readText(element.props.children),
        });
      }

      if (element.props.children) {
        const nested = collectOptions(element.props.children);
        if (!triggerId && nested.triggerId) {
          triggerId = nested.triggerId;
        }
        options.push(...nested.options);
      }
    });

    return { options, triggerId };
  }

  function Select({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
  }) {
    const { options, triggerId } = collectOptions(children);

    return (
      <select
        id={triggerId}
        value={value}
        onChange={(event) => onValueChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  function SelectContent({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }

  function SelectItem() {
    return null;
  }

  function SelectTrigger() {
    return null;
  }

  function SelectValue() {
    return null;
  }

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  };
});

describe("CategoriesPage", () => {
  beforeEach(() => {
    cacheStore.clear();
    getCategoriesMock.mockReset();
    toastErrorMock.mockReset();

    getCategoriesMock.mockResolvedValue([
      {
        id: "cat-1",
        name: "Mercado",
        direction: "expense",
        parent_id: null,
      },
    ]);
  });

  afterEach(() => {
    cleanup();
  });

  it("renders clear help for categories and type", async () => {
    render(<CategoriesPage />);

    await waitFor(() => {
      expect(getCategoriesMock).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByRole("heading", { name: "Categorias", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Para que sirven las categorias?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Que significa el tipo?" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Mercado").length).toBeGreaterThan(0);
  });
});
