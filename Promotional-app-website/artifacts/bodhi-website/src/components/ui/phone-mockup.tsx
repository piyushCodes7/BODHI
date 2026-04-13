import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
}

export function PhoneMockup({ children, className = "" }: PhoneMockupProps) {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
      className={`relative w-[320px] h-[650px] rounded-[3rem] border-[8px] border-black/80 bg-black overflow-hidden shadow-2xl shadow-primary/20 ${className}`}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-20" />
      
      {/* Screen Content */}
      <div className="relative w-full h-full bg-[#0A0A1A] overflow-hidden">
        {/* Subtle screen reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-10" />
        {children}
      </div>
    </motion.div>
  );
}
