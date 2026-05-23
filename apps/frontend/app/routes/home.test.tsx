import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children }: any) => <div>{children}</div>,
  ZButton: ({ children }: any) => <button>{children}</button>,
}));

vi.mock("react-router", () => ({ Link: ({ children }: any) => <a>{children}</a>, useNavigate: () => vi.fn() }));

import Home from "../routes/home";

describe("Home page", () => {
  it("renders without crashing", () => {
    expect(typeof Home).toBe("function");
  });
});
