import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children, className }: any) => <div className={className}>{children}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  ZButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  ZImagePreload: () => <img alt="" data-testid="preload" />,
  Separator: () => <hr />,
  SidebarTrigger: () => <button data-testid="sidebar-trigger" />,
  ZSidebar: ({ children, header, options, renderItem, currentValue, isActive, sidebarFooter }: any) => (
    <div>
      {header}
      {options.map((o: any, i: number) => renderItem(o, i))}
      {sidebarFooter}
      <div>{children}</div>
    </div>
  ),
  ZStickyHeader: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("lucide-react", () => ({
  Gauge: () => null, NotebookIcon: () => null, BookImageIcon: () => null,
  ImageIcon: () => null, UserIcon: () => null, SettingsIcon: () => null,
}));

vi.mock("react-router", () => ({
  Link: ({ to, children, className }: any) => <a href={to} className={className}>{children}</a>,
  Outlet: () => <div data-testid="outlet" />,
  useNavigate: () => vi.fn(),
  useRouteError: () => null,
  isRouteErrorResponse: vi.fn(),
  useLocation: () => ({ pathname: "/dashboard" }),
}));

import CMSLayout from "./cms-layout";

describe("CMSLayout", () => {
  it("renders sidebar and outlet", () => {
    render(<CMSLayout />);
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });
});
