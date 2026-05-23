import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children }: any) => <div>{children}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  ZButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  ZImagePreload: () => <img alt="" />,
  ZSelect: () => <div />,
  ZCheckbox: () => <div />,
  createZForm: () => ({ useForm: () => ({ register: vi.fn(), handleSubmit: vi.fn(), formState: {}, watch: vi.fn() }), Item: ({ children }: any) => <div>{children}</div> }),
}));

vi.mock("@ant-design/icons", () => ({ LoadingOutlined: () => null }));
vi.mock("react-router", () => ({
  Link: ({ children }: any) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLoaderData: () => ({}),
  useSubmit: () => vi.fn(),
}));

import Albums from "../routes/albums";

describe("Albums list page", () => {
  it("renders without crashing", () => {
    expect(typeof Albums).toBe("function");
  });
});
