import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children, className }: any) => <div className={className}>{children}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  Button: ({ children }: any) => <button>{children}</button>,
  ZGrid: ({ children }: any) => <div>{children}</div>,
  Skeleton: () => <div />,
  StaggerReveal: ({ children, className }: any) => <div className={className}>{children}</div>,
  ZWaterfall: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@blog/apis", () => ({ GalleryApi: { getGalleries: vi.fn() } }));

import GalleryPage from "./gallery";

describe("GalleryPage", () => {
  it("renders without crashing", () => {
    expect(typeof GalleryPage).toBe("function");
  });
});
