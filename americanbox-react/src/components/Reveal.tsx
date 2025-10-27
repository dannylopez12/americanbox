import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { variants } from "../lib/animations";

type AnimationType =
  | "fadeUp"
  | "fadeDown"
  | "fadeLeft"
  | "fadeRight"
  | "fade"
  | "zoomIn"
  | "zoomOut"
  | "rotateIn"
  | "slideRotate"
  | "bounceIn"
  | "flipIn"
  | "blurIn"
  | "popIn";

type RevealProps = {
  children: ReactNode;
  as?: "div" | "section" | "article" | "span" | "li" | "ul" | "nav" | "header" | "footer";
  delay?: number;
  type?: AnimationType;
  className?: string;
  once?: boolean;
  margin?: string; // rootMargin equivalente
  amount?: number | "some" | "all"; // cantidad de elemento visible para activar
};

export default function Reveal({
  children,
  as = "div",
  delay = 0,
  type = "fadeUp",
  className = "",
  once = true,
  margin = "-10% 0px -10% 0px",
  amount = 0.2,
}: RevealProps) {
  // Selección dinámica de variante
  const getVariant = (): Variants => {
    switch (type) {
      case "fadeUp":
        return variants.fadeUp(delay);
      case "fadeDown":
        return variants.fadeDown(delay);
      case "fadeLeft":
        return variants.fadeLeft(delay);
      case "fadeRight":
        return variants.fadeRight(delay);
      case "fade":
        return variants.fade(delay);
      case "zoomIn":
        return variants.zoomIn(delay);
      case "zoomOut":
        return variants.zoomOut(delay);
      case "rotateIn":
        return variants.rotateIn(delay);
      case "slideRotate":
        return variants.slideRotate(delay);
      case "bounceIn":
        return variants.bounceIn(delay);
      case "flipIn":
        return variants.flipIn(delay);
      case "blurIn":
        return variants.blurIn(delay);
      case "popIn":
        return variants.popIn(delay);
      default:
        return variants.fadeUp(delay);
    }
  };

  const Component = motion[as];

  return (
    <Component
      className={className}
      variants={getVariant()}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin, amount }}
    >
      {children}
    </Component>
  );
}
