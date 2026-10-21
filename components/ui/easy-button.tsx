'use client';

// Adapted from EasyUI Button (MIT © 2026 Suraj Maurya).
// Keeps Bidcraft's colors and Phosphor iconography; honors reduced motion.
import { forwardRef, type ReactNode } from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
const variants: Record<Variant, string> = {
  primary: 'bg-[#DDFB82] text-[#101714] hover:bg-[#d2ef70]',
  secondary: 'bg-[#101714] text-white hover:bg-[#168B7A] dark:bg-[#DDFB82] dark:text-[#101714]',
  outline: 'border border-neutral-300 bg-white text-[#101714] hover:bg-[#F2F3ED] dark:border-neutral-700 dark:bg-[#161918] dark:text-white',
  ghost: 'text-[#12695C] hover:bg-[#168B7A]/10 dark:text-[#9BDBBE]',
};

export interface EasyButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
  loadingText?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const EasyButton = forwardRef<HTMLButtonElement, EasyButtonProps>(function EasyButton({
  variant = 'primary', loading = false, loadingText, leadingIcon, trailingIcon,
  children, className, disabled, type = 'button', ...rest
}, ref) {
  const reducedMotion = useReducedMotion();
  return <motion.button {...rest} ref={ref} type={type} disabled={disabled || loading} aria-busy={loading}
    whileTap={reducedMotion || disabled || loading ? undefined : { scale: 0.97 }}
    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
    className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168B7A] disabled:cursor-not-allowed disabled:opacity-50', variants[variant], className)}>
    {loading ? <CircleNotch size={17} className={reducedMotion ? '' : 'animate-spin'} aria-hidden="true" /> : leadingIcon}
    <span>{loading && loadingText ? loadingText : children}</span>
    {!loading && trailingIcon}
  </motion.button>;
});
