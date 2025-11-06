import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";
export default [
  layout("routes/blog.layout.tsx", [
    index("routes/home.tsx"),
    route("post-board", "routes/post-board.tsx"),
    route("post-board/:id", "routes/post-board.id.tsx"),
    route("about", "routes/about.tsx"),
    route("gallery", "routes/gallery.tsx"),
  ]),
  layout("routes/toolbox/toolbox.layout.tsx", [
    route("toolbox", "routes/toolbox/home.page.tsx"),
    route("toolbox/base64-to-image", "routes/toolbox/base64-to-image.page.tsx"),
  ]),
  route("gallery/:id", "routes/gallery.id.tsx"),
] satisfies RouteConfig;
