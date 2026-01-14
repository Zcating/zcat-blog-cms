import {
  IconGithub,
  IconPhoto,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  ZButton,
  ZCascader,
  ZInput,
} from '@zcat/ui';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export default function Home() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="#">
                      <IconPhoto size="sm" />
                      <span>Components</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="https://github.com/your-repo">
                      <IconGithub size="sm" />
                      <span>GitHub</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-medium">zcat-blog-cms</div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              zcat-ui 组件展示
            </h1>
            <p className="text-muted-foreground">
              这里展示了 zcat-ui 库中的常用组件。
            </p>
            <div className="flex flex-col gap-4 max-w-md">
              <ZButton variant="outline" aria-label="Submit">
                test
              </ZButton>
              <ZInput placeholder="Input something..." />
              <ZCascader />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
