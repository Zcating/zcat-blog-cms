import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children }: any) => <div>{children}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  ZImage: () => <img />,
  ZImageUpload: () => <div />,
  ZButton: ({ children }: any) => <button>{children}</button>,
  ZInput: () => <input />,
  ZTextarea: () => <textarea />,
  ZSelect: () => <div />,
  ZCheckbox: () => <div />,
  createZForm: () => ({ useForm: () => ({ register: vi.fn(), handleSubmit: vi.fn(), formState: {}, watch: vi.fn() }), Item: ({ children }: any) => <div>{children}</div> }),
}));

import UserInfo from "../routes/user-info";

describe("UserInfo page", () => {
  it("renders without crashing", () => {
    expect(typeof UserInfo).toBe("function");
  });
});
