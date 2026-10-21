'use client';

// Adapted from EasyUI Animated Number (MIT © 2026 Suraj Maurya).
// Bidcraft: en-ZA formatting, reduced-motion handling and accessible output.
import { useEffect } from 'react';
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react';

function Digit({ char }: { char: string }) {
  const target = Number(char);
  const spring = useSpring(target, { stiffness: 200, damping: 26, mass: 0.6 });
  const y = useTransform(spring, (value) => String(-value * 100) + '%');
  useEffect(() => { spring.set(target); }, [spring, target]);
  return <span className="relative inline-block h-[1.12em] w-[0.61em] overflow-hidden text-center align-baseline leading-[1.12em]">
    <motion.span style={{ y }} className="flex flex-col">
      {Array.from({ length: 10 }, (_, n) => <span key={n} className="block h-[1.12em] shrink-0">{n}</span>)}
    </motion.span>
  </span>;
}

export function AnimatedNumber({ value, className = '', label }: { value: number; className?: string; label?: string }) {
  const reducedMotion = useReducedMotion();
  const formatted = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
  return <span className={'inline-flex items-baseline tabular-nums ' + className} aria-label={label ? label + ': ' + formatted : formatted}>
    <span className="sr-only">{formatted}</span>
    <span aria-hidden="true" className="inline-flex items-baseline">
      {reducedMotion ? formatted : Array.from(formatted, (char, index) => /\d/.test(char)
        ? <Digit key={'digit-' + index} char={char} />
        : <span key={'sep-' + index} className="inline-block">{char}</span>)}
    </span>
  </span>;
}
