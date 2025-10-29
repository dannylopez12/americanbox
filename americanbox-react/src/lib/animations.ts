import type { Variants } from "framer-motion";

// Variantes reutilizables para mantener consistencia
export const variants = {
  // Transiciones de página
  page: {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    enter: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.98,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  },

  pageSlide: {
    initial: { opacity: 0, x: 100 },
    enter: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
    exit: {
      opacity: 0,
      x: -100,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  },

  pageFade: {
    initial: { opacity: 0 },
    enter: {
      opacity: 1,
      transition: { duration: 0.4 },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 },
    },
  },

  // Efectos básicos
  fadeUp: (delay = 0): Variants => ({
    hidden:  { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const
      }
    },
  }) as Variants,

  fadeDown: (delay = 0): Variants => ({
    hidden:  { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const
      }
    },
  }) as Variants,

  fadeLeft: (delay = 0): Variants => ({
    hidden:  { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        delay,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const
      }
    },
  }) as Variants,

  fadeRight: (delay = 0): Variants => ({
    hidden:  { opacity: 0, x: 40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        delay,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const
      }
    },
  }) as Variants,

  fade: (delay = 0): Variants => ({
    hidden:  { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delay,
        duration: 0.5
      }
    },
  }) as Variants,

  // Efectos de escala
  zoomIn: (delay = 0): Variants => ({
    hidden:  { opacity: 0, scale: 0.85 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const
      }
    },
  }) as Variants,

  zoomOut: (delay = 0): Variants => ({
    hidden:  { opacity: 0, scale: 1.15 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const
      }
    },
  }) as Variants,

  // Efectos de rotación
  rotateIn: (delay = 0): Variants => ({
    hidden:  { opacity: 0, rotate: -10, scale: 0.9 },
    visible: {
      opacity: 1,
      rotate: 0,
      scale: 1,
      transition: {
        delay,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const
      }
    },
  }) as Variants,

  // Efectos combinados
  slideRotate: (delay = 0): Variants => ({
    hidden:  { opacity: 0, x: -50, rotate: -5 },
    visible: {
      opacity: 1,
      x: 0,
      rotate: 0,
      transition: {
        delay,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1] as const
      }
    },
  }) as Variants,

  bounceIn: (delay = 0): Variants => ({
    hidden:  { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay,
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1] as const // efecto bounce
      }
    },
  }) as Variants,

  flipIn: (delay = 0): Variants => ({
    hidden:  { opacity: 0, rotateX: -90 },
    visible: {
      opacity: 1,
      rotateX: 0,
      transition: {
        delay,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const
      }
    },
  }) as Variants,

  // Efecto blur
  blurIn: (delay = 0): Variants => ({
    hidden:  { opacity: 0, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const
      }
    },
  }) as Variants,

  // Efecto scale con bounce
  popIn: (delay = 0): Variants => ({
    hidden:  { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay,
        duration: 0.5,
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    },
  }) as Variants,
};
