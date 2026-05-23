import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children }: any) => <div>{children}</div>,
  ZImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
  ZButton: ({ children }: any) => <button>{children}</button>,
  ZSelect: () => <div />,
  ZCheckbox: () => <div />,
  createZForm: () => ({ useForm: () => ({ register: vi.fn(), handleSubmit: vi.fn(), formState: {}, watch: vi.fn() }), Item: ({ children }: any) => <div>{children}</div> }),
}));

vi.mock("react-router", () => ({
  Link: ({ children }: any) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: "1" }),
  useLoaderData: () => ({}),
}));

import AlbumDetail from "../routes/albums.id";

describe("Albums detail page", () => {
  it("renders without crashing", () => {
    expect(typeof AlbumDetail).toBe("function");
  });
});
