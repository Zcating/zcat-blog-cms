import { ZView, cn, useClient, useScreenSize } from '@zcat/ui';
import React from 'react';
import { ParticleAvatarDebugPanel } from './particle-avatar-debug-panel';

const DESKTOP_PARTICLE_COUNT = 8000;
const MOBILE_PARTICLE_COUNT = 6000;

const MASK_SIZE = 512;
const MASK_ALPHA_THRESHOLD = 128;
const FIT_INSET = 0.94;
const CONVERGE_DURATION = 3200;
const PARTICLE_SIZE = 2;
const GRID_GAP_DEVICE = 2;
const GRID_PITCH_RANGE = 18;
const MOUSE_RADIUS = 100;
const MOUSE_RADIUS_SPEED_DIVISOR = 8;
const MOUSE_PUSH = 50;
const MOUSE_PUSH_DECAY = 600;
const MOUSE_PUSH_HOLD = 0;
const PARTICLE_FOLLOW = 0.08;
const RESIZE_DEBOUNCE = 150;
const MAX_PIXEL_RATIO = 2;

const DEFAULT_PARAMS = {
  particleCount: DESKTOP_PARTICLE_COUNT,
  particleSize: PARTICLE_SIZE,
  mouseRadius: MOUSE_RADIUS,
  mousePush: MOUSE_PUSH,
  mousePushDecay: MOUSE_PUSH_DECAY,
  mousePushHold: MOUSE_PUSH_HOLD,
  follow: PARTICLE_FOLLOW,
  convergeDuration: CONVERGE_DURATION,
};

type ParticleParams = typeof DEFAULT_PARAMS;

const PARAM_META: {
  key: keyof ParticleParams;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: 'particleCount', label: '粒子数量', min: 500, max: 20000, step: 500 },
  { key: 'particleSize', label: '粒子大小', min: 0.5, max: 6, step: 0.5 },
  { key: 'mouseRadius', label: '鼠标最大半径', min: 0, max: 600, step: 10 },
  { key: 'mousePush', label: '鼠标扩散力', min: 0, max: 300, step: 10 },
  {
    key: 'mousePushDecay',
    label: '扩散消退时间',
    min: 0,
    max: 2000,
    step: 20,
  },
  {
    key: 'mousePushHold',
    label: '扩散保留时间',
    min: 0,
    max: 2000,
    step: 20,
  },
  { key: 'follow', label: '跟随惯性', min: 0.01, max: 0.4, step: 0.01 },
  {
    key: 'convergeDuration',
    label: '收敛时长',
    min: 200,
    max: 5000,
    step: 100,
  },
];

interface Particle {
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface AvatarMask {
  ink: Uint8Array;
  hitCount: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface AvatarFit {
  left: number;
  top: number;
  scale: number;
  minX: number;
  minY: number;
}

const EMPTY_FIT: AvatarFit = {
  left: 0,
  top: 0,
  scale: 0,
  minX: 0,
  minY: 0,
};

const EMPTY_MASK: AvatarMask = {
  ink: new Uint8Array(0),
  hitCount: 0,
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
};

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function luminance(r: number, g: number, b: number) {
  return (r * 77 + g * 151 + b * 28) >> 8;
}

function loadAvatar(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('hero avatar failed to load'));
    image.src = src;
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

function sampleAvatarMask(image: HTMLImageElement): AvatarMask {
  const canvas = document.createElement('canvas');
  canvas.width = MASK_SIZE;
  canvas.height = MASK_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return EMPTY_MASK;
  }
  context.drawImage(image, 0, 0, MASK_SIZE, MASK_SIZE);
  const { data } = context.getImageData(0, 0, MASK_SIZE, MASK_SIZE);
  const tones = new Uint8Array(MASK_SIZE * MASK_SIZE);
  let total = 0;
  let opaque = 0;
  for (let i = 0; i < tones.length; i += 1) {
    const offset = i * 4;
    if (data[offset + 3] < MASK_ALPHA_THRESHOLD) {
      continue;
    }
    const tone = luminance(data[offset], data[offset + 1], data[offset + 2]);
    tones[i] = tone;
    total += tone;
    opaque += 1;
  }
  if (opaque === 0) {
    return EMPTY_MASK;
  }
  const threshold = total / opaque;
  const ink = new Uint8Array(MASK_SIZE * MASK_SIZE);
  let hitCount = 0;
  let minX = MASK_SIZE;
  let minY = MASK_SIZE;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < MASK_SIZE; y += 1) {
    for (let x = 0; x < MASK_SIZE; x += 1) {
      const index = y * MASK_SIZE + x;
      if (
        data[index * 4 + 3] < MASK_ALPHA_THRESHOLD ||
        tones[index] >= threshold
      ) {
        continue;
      }
      ink[index] = 1;
      hitCount += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (hitCount === 0) {
    return EMPTY_MASK;
  }
  return {
    ink,
    hitCount,
    minX: minX / MASK_SIZE,
    minY: minY / MASK_SIZE,
    maxX: maxX / MASK_SIZE,
    maxY: maxY / MASK_SIZE,
  };
}

function fitInk(mask: AvatarMask, width: number, height: number): AvatarFit {
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

export interface ParticleAvatarProps {
  className?: string;
  src: string;
}

export function ParticleAvatar({ className, src }: ParticleAvatarProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const paramsRef = React.useRef<ParticleParams>({ ...DEFAULT_PARAMS });
  const [params, setParams] = React.useState<ParticleParams>({
    ...DEFAULT_PARAMS,
  });
  const startedAtRef = React.useRef(0);
  const engineRef = React.useRef<{ rebuild: () => void } | null>(null);
  const isClient = useClient();
  const screenSize = useScreenSize();
  const isSmall = screenSize === 'xs' || screenSize === 'sm';
  const particleCount = isSmall
    ? MOBILE_PARTICLE_COUNT
    : DESKTOP_PARTICLE_COUNT;

  paramsRef.current = params;

  const updateParam = (key: keyof ParticleParams, value: number) => {
    const next = { ...params, [key]: value };
    setParams(next);
    paramsRef.current = next;
    if (key === 'particleCount') {
      engineRef.current?.rebuild();
    }
    if (key === 'convergeDuration') {
      startedAtRef.current = 0;
    }
  };

  const resetParams = () => {
    const next = { ...DEFAULT_PARAMS };
    setParams(next);
    paramsRef.current = next;
    startedAtRef.current = 0;
    engineRef.current?.rebuild();
  };

  React.useEffect(() => {
    if (!isClient) {
      return;
    }
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || !src) {
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
    let pixelRatio = 1;
    let fit: AvatarFit = EMPTY_FIT;
    let particles: Particle[] = [];
    let mask: AvatarMask = EMPTY_MASK;
    let pointerX = 0;
    let pointerY = 0;
    let pointerInside = false;
    let pointerMovedAt = 0;
    let speedRadius = 0;

    const color = readForegroundColor();

    const measure = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      pixelRatio = ratio;
      fit = fitInk(mask, width, height);
    };

    const evenDeviceSize = () =>
      Math.max(
        2,
        Math.round((paramsRef.current.particleSize * pixelRatio) / 2) * 2,
      );

    const build = () => {
      const next: Particle[] = [];
      particles = next;
      if (fit.scale === 0 || mask.hitCount === 0) {
        return;
      }
      const wanted = Math.max(1, paramsRef.current.particleCount);
      const sizeDevice = evenDeviceSize();
      const minPitchDevice = sizeDevice + GRID_GAP_DEVICE;
      const maxPitchDevice = minPitchDevice + GRID_PITCH_RANGE;
      const boxWidth = (mask.maxX - mask.minX) * fit.scale;
      const boxHeight = (mask.maxY - mask.minY) * fit.scale;
      const inkArea =
        (mask.maxX - mask.minX) * (mask.maxY - mask.minY) * MASK_SIZE ** 2;
      const coverage = Math.min(
        1,
        Math.max(0.1, mask.hitCount / Math.max(1, inkArea)),
      );
      const target =
        Math.sqrt((coverage * boxWidth * boxHeight) / wanted) * pixelRatio;
      let pitchDevice = Math.round(
        Math.min(maxPitchDevice, Math.max(minPitchDevice, target)),
      );
      pitchDevice -= pitchDevice % 2;
      const pitch = pitchDevice / pixelRatio;
      const columns = Math.max(1, Math.round(boxWidth / pitch));
      const rows = Math.max(1, Math.round(boxHeight / pitch));
      const originX = Math.round((width - columns * pitch) * pixelRatio * 0.5);
      const originY = Math.round((height - rows * pitch) * pixelRatio * 0.5);

      for (let row = 0; row < rows; row += 1) {
        const y = (originY + (row + 0.5) * pitchDevice) / pixelRatio;
        const line = ((fit.minY + (y - fit.top) / fit.scale) * MASK_SIZE) | 0;
        if (line < 0 || line >= MASK_SIZE) {
          continue;
        }
        const lineBase = line * MASK_SIZE;
        for (let column = 0; column < columns; column += 1) {
          const x = (originX + (column + 0.5) * pitchDevice) / pixelRatio;
          const index =
            ((fit.minX + (x - fit.left) / fit.scale) * MASK_SIZE) | 0;
          if (
            index < 0 ||
            index >= MASK_SIZE ||
            mask.ink[lineBase + index] === 0
          ) {
            continue;
          }
          const fromX = Math.random() * width;
          const fromY = Math.random() * height;
          next.push({
            x: fromX,
            y: fromY,
            fromX,
            fromY,
            toX: x,
            toY: y,
          });
        }
      }

      for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const swap = next[i]!;
        next[i] = next[j]!;
        next[j] = swap;
      }
    };

    const getPushRadius = (now: number) => {
      if (!pointerInside || reducedMotion || speedRadius <= 0) {
        return 0;
      }
      const since = now - pointerMovedAt;
      const hold = paramsRef.current.mousePushHold;
      if (since < hold) {
        return speedRadius;
      }
      return (
        speedRadius *
        Math.max(0, 1 - (since - hold) / paramsRef.current.mousePushDecay)
      );
    };

    const draw = (now: number) => {
      if (disposed) {
        return;
      }
      if (!startedAtRef.current) {
        startedAtRef.current = now;
      }
      const elapsed = reducedMotion
        ? paramsRef.current.convergeDuration
        : now - startedAtRef.current;
      const eased = easeOutCubic(
        Math.min(1, elapsed / paramsRef.current.convergeDuration),
      );
      const pushRadius = getPushRadius(now);
      const follow = reducedMotion ? 1 : paramsRef.current.follow;
      const push = paramsRef.current.mousePush;

      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      const size = evenDeviceSize() / pixelRatio;
      const half = size / 2;

      for (const particle of particles) {
        let goalX = particle.fromX + (particle.toX - particle.fromX) * eased;
        let goalY = particle.fromY + (particle.toY - particle.fromY) * eased;

        if (pushRadius > 0) {
          const dx = particle.x - pointerX;
          const dy = particle.y - pointerY;
          const distance = Math.hypot(dx, dy);
          if (distance > 0.5 && distance < pushRadius) {
            const force =
              (1 - distance / pushRadius) * (0.5 + Math.random()) * push;
            const angle = Math.atan2(dy, dx);
            goalX += Math.cos(angle) * force;
            goalY += Math.sin(angle) * force;
          }
        }

        particle.x += (goalX - particle.x) * follow;
        particle.y += (goalY - particle.y) * follow;

        context.fillRect(particle.x - half, particle.y - half, size, size);
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
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const now = performance.now();
      if (pointerMovedAt) {
        const span = now - pointerMovedAt;
        if (span > 0) {
          const travel = Math.hypot(x - pointerX, y - pointerY);
          speedRadius = Math.min(
            paramsRef.current.mouseRadius,
            (travel / span) *
              (Math.min(window.innerWidth, window.innerHeight) /
                MOUSE_RADIUS_SPEED_DIVISOR),
          );
        }
      }
      pointerX = x;
      pointerY = y;
      pointerInside = true;
      pointerMovedAt = now;
    };

    const onPointerLeave = () => {
      pointerInside = false;
      pointerMovedAt = 0;
      speedRadius = 0;
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, RESIZE_DEBOUNCE);
    };

    const observer = new ResizeObserver(onResize);
    observer.observe(host);

    measure();
    engineRef.current = { rebuild };
    loadAvatar(src)
      .then((image) => {
        if (disposed) {
          return;
        }
        mask = sampleAvatarMask(image);
        if (mask.hitCount === 0) {
          return;
        }
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
  }, [isClient, src]);

  React.useEffect(() => {
    setParams((prev) => {
      const next = { ...prev, particleCount };
      paramsRef.current = next;
      return next;
    });
    engineRef.current?.rebuild();
  }, [particleCount]);

  return (
    <ZView ref={hostRef} className={cn('relative overflow-hidden', className)}>
      {isClient && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="block size-full"
        />
      )}
      {import.meta.env.DEV && (
        <ParticleAvatarDebugPanel
          params={params}
          meta={PARAM_META}
          onChange={updateParam}
          onReset={resetParams}
        />
      )}
    </ZView>
  );
}
