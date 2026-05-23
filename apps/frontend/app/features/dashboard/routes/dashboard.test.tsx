import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children }: any) => <div>{children}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  ZButton: ({ children }: any) => <button>{children}</button>,
}));

vi.mock("@ant-design/icons", () => ({ LoadingOutlined: () => null }));

import Dashboard from "../routes/dashboard";

describe("Dashboard page", () => {
  it("renders without crashing", () => {
    expect(typeof Dashboard).toBe("function");
  });
});
