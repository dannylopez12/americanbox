import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { variants } from "../lib/animations";

type TransitionMode = "wait" | "sync" | "popLayout";

type PageTransitionProps = {
  children: ReactNode;
  mode?: TransitionMode;
  className?: string;
};

export default function PageTransition({
  children,
  mode = "wait",
  className = "",
}: PageTransitionProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={variants.page}
        className={className}
        style={{ position: "relative" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
