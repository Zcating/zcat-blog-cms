import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children, className }: any) => <div className={className}>{children}</div>,
  ZButton: ({ children }: any) => <button>{children}</button>,
  useMount: (fn: any) => fn(),
}));

vi.mock("lucide-react", () => ({ AlertCircle: () => null, FileQuestion: () => null, Home: () => null, RefreshCcw: () => null }));
vi.mock("react-router", () => ({
  Outlet: () => <div data-testid="outlet" />,
  Links: () => null,
  Meta: () => null,
  Scripts: () => null,
  ScrollRestoration: () => null,
  isRouteErrorResponse: vi.fn(),
  useNavigate: () => vi.fn(),
}));
vi.mock("@blog/apis", () => ({ StatisticsApi: { uploadVisitRecord: vi.fn() } }));

import Root from "../root";

describe("Root Layout", () => {
  it("renders without crashing", () => {
    expect(typeof Root).toBe("function");
  });
});
