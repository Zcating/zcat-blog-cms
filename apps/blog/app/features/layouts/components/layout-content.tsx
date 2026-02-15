import { ZView } from '@zcat/ui';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <ZView className="min-h-content-height py-4 relative bg-background">
      {children}
    </ZView>
  );
}
