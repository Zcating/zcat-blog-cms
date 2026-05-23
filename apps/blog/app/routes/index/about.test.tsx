import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@zcat/ui", () => ({
  ZView: ({ children, className }: any) => <div className={className}>{children}</div>,
  StaggerReveal: ({ children, className }: any) => <div className={className}>{children}</div>,
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  ZAvatar: ({ alt }: any) => <div>{alt}</div>,
  IconContainer: ({ Renderer }: any) => <span data-testid="icon" />,
  IconGithub: () => <span />,
}));

vi.mock("lucide-react", () => ({ Mail: () => <span /> }));
vi.mock("@blog/apis", () => ({ UserApi: { getUserInfo: vi.fn() } }));

import AboutPage from "./about";

describe("AboutPage", () => {
  it("renders user name and welcome text", () => {
    render(
      <AboutPage
        loaderData={{
          userInfo: {
            name: "zcat",
            occupation: "Dev",
            abstract: "Hello world",
            aboutMe: "About me text",
            contact: { email: "a@b.com", github: "https://github.com/zcat" },
            avatar: "/ava.jpg",
          },
        }}
      />
    );
    expect(screen.getByText("欢迎来到我的博客！")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.getByText("a@b.com")).toBeInTheDocument();
  });
});
