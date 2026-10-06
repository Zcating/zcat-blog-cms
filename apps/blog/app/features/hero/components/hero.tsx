import { ZView } from '@zcat/ui';

import type { UserInfo } from '@blog/server/user/schemas';

import { HeroScrollIndicator } from './hero-scroll-indicator';
import { ParticleAvatar } from './particle-avatar';

export interface HeroProps {
  userInfo: UserInfo;
}

export function Hero({ userInfo }: HeroProps) {
  return (
    <ZView className="flex h-[calc(100dvh-3rem-2rem)] flex-col">
      <ZView className="flex flex-1 flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
        <ZView className="flex min-w-0 flex-col justify-center gap-3 lg:flex-1">
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            {userInfo.name}
          </h1>
          <p className="text-muted-foreground text-base md:text-xl">
            {userInfo.occupation}
          </p>
          <p className="text-muted-foreground max-w-[52ch] text-sm leading-relaxed md:text-base">
            {userInfo.abstract}
          </p>
        </ZView>
        <ParticleAvatar
          src={userInfo.signedAvatar}
          className="h-48 w-full shrink-0 sm:h-64 lg:h-full lg:flex-1"
        />
      </ZView>
      <HeroScrollIndicator />
    </ZView>
  );
}
