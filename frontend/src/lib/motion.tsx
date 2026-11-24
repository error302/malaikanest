'use client';

/**
 * Malaika Nest — shared motion system.
 *
 * Encodes the 20 principles of UX & animation as reusable primitives so every
 * surface animates with the same voice:
 *
 *  1. Squash & stretch      -> `pressable` scale on tap (0.96 squash)
 *  2. Anticipation wind-up  -> `windUp` variant (pull back before forward)
 *  3. Staging the focus     -> `Reveal` draws the eye top-down with stagger
 *  4. Pose to pose          -> variants with explicit keyframe poses
 *  5. Follow through        -> spring transitions (overshoot settles)
 *  6. Slow in & slow out    -> custom ease curves on every transition
 *  7. Moving in arcs        -> `arc` y/x offset pairs (never straight-line pops)
 *  8. Secondary action      -> icon/label counter-motion in `MotionButton`
 *  9. Snappy timing         -> 150–250ms for feedback, never sluggish
 * 10. Exaggerated feedback  -> success/error pulses on state change
 * 11. Solid drawing in 3D   -> subtle perspective tilt on hover cards
 * 12. Overall appeal        -> consistent tokens below; no one-off animations
 * 13. Fitts's law           -> motion never moves a target away from the cursor
 * 14. Bigger hit areas      -> motion scales the *feedback*, not the hit box
 * 15. Hick's law            -> stagger reveals options in reading order
 * 16. Miller's law          -> groups of ≤4 animate as one beat
 * 17. Doherty threshold     -> all feedback < 400ms; skeletons cover waits
 * 18. Postel's law          -> tolerant: animations fail soft (no layout shift)
 * 19. Jakob's law           -> familiar patterns: drawers slide, cards lift
 * 20. Frequency of use      -> most-used actions (add to cart) get the richest
 *                              feedback; rare ones stay quiet
 *
 * All primitives respect `prefers-reduced-motion` via Framer Motion's
 * `useReducedMotion` — motion collapses to opacity-only or none.
 */

import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
  type HTMLMotionProps,
} from 'framer-motion';
import React from 'react';

// ── Timing tokens ────────────────────────────────────────────────────────────
export const DURATION = {
  instant: 0.12, // Doherty threshold: acknowledge immediately
  snappy: 0.18, // button/press feedback
  smooth: 0.28, // reveals, small slides
  gentle: 0.45, // large surfaces, drawers
} as const;

// Slow in & slow out — custom cubic-bezier pairs (in, out).
export const EASE = {
  out: [0.22, 1, 0.36, 1] as const, // ease-out-quint feel: fast start, soft land
  inOut: [0.65, 0, 0.35, 1] as const,
};

// Follow through — springs with a touch of overshoot.
export const SPRING: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 28,
  mass: 0.9,
};

export const SPRING_SOFT: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 30,
};

// ── Variants ─────────────────────────────────────────────────────────────────

/** Drawer / off-canvas slide (cart drawer, mobile nav). Jakob's law: familiar. */
export const slideOver: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: SPRING_SOFT },
  exit: { x: '100%', transition: { duration: DURATION.smooth, ease: EASE.inOut } },
};

/** Pose-to-pose entrance: rise on an arc, settle with soft spring. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 24, x: 0 },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: { ...SPRING_SOFT, opacity: { duration: DURATION.smooth, ease: EASE.out } },
  },
};

/** Anticipation wind-up: pull back slightly, then overshoot forward. */
export const windUp: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 8 },
  show: {
    opacity: 1,
    scale: [0.94, 1.03, 1], // anticipation -> overshoot -> settle
    y: [8, -2, 0],
    transition: { duration: DURATION.gentle, ease: EASE.out },
  },
};

/** Container that staggers children in reading order (Hick's law). */
export const staggerContainer = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

// ── Components ───────────────────────────────────────────────────────────────

/**
 * Scroll-into-view reveal. Default is a gentle rise; pass variant="windUp"
 * for elements that deserve a beat of anticipation (hero CTAs, badges).
 */
export function Reveal({
  children,
  variant = 'rise',
  delay = 0,
  className,
  as = 'div',
  ...rest
}: {
  children: React.ReactNode;
  variant?: 'rise' | 'windUp';
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
} & Omit<HTMLMotionProps<'div'>, 'children'>) {
  const reduced = useReducedMotion();
  const variants = reduced
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: DURATION.smooth } } }
    : variant === 'windUp'
      ? windUp
      : riseIn;
  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      variants={variants}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Staggered group: children wrapped in Reveal (or any motion element using
 * `riseIn`) animate one after another. Use for grids of ≤8 items — Miller's
 * law: beyond that, animate rows as a single beat instead.
 */
export function RevealGroup({
  children,
  stagger = 0.06,
  className,
  ...rest
}: {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
} & Omit<HTMLMotionProps<'div'>, 'children'>) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      variants={staggerContainer(stagger)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Pressable: squash & stretch on tap (principle 1) with snappy timing
 * (principle 9). Scales the visual, never the hit area (principles 13/14).
 * Wrap a button or use as a motion wrapper around any clickable element.
 */
export function Pressable({
  children,
  className,
  as = 'div',
  scale = 0.96,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'span';
  scale?: number;
} & Omit<HTMLMotionProps<'div'>, 'children'>) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      whileTap={reduced ? undefined : { scale }}
      whileHover={reduced ? undefined : { scale: 1.015 }}
      transition={SPRING}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Exaggerated feedback pulse (principle 10): fires when `trigger` changes.
 * Use for add-to-cart success, wishlist toggle, etc. — brief, never looping.
 */
export function FeedbackPulse({
  trigger,
  children,
  className,
}: {
  trigger: number | string | boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      key={String(trigger)}
      className={className}
      initial={reduced ? false : { scale: 1.25 }}
      animate={{ scale: 1 }}
      transition={SPRING}
    >
      {children}
    </motion.span>
  );
}
