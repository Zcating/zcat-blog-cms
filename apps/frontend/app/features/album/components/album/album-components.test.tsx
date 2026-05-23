import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  ZButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  ZImagePreload: ({ src, alt, className }: any) => <img src={src} alt={alt} className={className} data-testid="preload" />,
  ZView: ({ children, className }: any) => <div className={className}>{children}</div>,
  ZImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));
vi.mock("@ant-design/icons", () => ({ LoadingOutlined: () => <span /> }));

import { AlbumImageCard } from "./album-image-card";
import { PhotoCard } from "./photo-card";

describe("AlbumImageCard", () => {
  it("renders album name", () => {
    render(<AlbumImageCard data={{ id: 1, name: "Test Album" } as any} onEdit={vi.fn()} onClickItem={vi.fn()} />);
    expect(screen.getByText("Test Album")).toBeInTheDocument();
  });
});

describe("PhotoCard", () => {
  it("renders photo name", () => {
    render(<PhotoCard data={{ id: 1, name: "Photo" } as any} onChange={vi.fn()} />);
    expect(screen.getByText("Photo")).toBeInTheDocument();
  });
});
