import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  IconContainer,
  IconGithub,
  StaggerReveal,
  ZAvatar,
  ZView,
} from '@zcat/ui';
import { Mail } from 'lucide-react';

import { UserApi } from '@blog/apis';

import type { Route } from './+types/about';

export function meta() {
  return [{ title: '关于' }, { name: 'description', content: '个人技术博客' }];
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
    <StaggerReveal
      selector='[data-about-card="true"]'
      className="w-full h-full flex flex-col items-center gap-10"
      direction="top"
    >
      <Card data-about-card="true" className="w-2xl">
        <CardHeader className="flex justify-center">
          <ZAvatar
            alt={userInfo.name}
            src={userInfo.avatar}
            fallback={userInfo.name}
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-4 items-center">
          <p className="text-5xl font-bold">{userInfo.name}</p>
          <p className="text-lg">{userInfo.occupation}</p>
          <p className="text-sm break-all">{userInfo.abstract}</p>
          <p className="text-sm">欢迎来到我的博客！</p>
        </CardContent>
      </Card>
      <Card data-about-card="true" className="w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">关于我</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 items-center">
          <p className="text-sm">{userInfo.aboutMe}</p>
        </CardContent>
      </Card>
      <Card data-about-card="true" className="w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">联系我</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          很高兴能与你交流！你可以通过以下方式找到我：
          <ZView className="flex flex-col gap-4">
            <ContactItem
              icon={<IconContainer Renderer={Mail} size="lg" />}
              text={userInfo.contact.email}
              prefix="mailto"
            />
            <ContactItem
              icon={<IconContainer Renderer={IconGithub} size="lg" />}
              text={userInfo.contact.github}
            />
          </ZView>
        </CardContent>
      </Card>
    </StaggerReveal>
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
