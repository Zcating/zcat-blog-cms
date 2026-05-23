import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children, className }: any) => <div className={className}>{children}</div>,
  StaggerReveal: ({ children, className }: any) => <div className={className}>{children}</div>,
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  ZAvatar: ({ alt }: any) => <div>{alt}</div>,
  ZPagination: () => <div data-testid="pagination" />,
  ZSelect: () => <div data-testid="select" />,
  Calendar: () => <div data-testid="calendar" />,
  RainbowBorder: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("lucide-react", () => ({}));
vi.mock("react-router", () => ({
  Link: ({ to, children, className }: any) => <a href={to} className={className}>{children}</a>,
  useNavigate: () => vi.fn(),
  createSearchParams: (p: any) => new URLSearchParams(p),
}));
vi.mock("@blog/apis", () => ({ ArticleApi: { getArticleList: vi.fn() }, UserApi: { getUserInfo: vi.fn() } }));
vi.mock("@blog/common", () => ({ safePositiveNumber: (v: any, d: any) => typeof v === "number" && v > 0 ? v : d }));
vi.mock("@blog/features", () => ({ PostExcerptCard: ({ value }: any) => <div>{value.title}</div> }));

import HomePage from "./home.page";

describe("HomePage", () => {
  it("renders posts and welcome text", () => {
    render(
      <HomePage
        loaderData={{
          userInfo: { name: "zcat", avatar: "/ava.jpg" },
          pagination: { data: [{ id: "1", title: "Post 1" }], totalPages: 1, page: 1, pageSize: 10 },
        }}
        actionData={undefined}
      />
    );
    expect(screen.getByText("噢！你来了！")).toBeInTheDocument();
    expect(screen.getByText("Post 1")).toBeInTheDocument();
  });
});
