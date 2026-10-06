import { ZAvatar } from '@zcat/ui';

const RENDERABLE_SRC_PATTERN = /^(?:https?:|blob:|data:)/i;

export function resolveImageSrc(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined;
  return RENDERABLE_SRC_PATTERN.test(value) ? value : undefined;
}

interface CmsAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CmsAvatar(props: CmsAvatarProps) {
  const { src, name, size, className } = props;
  const initial = name.trim().slice(0, 1);

  return (
    <ZAvatar
      src={resolveImageSrc(src)}
      alt={name}
      size={size}
      className={className}
      fallback={<span className="text-sm font-medium">{initial || '?'}</span>}
    />
  );
}
