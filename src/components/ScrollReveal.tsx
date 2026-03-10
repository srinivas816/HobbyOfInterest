import { motion, type Variant } from "framer-motion";
import { type ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
  scale?: boolean;
}

const getInitial = (direction: Direction, scale: boolean): Variant => {
  const base: Record<string, number> = { opacity: 0 };
  if (scale) base.scale = 0.95;
  switch (direction) {
    case "up": base.y = 40; break;
    case "down": base.y = -40; break;
    case "left": base.x = 40; break;
    case "right": base.x = -40; break;
    default: break;
  }
  return base;
};

const ScrollReveal = ({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  className,
  once = true,
  amount = 0.15,
  scale = false,
}: ScrollRevealProps) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once, amount }}
    variants={{
      hidden: getInitial(direction, scale),
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        transition: { duration, delay, ease: [0.25, 0.1, 0.25, 1] },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export default ScrollReveal;
