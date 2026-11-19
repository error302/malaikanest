import type { Variants } from "framer-motion";

export const slideOver: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { type: "spring", damping: 30, stiffness: 300 } },
  exit: { x: "100%", transition: { duration: 0.3, ease: "easeInOut" } },
};
