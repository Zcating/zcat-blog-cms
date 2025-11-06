import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  IconEnvelope,
  IconGithub,
  ZAvatar,
} from "@blog/components";
import type { Route } from "./+types/about";
import { UserApi } from "@blog/apis";

export function meta() {
  return [{ title: "关于" }, { name: "description", content: "个人技术博客" }];
}

export async function loader() {
  const userInfo = await UserApi.getUserInfo();
  return {
    userInfo: userInfo,
  };
}

export default function AboutPage(props: Route.ComponentProps) {
  const userInfo = props.loaderData.userInfo;
  return (
    <div className="w-full h-full flex flex-col items-center gap-10">
      <Card className="w-2xl">
        <CardHeader className="flex justify-center">
          <ZAvatar src={userInfo.avatar} fallback={userInfo.name} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4 items-center">
          <p className="text-5xl font-bold">{userInfo.name}</p>
          <p className="text-lg">{userInfo.occupation}</p>
          <p className="text-sm break-all">{userInfo.abstract}</p>
          <p className="text-sm">欢迎来到我的博客！</p>
        </CardContent>
      </Card>
      <Card className="w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">关于我</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 items-center">
          <p className="text-sm">{userInfo.aboutMe}</p>
        </CardContent>
      </Card>
      <Card className="w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">联系我</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          很高兴能与你交流！你可以通过以下方式找到我：
          <div className="flex flex-col gap-4">
            <ContactItem
              icon={<IconEnvelope size="lg" />}
              text={userInfo.contact.email}
              prefix="mailto"
            />
            <ContactItem
              icon={<IconGithub size="lg" />}
              text={userInfo.contact.github}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ContactItemProps {
  icon: React.ReactNode;
  text: string;
  prefix?: string;
}

function ContactItem({ icon, text, prefix }: ContactItemProps) {
  const href = prefix ? `${prefix}:${text}` : text;
  return (
    <a href={href} className="flex items-center gap-3">
      {icon}
      <p className="text-sm">{text}</p>
    </a>
  );
}
