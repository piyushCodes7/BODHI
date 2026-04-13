import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function GlowCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };
    
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      style={{ contain: "strict" }}
    >
      <div
        className="absolute w-[80px] h-[80px] rounded-full bg-primary mix-blend-screen pointer-events-none"
        style={{
          left: position.x - 40,
          top: position.y - 40,
          opacity: 0.06,
          filter: "blur(20px)",
          transform: "translate3d(0,0,0)",
          willChange: "left, top"
        }}
      />
    </motion.div>
  );
}
