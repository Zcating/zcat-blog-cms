import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("react-router", () => ({ useNavigate: () => vi.fn(), Link: ({ children }: any) => <a>{children}</a> }));
vi.mock("@blog/apis", () => ({ GalleryApi: { getGalleryDetail: vi.fn() } }));

import GalleryDetailPage from "./gallery.id";

describe("GalleryDetailPage", () => {
  it("renders without crashing", () => {
    expect(typeof GalleryDetailPage).toBe("function");
  });
});
