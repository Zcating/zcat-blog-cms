import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children }: any) => <div>{children}</div>,
  ZButton: ({ children }: any) => <button>{children}</button>,
  ZInput: () => <input />,
  ZTextarea: () => <textarea />,
  ZDatePicker: () => <input />,
  createZForm: () => ({ useForm: () => ({}) }),
}));

import ArticleEdit from "../routes/articles.edit";

describe("Articles edit page", () => {
  it("renders without crashing", () => {
    expect(typeof ArticleEdit).toBe("function");
  });
});
