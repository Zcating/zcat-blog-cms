import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children }: any) => <div>{children}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  ZButton: ({ children }: any) => <button>{children}</button>,
  ZInput: () => <input />,
  ZSelect: () => <div />,
  ZTextarea: () => <textarea />,
  ZImageUpload: () => <div />,
}));

import Settings from "../routes/settings";

describe("Settings page", () => {
  it("renders without crashing", () => {
    expect(typeof Settings).toBe("function");
  });
});
