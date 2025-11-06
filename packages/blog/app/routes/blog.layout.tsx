import { View } from "@blog/components";
import { BlogContent, BlogFooter, BlogHeader } from "@blog/modules";
import { Outlet } from "react-router";

export default function BlogLayout() {
  return (
    <View className="h-full w-full [--header-height:calc(--spacing(20))] [--footer-height:calc(--spacing(10))]">
      <BlogHeader />
      <BlogContent>
        <Outlet />
      </BlogContent>
      <BlogFooter />
    </View>
  );
}
