import { BlogContent, BlogFooter, BlogHeader } from "@blog/modules";
import React from "react";
import { Outlet } from "react-router";

export default function BlogLayout() {
  return (
    <React.Fragment>
      <BlogHeader />
      <BlogContent>
        <Outlet />
      </BlogContent>
      <BlogFooter />
    </React.Fragment>
  );
}
