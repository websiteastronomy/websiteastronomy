"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ReactNode, useRef } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  index?: number;
  className?: string;
  style?: React.CSSProperties;
  enableTilt?: boolean;
  href?: string;
  onClick?: () => void;
}

export default function AnimatedCard({
  children,
  index = 0,
  className = "",
  style,
  enableTilt = true,
  href,
  onClick,
}: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), {
    stiffness: 300,
    damping: 30,
  });

  const shineX = useTransform(mouseX, [0, 1], [0, 100]);
  const shineY = useTransform(mouseY, [0, 1], [0, 100]);


  const shineBackground = useTransform(
    [shineX, shineY],
    ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(201, 168, 76, 0.08) 0%, transparent 60%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const Tag = href ? "a" : "div";

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`feature-card ${className}`}
      style={{
        ...style,
        perspective: "800px",
        position: "relative",
        overflow: "hidden",
        transformStyle: "preserve-3d",
        cursor: href || onClick ? "pointer" : undefined,
      }}
    >
      {enableTilt ? (
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
            width: "100%",
            height: "100%",
          }}
        >
          {children}
          {/* Shine overlay */}
          <motion.div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              background: shineBackground,
              borderRadius: "inherit",
            }}
          />
        </motion.div>
      ) : (
        children
      )}
    </motion.div>
  );
}
