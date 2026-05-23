import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  ZMarkdown: ({ content }: any) => <div>{content}</div>,
  safeDateString: (d: string, fallback: string) => d || fallback,
}));

import { ArticleViewer } from "./article-viewer";

describe("ArticleViewer", () => {
  it("renders edit button", () => {
    render(<ArticleViewer article={{ id: 1, title: "Test Article" } as any} onEdit={vi.fn()} />);
    expect(screen.getByText("编辑")).toBeInTheDocument();
  });
});
