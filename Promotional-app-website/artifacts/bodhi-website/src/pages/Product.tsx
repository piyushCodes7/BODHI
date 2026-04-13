import { HolographicBackground } from "@/components/ui/holographic-background";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { Users, Plane, FileText, Activity, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useRef } from "react";

const features = [
  {
    title: "Squad Vaults",
    number: "01",
    subtitle: "Invest together. Win together.",
    desc: "Micro-investment clubs for your crew. Pool capital, vote on plays, share the alpha.",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    glow: "rgba(198,255,0,0.4)",
    accent: "#C6FF00",
    tags: ["Group Investing", "Voting", "Alpha Sharing"],
  },
  {
    title: "Trip Wallet",
    number: "02",
    subtitle: "Everyone pays. Nobody chases.",
    desc: "Temporary shared wallets for trips, dinners, and events. Everyone chips in upfront.",
    icon: Plane,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-400/30",
    glow: "rgba(123,47,255,0.4)",
    accent: "#7B2FFF",
    tags: ["Travel", "Group Expenses", "Auto-Settle"],
  },
  {
    title: "Insurance Brain",
    number: "03",
    subtitle: "Your policy. Finally readable.",
    desc: "Upload any insurance PDF. Ask anything. Get real, plain-language answers. No jargon.",
    icon: FileText,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-400/30",
    glow: "rgba(0,212,255,0.4)",
    accent: "#00D4FF",
    tags: ["AI/RAG", "PDF Upload", "Story Format"],
  },
  {
    title: "Immune System",
    number: "04",
    subtitle: "Your money's bodyguard.",
    desc: "Runs silently in the background. Surfaces only when it catches anomalies or unused subs.",
    icon: Activity,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-400/30",
    glow: "rgba(255,0,128,0.4)",
    accent: "#FF0080",
    tags: ["Background AI", "Anomaly Detection", "No Dashboard"],
  },
];

const FloatingOrb = ({ color, size, delay, x, y }: { color: string, size: number, delay: number, x: number[], y: number[] }) => (
  <motion.div
    className="absolute rounded-full mix-blend-screen pointer-events-none blur-3xl opacity-30"
    style={{
      width: size,
      height: size,
      backgroundColor: color,
    }}
    animate={{
      x,
      y,
      scale: [1, 1.2, 0.9, 1],
    }}
    transition={{
      duration: 15,
      repeat: Infinity,
      repeatType: "mirror",
      ease: "easeInOut",
      delay,
    }}
  />
);

const FeatureCard = ({ f, i }: { f: typeof features[0], i: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct * 20); // 20 deg rotation
    y.set(yPct * -20);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Icon = f.icon;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: mouseYSpring,
        rotateY: mouseXSpring,
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 0, y: 100, rotateX: 20 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
      className={`group relative p-[1px] rounded-[2.5rem] sm:rounded-[3rem] perspective-1000 z-10 w-full min-w-0`}
    >
      {/* Animated Gradient Border */}
      <div className="absolute inset-0 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
           style={{
             background: `linear-gradient(120deg, transparent, ${f.accent}, transparent)`,
             backgroundSize: '200% 200%',
             animation: 'gradientMove 3s ease infinite'
           }}
      />
      
      <div className={`relative h-full w-full bg-[#0A0A1A]/80 backdrop-blur-2xl rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 md:p-12 border ${f.border} overflow-hidden`}
           style={{ transform: "translateZ(30px)" }}>
        
        {/* Glow backdrop on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
             style={{ background: `radial-gradient(circle at center, ${f.glow} 0%, transparent 70%)` }} />

        {/* Large number bg */}
        <motion.div
          className="absolute top-0 right-0 font-display font-black leading-none select-none pointer-events-none"
          style={{
            fontSize: "clamp(8rem, 20vw, 250px)",
            color: f.accent,
            opacity: 0.03,
            lineHeight: 0.8,
            transform: "translate(5%, -5%) translateZ(10px)",
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.03, 0.05, 0.03]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {f.number}
        </motion.div>

        <div className="flex flex-col md:flex-row items-start gap-6 sm:gap-8 relative z-20 min-w-0">
          {/* Icon with 3D pop */}
          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl ${f.bg} border ${f.border} flex items-center justify-center flex-shrink-0 shadow-2xl transition-transform duration-500 group-hover:scale-110`}
               style={{ transform: "translateZ(50px)" }}>
            <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${f.color} drop-shadow-[0_0_15px_${f.glow}]`} />
          </div>

          <div className="flex-1 min-w-0" style={{ transform: "translateZ(40px)" }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-black uppercase tracking-widest text-white/40 group-hover:text-white/80 transition-colors">{f.number}</span>
              <span className={`text-xs font-black uppercase tracking-widest ${f.color} opacity-60`}>/</span>
            </div>
            <h2 className={`font-display font-black text-[clamp(2.5rem,12vw,3.75rem)] md:text-6xl leading-[0.95] mb-3 tracking-tighter break-words ${f.color} drop-shadow-md`}>{f.title}</h2>
            <p className="text-xl sm:text-2xl font-black text-white mb-4 tracking-tight">{f.subtitle}</p>
            <p className="text-lg text-white/60 font-medium mb-8 max-w-xl leading-relaxed">{f.desc}</p>

            {/* Tags with stagger */}
            <div className="flex flex-wrap gap-3">
              {f.tags.map((tag, j) => (
                <motion.span
                  key={j}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: j * 0.1 + 0.3 }}
                  className={`text-xs font-black px-4 py-2 rounded-full border ${f.border} ${f.color} bg-white/5 uppercase tracking-widest shadow-lg backdrop-blur-md`}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity duration-500"
               style={{ transform: "translateZ(60px)" }}>
            <div className={`w-16 h-16 rounded-full ${f.bg} border ${f.border} flex items-center justify-center shadow-[0_0_30px_${f.glow}]`}>
              <ArrowRight className={`w-6 h-6 ${f.color}`} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Product() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]);

  return (
    <div className="min-h-screen text-white bg-[#0A0A1A] relative overflow-hidden perspective-1000">
      <HolographicBackground />

      {/* Floating Ambient Orbs */}
      <FloatingOrb color="#C6FF00" size={400} delay={0} x={[0, 200, -100, 0]} y={[0, -200, 100, 0]} />
      <FloatingOrb color="#7B2FFF" size={500} delay={2} x={[-200, 100, 200, -200]} y={[100, 300, -100, 100]} />
      <FloatingOrb color="#FF0080" size={350} delay={4} x={[100, -300, 100, 100]} y={[-100, 100, 300, -100]} />

      {/* Page hero */}
      <section className="relative pt-32 sm:pt-40 md:pt-48 pb-20 sm:pb-28 md:pb-32 text-center overflow-hidden z-10">
        <motion.div 
          style={{ y: y1 }}
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <div className="w-[1000px] h-[500px] bg-primary/10 blur-[150px] rounded-[100%]" />
        </motion.div>

        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 1, type: "spring", bounce: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">The Superpowers</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4, delay: 0.1 }}
            className="font-display font-black text-[clamp(3.6rem,17vw,140px)] uppercase tracking-tighter leading-[0.8] mb-8 relative z-20"
            style={{ textShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
          >
            The<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-green-400 italic block mt-2">
              Product
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Bodhi isn't just a tracking app. It's a <strong className="text-white">living 3D ecosystem</strong> — four distinct superpowers, seamlessly integrated into one cinematic experience.
          </motion.p>
        </div>
      </section>

      {/* Features 3D Stack */}
      <section className="pb-24 sm:pb-32 lg:pb-40 relative z-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto flex flex-col gap-12">
            {features.map((f, i) => (
              <FeatureCard key={i} f={f} i={i} />
            ))}
          </div>

          {/* See it in action CTA with 3D effect */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-center mt-32 relative"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
            
            <p className="text-white/40 text-sm font-black uppercase tracking-[0.2em] mb-8 relative z-10">See all four in action</p>
            <Link href="/">
              <motion.button 
                whileHover={{ scale: 1.05, translateY: -5 }}
                whileTap={{ scale: 0.95 }}
                className="relative z-10 group inline-flex w-full sm:w-auto items-center justify-center gap-4 min-h-16 px-8 sm:px-12 font-black bg-primary text-black rounded-full transition-all shadow-[0_0_40px_rgba(198,255,0,0.4)] hover:shadow-[0_0_80px_rgba(198,255,0,0.8)] text-base sm:text-lg overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
                <span className="relative z-10">Back to Home</span> 
                <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .perspective-1000 { perspective: 1000px; }
        `
      }} />
    </div>
  );
}
