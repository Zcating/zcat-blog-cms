import { ZView } from "@zcat/ui";
import { Outlet } from "react-router";

import { BlogContent, BlogFooter, BlogHeader } from "@blog/modules";

export default function BlogLayout() {
  return (
    <ZView className="h-full w-full [--header-height:calc(--spacing(20))] [--footer-height:calc(--spacing(10))]">
      <BlogHeader />
      <BlogContent>
        <Outlet />
      </BlogContent>
      <BlogFooter />
    </ZView>
  );
}
