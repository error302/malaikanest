import type { Variants } from "framer-motion";

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const slideOver: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { type: "spring", damping: 30, stiffness: 300 } },
  exit: { x: "100%", transition: { duration: 0.3, ease: "easeInOut" } },
};

// Convenience props that respect prefers-reduced-motion via Framer's built-in handling.
// `viewport: { once: true }` ensures animations don't re-fire on scroll-back.
export const motionProps = (variants: Variants) => ({
  variants,
  initial: "hidden" as const,
  whileInView: "visible" as const,
  viewport: { once: true, margin: "-50px" },
});
