import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children }: any) => <div>{children}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  ZButton: ({ children }: any) => <button>{children}</button>,
  ZTable: () => <div />,
  ZPagination: () => <div />,
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock("react-router", () => ({
  Link: ({ children }: any) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLoaderData: () => ({}),
  useSubmit: () => vi.fn(),
  createSearchParams: (p: any) => new URLSearchParams(p),
}));

import ArticlesList from "../routes/articles";

describe("Articles list page", () => {
  it("renders without crashing", () => {
    expect(typeof ArticlesList).toBe("function");
  });
});
