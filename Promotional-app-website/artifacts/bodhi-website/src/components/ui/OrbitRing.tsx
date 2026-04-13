import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plane, FileText, Activity } from "lucide-react";

const features = [
  {
    label: "Squad Vaults",
    desc: "Pool capital with your crew. Vote on investments. Share the alpha.",
    icon: Users,
    color: "text-primary",
    borderColor: "border-primary/60",
    bgColor: "bg-primary/20",
    glow: "0 0 28px rgba(198,255,0,0.7)",
  },
  {
    label: "Trip Wallet",
    desc: "Trips. Zero drama. Everyone chips in upfront, auto-settle at the end.",
    icon: Plane,
    color: "text-purple-400",
    borderColor: "border-purple-400/60",
    bgColor: "bg-purple-500/20",
    glow: "0 0 28px rgba(123,47,255,0.7)",
  },
  {
    label: "Insurance Brain",
    desc: "Upload your policy PDF. Ask anything. Get plain-language answers instantly.",
    icon: FileText,
    color: "text-blue-400",
    borderColor: "border-blue-400/60",
    bgColor: "bg-blue-500/20",
    glow: "0 0 28px rgba(0,212,255,0.7)",
  },
  {
    label: "Immune System",
    desc: "Background AI that catches unused subs, anomalies and spending spikes silently.",
    icon: Activity,
    color: "text-pink-400",
    borderColor: "border-pink-400/60",
    bgColor: "bg-pink-500/20",
    glow: "0 0 28px rgba(255,0,128,0.7)",
  },
];

export function OrbitRing() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="relative">
      <div className="relative w-full max-w-[min(660px,calc(100vw-2rem))] aspect-square mx-auto flex items-center justify-center [perspective:1200px]">
        <div className="absolute inset-[2%] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(198,255,0,0.12),transparent_36%),radial-gradient(circle_at_30%_24%,rgba(123,47,255,0.18),transparent_35%),radial-gradient(circle_at_74%_70%,rgba(255,0,128,0.16),transparent_30%)] blur-2xl opacity-80 pointer-events-none" />

        {[34, 50, 66, 82].map((size, index) => (
          <div
            key={size}
            className={`orbit-visual-ring orbit-ring-${index + 1}`}
            style={{
              width: `${size}%`,
              height: `${size}%`,
              opacity: active === index ? 0.95 : 0.52,
            }}
          />
        ))}

        <motion.div
          animate={{ rotateX: [58, 66, 58], rotateZ: [0, 360] }}
          transition={{ rotateZ: { repeat: Infinity, duration: 32, ease: "linear" }, rotateX: { repeat: Infinity, duration: 5, ease: "easeInOut" } }}
          className="absolute w-[46%] h-[46%] rounded-full border border-primary/20 pointer-events-none"
          style={{ transformStyle: "preserve-3d", boxShadow: "0 0 80px rgba(198,255,0,0.12), inset 0 0 50px rgba(123,47,255,0.1)" }}
        />

        <motion.div
          animate={{ y: [0, -10, 0], scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] sm:rounded-[2.5rem] bg-[#0A0A1A]/90 border-[3px] sm:border-4 border-primary flex items-center justify-center shadow-[0_0_90px_rgba(198,255,0,0.5)] pointer-events-none rotate-45"
        >
          <span className="font-display font-black text-base sm:text-xl text-white tracking-tighter -rotate-45">BODHI</span>
        </motion.div>

        {features.map((feature, index) => {
          const Icon = feature.icon;
          const positions = [
            "top-[4%] left-1/2 -translate-x-1/2",
            "top-1/2 right-[1%] -translate-y-1/2",
            "bottom-[4%] left-1/2 -translate-x-1/2",
            "top-1/2 left-[1%] -translate-y-1/2",
          ];

          return (
            <motion.button
              key={feature.label}
              type="button"
              onMouseEnter={() => setActive(index)}
              onMouseMove={() => setActive(index)}
              onPointerEnter={() => setActive(index)}
              onPointerMove={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              onBlur={() => setActive(null)}
              whileHover={{ scale: 1.18, rotate: index % 2 === 0 ? 8 : -8, z: 60 }}
              whileTap={{ scale: 0.96 }}
              className={`group absolute ${positions[index]} z-30 rounded-[1.9rem] p-3 -m-3 focus:outline-none focus:ring-2 focus:ring-primary/70`}
              aria-label={feature.label}
            >
              <span
                className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-[1.2rem] sm:rounded-[1.6rem] ${feature.bgColor} border-2 ${feature.borderColor} flex items-center justify-center transition-all duration-300 backdrop-blur-xl`}
                style={{
                  boxShadow: active === index ? feature.glow : "0 18px 55px rgba(0,0,0,0.45)",
                }}
              >
                <span className="absolute inset-1.5 sm:inset-2 rounded-[0.9rem] sm:rounded-[1.15rem] border border-white/12" />
                <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${feature.color}`} />
              </span>
            </motion.button>
          );
        })}

        <AnimatePresence>
          {active !== null && (
            <motion.div
              key={`floating-${active}`}
              initial={{ opacity: 0, scale: 0.86, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -16 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="absolute z-40 top-[62%] left-1/2 -translate-x-1/2 w-[min(86vw,360px)] rounded-[1.5rem] sm:rounded-[2rem] border border-white/12 bg-black/70 backdrop-blur-2xl p-4 sm:p-6 text-center shadow-[0_30px_100px_rgba(0,0,0,0.55)] pointer-events-none"
            >
              <h3 className={`font-display font-black text-2xl sm:text-3xl mb-2 ${features[active].color}`}>
                {features[active].label}
              </h3>
              <p className="text-white/65 font-medium leading-relaxed text-sm">
                {features[active].desc}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-[15%] sm:bottom-[17%] left-1/2 -translate-x-1/2 text-white/20 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] pointer-events-none whitespace-nowrap">
          Four live rails
        </div>
      </div>

      <div className="mt-8 min-h-[104px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {active === null && (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/25 text-sm font-bold uppercase tracking-widest text-center px-4"
            >
              Hover or tab into any superpower to reveal it
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
