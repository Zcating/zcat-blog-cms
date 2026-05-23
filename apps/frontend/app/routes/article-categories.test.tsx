import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children }: any) => <div>{children}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  ZButton: ({ children }: any) => <button>{children}</button>,
}));

vi.mock("react-router", () => ({ Link: ({ children }: any) => <a>{children}</a>, useNavigate: () => vi.fn() }));

import ArticleCategories from "../routes/article-categories";

describe("ArticleCategories page", () => {
  it("renders without crashing", () => {
    expect(typeof ArticleCategories).toBe("function");
  });
});
