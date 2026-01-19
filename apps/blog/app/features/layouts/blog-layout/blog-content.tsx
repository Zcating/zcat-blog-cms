import { ZView } from '@zcat/ui';

export function BlogContent({ children }: { children: React.ReactNode }) {
  return (
    <ZView className="min-h-siderbar-content pb-3 mt-4 relative">
      {children}
    </ZView>
  );
}
