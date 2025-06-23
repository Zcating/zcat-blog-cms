import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/guest-home.tsx"),
  layout("routes/cms-layout.tsx", [
    route("home", "routes/home.tsx"),
  ])
] satisfies RouteConfig;
