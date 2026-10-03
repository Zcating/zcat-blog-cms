import { ZView, cn, useClient, useScreenSize } from '@zcat/ui';
import React from 'react';

const LOGO_SRC = '/codeman-logo-dark.svg';
const DESKTOP_PARTICLE_COUNT = 12000;
const MOBILE_PARTICLE_COUNT = 6000;

const MASK_SIZE = 512;
const MASK_ALPHA_THRESHOLD = 128;
const FIT_INSET = 0.94;
const CONVERGE_DURATION = 1800;
const PARTICLE_SIZE = 1.6;
const BREATH_AMPLITUDE = 1.6;
const MOUSE_RADIUS = 140;
const MOUSE_PULL = 9;
const RESIZE_DEBOUNCE = 150;
const MAX_PIXEL_RATIO = 2;

interface Particle {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  dirX: number;
  dirY: number;
  phase: number;
  weight: number;
}

interface LogoMask {
  points: number[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// The ink box in panel pixels. The wordmark only fills a band across the middle
// of the square viewBox, so it is the ink that has to be fitted to the panel,
// and mask points are mapped relative to the ink, not to the square.
interface LogoFit {
  left: number;
  top: number;
  scale: number;
  minX: number;
  minY: number;
}

const EMPTY_FIT: LogoFit = {
  left: 0,
  top: 0,
  scale: 0,
  minX: 0,
  minY: 0,
};

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function loadLogo() {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('hero logo failed to load'));
    image.src = LOGO_SRC;
  });
}

function readForegroundColor() {
  const probe = document.createElement('span');
  probe.style.color = 'var(--foreground)';
  document.body.appendChild(probe);
  const color = window.getComputedStyle(probe).color;
  probe.remove();
  return color;
}

// Rasterised once at a fixed square resolution, reporting the ink bounds
// alongside the hit list.
function sampleLogoMask(image: HTMLImageElement): LogoMask {
  const canvas = document.createElement('canvas');
  canvas.width = MASK_SIZE;
  canvas.height = MASK_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return { points: [], minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  context.drawImage(image, 0, 0, MASK_SIZE, MASK_SIZE);
  const { data } = context.getImageData(0, 0, MASK_SIZE, MASK_SIZE);
  const points: number[] = [];
  let minX = MASK_SIZE;
  let minY = MASK_SIZE;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < MASK_SIZE; y += 1) {
    for (let x = 0; x < MASK_SIZE; x += 1) {
      if (data[(y * MASK_SIZE + x) * 4 + 3] >= MASK_ALPHA_THRESHOLD) {
        points.push(x / MASK_SIZE, y / MASK_SIZE);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    return { points: [], minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  return {
    points,
    minX: minX / MASK_SIZE,
    minY: minY / MASK_SIZE,
    maxX: maxX / MASK_SIZE,
    maxY: maxY / MASK_SIZE,
  };
}

// Contain the ink inside the panel with the ink's own aspect, then centre it.
// The returned scale maps ink-relative mask coordinates to panel pixels, so the
// ink box ends up exactly boxWidth by boxHeight with its aspect untouched.
function fitInk(mask: LogoMask, width: number, height: number): LogoFit {
  const inkWidth = mask.maxX - mask.minX;
  const inkHeight = mask.maxY - mask.minY;
  const aspect = inkWidth / inkHeight;
  if (!Number.isFinite(aspect) || aspect <= 0) {
    return EMPTY_FIT;
  }
  const availableWidth = width * FIT_INSET;
  const availableHeight = height * FIT_INSET;
  const boxWidth =
    availableWidth / availableHeight > aspect
      ? availableHeight * aspect
      : availableWidth;
  const boxHeight = boxWidth / aspect;
  return {
    left: (width - boxWidth) / 2,
    top: (height - boxHeight) / 2,
    scale: boxWidth / inkWidth,
    minX: mask.minX,
    minY: mask.minY,
  };
}

export interface ParticleLogoProps {
  className?: string;
}

export function ParticleLogo({ className }: ParticleLogoProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const countRef = React.useRef(DESKTOP_PARTICLE_COUNT);
  const startedAtRef = React.useRef(0);
  const engineRef = React.useRef<{ rebuild: () => void } | null>(null);
  const isClient = useClient();
  const screenSize = useScreenSize();
  const isSmall = screenSize === 'xs' || screenSize === 'sm';
  const particleCount = isSmall
    ? MOBILE_PARTICLE_COUNT
    : DESKTOP_PARTICLE_COUNT;

  countRef.current = particleCount;

  React.useEffect(() => {
    if (!isClient) {
      return;
    }
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) {
      return;
    }
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let frame = 0;
    let resizeTimer = 0;
    let disposed = false;
    let width = 0;
    let height = 0;
    let fit: LogoFit = EMPTY_FIT;
    let particles: Particle[] = [];
    let mask: LogoMask = { points: [], minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let pointerX = 0;
    let pointerY = 0;
    let pointerInside = false;

    const color = readForegroundColor();

    const measure = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      fit = fitInk(mask, width, height);
    };

    const build = () => {
      const hitCount = mask.points.length / 2;
      const wanted = Math.min(countRef.current, hitCount);
      const next: Particle[] = [];
      particles = next;
      if (wanted === 0) {
        return;
      }
      // A systematic sample: every stride-th hit, walking the whole hit list so
      // the wordmark is covered edge to edge. The stride stays fractional on
      // purpose: rounding it down to an integer collapses it to 1 whenever the
      // count is only slightly below the hit total, and paints just the first
      // rows of the wordmark.
      const stride = hitCount / wanted;
      const centreX = width / 2;
      const centreY = height / 2;
      for (let i = 0; i < wanted; i += 1) {
        const index = Math.floor(i * stride) * 2;
        const toX = fit.left + (mask.points[index]! - fit.minX) * fit.scale;
        const toY = fit.top + (mask.points[index + 1]! - fit.minY) * fit.scale;
        const dx = toX - centreX;
        const dy = toY - centreY;
        const length = Math.hypot(dx, dy) || 1;
        next.push({
          fromX: Math.random() * width,
          fromY: Math.random() * height,
          toX,
          toY,
          dirX: dx / length,
          dirY: dy / length,
          phase: Math.random() * Math.PI * 2,
          weight: 0.4 + Math.random() * 0.6,
        });
      }
    };

    const draw = (now: number) => {
      if (disposed) {
        return;
      }
      if (!startedAtRef.current) {
        startedAtRef.current = now;
      }
      const elapsed = reducedMotion
        ? CONVERGE_DURATION
        : now - startedAtRef.current;
      const eased = easeOutCubic(Math.min(1, elapsed / CONVERGE_DURATION));
      const seconds = now / 1000;

      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      const half = PARTICLE_SIZE / 2;

      for (const particle of particles) {
        const breath = reducedMotion
          ? 0
          : Math.sin(seconds * 0.9 + particle.phase) *
            BREATH_AMPLITUDE *
            particle.weight;
        let x =
          particle.fromX +
          (particle.toX - particle.fromX) * eased +
          particle.dirX * breath;
        let y =
          particle.fromY +
          (particle.toY - particle.fromY) * eased +
          particle.dirY * breath;

        if (pointerInside && !reducedMotion) {
          const dx = pointerX - x;
          const dy = pointerY - y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0.5 && distance < MOUSE_RADIUS) {
            const force = (1 - distance / MOUSE_RADIUS) ** 2 * MOUSE_PULL;
            x += (dx / distance) * force;
            y += (dy / distance) * force;
          }
        }

        context.fillRect(x - half, y - half, PARTICLE_SIZE, PARTICLE_SIZE);
      }

      if (reducedMotion || frame) {
        return;
      }
      frame = requestAnimationFrame((time) => {
        frame = 0;
        draw(time);
      });
    };

    const rebuild = () => {
      measure();
      build();
      draw(performance.now());
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      pointerInside = true;
    };

    const onPointerLeave = () => {
      pointerInside = false;
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, RESIZE_DEBOUNCE);
    };

    // The panel is still settling when the logo resolves, and it changes shape
    // again when the layout reflows, so its box is observed rather than read
    // once: a stale measurement squashes the wordmark into the wrong aspect and
    // strands it in the top of a taller canvas.
    const observer = new ResizeObserver(onResize);
    observer.observe(host);

    measure();
    engineRef.current = { rebuild };
    loadLogo()
      .then((image) => {
        if (disposed) {
          return;
        }
        mask = sampleLogoMask(image);
        rebuild();
      })
      .catch(() => undefined);

    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerleave', onPointerLeave);

    return () => {
      disposed = true;
      engineRef.current = null;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [isClient]);

  React.useEffect(() => {
    engineRef.current?.rebuild();
  }, [particleCount]);

  return (
    <ZView
      ref={hostRef}
      aria-hidden="true"
      className={cn('relative overflow-hidden', className)}
    >
      {isClient && <canvas ref={canvasRef} className="block size-full" />}
    </ZView>
  );
}
