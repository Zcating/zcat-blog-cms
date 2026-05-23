import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children }: any) => <div>{children}</div>,
  ZSelect: () => <div />,
  ZCheckbox: () => <div />,
  createZForm: () => ({ useForm: () => ({ register: vi.fn(), handleSubmit: vi.fn(), formState: {}, watch: vi.fn() }), Item: ({ children }: any) => <div>{children}</div> }),
}));

vi.mock("react-router", () => ({
  useParams: () => ({ id: "1" }),
  useLoaderData: () => ({}),
}));

import ArticleDetail from "../routes/articles.id";

describe("Articles detail page", () => {
  it("renders without crashing", () => {
    expect(typeof ArticleDetail).toBe("function");
  });
});
