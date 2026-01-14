import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';

gsap.registerPlugin(useGSAP);

export * from './stagger-reveal.animation';
export * from './fold.animation';
