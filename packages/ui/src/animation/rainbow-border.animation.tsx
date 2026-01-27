import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import * as React from 'react';

const RAINBOW_COLORS = [
  '#FF0000',
  '#FF7F00',
  '#FFFF00',
  '#00FF00',
  '#0000FF',
  '#4B0082',
  '#9400D3',
];

interface RainbowBorderProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  duration?: number;
  strokeWidth?: number;
}

export function RainbowBorder({
  children,
  className,
  colors = RAINBOW_COLORS,
  duration = 2,
  strokeWidth = 3,
}: RainbowBorderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const gradientRef = React.useRef<SVGLinearGradientElement>(null);
  const particlesRef = React.useRef<SVGElement[]>([]);
  const [isVisible, setIsVisible] = React.useState(true);

  useGSAP(
    () => {
      if (
        !containerRef.current ||
        !svgRef.current ||
        !pathRef.current ||
        !isVisible
      )
        return;

      const container = containerRef.current;
      const svg = svgRef.current;
      const path = pathRef.current;

      const updatePath = () => {
        const rect = container.getBoundingClientRect();
        const radius = 8;
        const width = rect.width;
        const height = rect.height;

        const d = `M ${radius},0 L ${width - radius},0 
                 Q ${width},0 ${width},${radius} 
                 L ${width},${height - radius} 
                 Q ${width},${height} ${width - radius},${height} 
                 L ${radius},${height} 
                 Q 0,${height} 0,${height - radius} 
                 L 0,${radius} 
                 Q 0,0 ${radius},0 Z`;

        path.setAttribute('d', d);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      };

      updatePath();

      const resizeObserver = new ResizeObserver(() => {
        updatePath();
      });
      resizeObserver.observe(container);

      const pathLength = path.getTotalLength();
      path.style.strokeDasharray = `${pathLength}`;
      path.style.strokeDashoffset = `${pathLength}`;

      const particleCount = 8;
      const particles: SVGElement[] = [];

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'circle',
        );
        particle.setAttribute('r', String(strokeWidth / 2));
        particle.setAttribute('fill', colors[i % colors.length]);
        particle.style.opacity = '0';
        svg.appendChild(particle);
        particles.push(particle);
      }

      particlesRef.current = particles;

      const timeline = gsap.timeline({ repeat: -1 });

      particles.forEach((particle, index) => {
        const delay = (index / particleCount) * duration;

        gsap.set(particle, {
          attr: { cx: 0, cy: 0 },
        });

        gsap.to(particle, {
          opacity: 1,
          duration: 0.1,
          repeat: -1,
          repeatDelay: duration - 0.1,
          yoyo: true,
          delay: delay,
        });

        gsap.to(particle, {
          motionPath: {
            path: path,
            align: path,
            alignOrigin: [0.5, 0.5],
            start: index / particleCount,
            end: (index + 1) / particleCount,
          },
          duration: duration,
          repeat: -1,
          ease: 'none',
          delay: delay,
        });

        gsap.to(particle, {
          opacity: 0,
          duration: 0.1,
          repeat: -1,
          repeatDelay: duration - 0.1,
          yoyo: true,
        });
      });

      gsap.to(path, {
        strokeDashoffset: 0,
        duration: duration * 2,
        repeat: -1,
        ease: 'none',
      });

      const gradientTimeline = gsap.timeline({ repeat: -1 });
      gradientTimeline.to(gradientRef.current, {
        attr: { x1: '100%', y1: '0%', x2: '0%', y2: '0%' },
        duration: duration * 2,
        ease: 'none',
      });

      return () => {
        resizeObserver.disconnect();
        timeline.kill();
        gradientTimeline.kill();
        particles.forEach((p) => p.remove());
      };
    },
    { scope: containerRef, dependencies: [isVisible] },
  );

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0 },
    );

    const container = containerRef.current;
    if (container) {
      observer.observe(container);
    }

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient
            ref={gradientRef}
            id="rainbow-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            {colors.map((color, index) => (
              <stop
                key={index}
                offset={`${(index / (colors.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
        </defs>
        <path
          ref={pathRef}
          fill="none"
          stroke="url(#rainbow-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
