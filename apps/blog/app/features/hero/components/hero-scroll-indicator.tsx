import { ZView } from '@zcat/ui';

export function HeroScrollIndicator() {
  return (
    <ZView
      aria-hidden="true"
      className="flex shrink-0 flex-col items-center gap-2 pt-4"
    >
      <svg
        width="2"
        height="44"
        viewBox="0 0 2 44"
        fill="none"
        className="overflow-visible text-muted-foreground/60"
      >
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="44"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="3 5"
          className="motion-safe:animate-hero-dash"
        />
        <circle
          cx="1"
          cy="0"
          r="2"
          fill="currentColor"
          className="text-foreground motion-safe:animate-hero-marker"
        />
      </svg>
      <span className="text-muted-foreground text-[10px] font-medium tracking-[0.35em]">
        SCROLL
      </span>
    </ZView>
  );
}
