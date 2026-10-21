'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * A one-shot, transform-only reveal for editorial sections.
 * Never use this around sticky UI or content that must remain continuously interactive.
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
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12, margin: '0px 0px -24px 0px' }}
      transition={reducedMotion ? { duration: 0 } : {
        type: 'spring', stiffness: 110, damping: 24, mass: 0.85, delay,
      }}
    >
      {children}
    </motion.div>
  );
}
