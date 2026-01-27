import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(useGSAP, MotionPathPlugin);

export * from './stagger-reveal.animation';
export * from './fold.animation';
export * from './shrink-down.animation';
export * from './rainbow-border.animation';
