'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useAnimationControls, useInView, useReducedMotion } from 'motion/react';

/**
 * Progressive-enhancement scroll reveal for editorial sections.
 * Content starts visible on the server, with JavaScript disabled, and before
 * the intersection observer runs. It never hides information to animate it.
 */
export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  distance = 20,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.12, margin: '0px 0px -24px 0px' });
  const controls = useAnimationControls();

  useEffect(() => {
    if (!inView || reducedMotion) return;
    void controls.start({
      opacity: [0.74, 1],
      y: [distance, 0],
      transition: { type: 'spring', stiffness: 110, damping: 24, mass: 0.85, delay },
    });
  }, [controls, delay, distance, inView, reducedMotion]);

  return <motion.div ref={ref} className={className} initial={false} animate={controls}>{children}</motion.div>;
}
