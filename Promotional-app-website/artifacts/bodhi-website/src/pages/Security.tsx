import { HolographicBackground } from "@/components/ui/holographic-background";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, Lock, Fingerprint, EyeOff, Server, CheckCircle2, Hexagon, ShieldAlert, Cpu } from "lucide-react";

const pillars = [
  {
    icon: Lock,
    title: "AES-256",
    tag: "Encryption",
    desc: "Military-grade encryption at rest and in transit. The same standard used by governments.",
    stat: "256-bit",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-400/30",
    glow: "rgba(96,165,250,0.4)"
  },
  {
    icon: Fingerprint,
    title: "Biometric",
    tag: "Authentication",
    desc: "FaceID and TouchID baked into every critical action. No passwords stored, ever.",
    stat: "0 passes",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-400/30",
    glow: "rgba(168,85,247,0.4)"
  },
  {
    icon: EyeOff,
    title: "Zero Sale",
    tag: "Data Privacy",
    desc: "We don't sell your data. Period. We make money when you make money — not off your info.",
    stat: "Never",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-400/30",
    glow: "rgba(236,72,153,0.4)"
  },
  {
    icon: Server,
    title: "FDIC Insured",
    tag: "Fund Safety",
    desc: "Funds insured up to $250,000 through our FDIC-member partner banks.",
    stat: "$250k",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
    glow: "rgba(198,255,0,0.4)"
  },
];

const checks = [
  "End-to-end encrypted transactions",
  "Real-time fraud detection with AI",
  "SOC 2 Type II certified infrastructure",
  "ISO 27001 compliant data handling",
  "Multi-factor authentication required",
  "Automatic logout on inactivity",
  "Device-level hardware encryption",
  "Continuous penetration testing"
];

const AnimatedShield = () => {
  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto mb-12 sm:mb-16 perspective-1000">
      <motion.div
        animate={{ rotateY: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Core Shield */}
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-xl border-4 border-primary rounded-[2.5rem] sm:rounded-[3rem] rotate-45 flex items-center justify-center shadow-[0_0_100px_rgba(198,255,0,0.6)]" style={{ transform: "translateZ(0px)" }}>
          <Shield className="w-24 h-24 sm:w-32 sm:h-32 text-primary -rotate-45 drop-shadow-[0_0_20px_rgba(198,255,0,1)]" />
        </div>
        
        {/* Orbiting Elements */}
        <motion.div className="absolute -inset-10 border border-primary/30 rounded-full" style={{ transform: "translateZ(50px) rotateX(60deg)" }} />
        <motion.div className="absolute -inset-20 border border-white/10 rounded-full" style={{ transform: "translateZ(-50px) rotateY(60deg)" }} />
        
        {/* Floating Icons */}
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-4 -left-4 w-16 h-16 bg-black/80 border border-primary/50 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(198,255,0,0.3)]" style={{ transform: "translateZ(80px)" }}>
          <Lock className="w-8 h-8 text-primary" />
        </motion.div>
        
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -bottom-8 -right-8 w-20 h-20 bg-black/80 border border-blue-400/50 rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_0_30px_rgba(96,165,250,0.3)]" style={{ transform: "translateZ(100px)" }}>
          <Fingerprint className="w-10 h-10 text-blue-400" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default function Security() {
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], [0, 200]);

  return (
    <div className="min-h-screen text-white bg-[#0A0A1A] relative overflow-hidden perspective-1000">
      <HolographicBackground />

      {/* Cyber Grid Background */}
      <motion.div 
        style={{ y: yBg }}
        className="absolute inset-0 opacity-10 pointer-events-none z-0"
        initial={{ backgroundPosition: "0px 0px" }}
        animate={{ backgroundPosition: "0px 100px" }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-[200%] absolute top-[-50%] bg-[linear-gradient(rgba(198,255,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(198,255,0,0.2)_1px,transparent_1px)] bg-[size:100px_100px] [transform:rotateX(60deg)] origin-top" />
      </motion.div>

      {/* Hero */}
      <section className="relative pt-32 sm:pt-40 md:pt-48 pb-20 sm:pb-28 md:pb-32 text-center overflow-hidden z-10">
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[800px] h-[800px] bg-primary/10 blur-[200px] rounded-full" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <AnimatedShield />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex max-w-full items-center gap-2 px-4 sm:px-5 py-2 rounded-full border border-primary/40 bg-primary/10 text-primary mb-8 backdrop-blur-md"
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest">Bank-Grade Infrastructure</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.5 }}
            className="font-display font-black text-[clamp(4rem,13vw,150px)] uppercase tracking-tighter leading-none mb-8 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] max-w-full"
          >
            Fortress.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-xl sm:text-2xl text-white/60 font-medium max-w-3xl mx-auto leading-relaxed"
          >
            Your money is alive, but it's locked down. We don't mess around with security — we build <strong className="text-white">impenetrable digital vaults</strong>.
          </motion.p>
        </div>
      </section>

      {/* 3D Pillars */}
      <section className="pb-24 sm:pb-32 lg:pb-40 relative z-20 perspective-1000">
        <div className="container mx-auto px-6">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto mb-32">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 100, rotateX: 30 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: i * 0.15, type: "spring", bounce: 0.4 }}
                  whileHover={{ scale: 1.05, translateY: -10, zIndex: 10 }}
                  className="p-[1px] rounded-[2.5rem] relative group min-w-0"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="h-full bg-[#0A0A1A]/90 backdrop-blur-2xl rounded-[2.5rem] p-8 xl:p-10 border border-white/10 relative overflow-hidden group-hover:border-white/20 transition-colors">
                    <div className={`absolute top-0 right-0 w-32 h-32 ${p.bg} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full`} />
                    
                    <div className="absolute top-6 right-6 max-w-[calc(100%-7rem)] text-right text-xs font-black uppercase tracking-[0.18em] text-white/30 group-hover:text-white/70 transition-colors">{p.tag}</div>
                    
                    <div className={`w-16 h-16 rounded-2xl ${p.bg} border ${p.border} flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <Icon className={`w-8 h-8 ${p.color} drop-shadow-[0_0_10px_${p.glow}]`} />
                    </div>
                    
                    <div className={`font-display font-black text-[clamp(2.75rem,5vw,3rem)] xl:text-5xl leading-[0.95] break-words ${p.color} mb-4 drop-shadow-md`}>{p.stat}</div>
                    <h3 className="font-black text-2xl text-white mb-4">{p.title}</h3>
                    <p className="text-base text-white/50 font-medium leading-relaxed">{p.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Epic Checklist Board */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 20 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, type: "spring" }}
            className="max-w-5xl mx-auto relative group perspective-1000"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-blue-500 to-purple-500 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
            
            <div className="relative bg-black/80 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-12 md:p-16 border border-white/10 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center gap-6 mb-12 border-b border-white/10 pb-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Cpu className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center md:text-left">
                  <h2 className="font-display font-black text-[clamp(2.25rem,10vw,3rem)] md:text-5xl uppercase tracking-tighter mb-2">Systems Online</h2>
                  <p className="text-white/50 font-medium text-lg">Continuous monitoring protocols active.</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {checks.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02, x: 10, backgroundColor: "rgba(255,255,255,0.05)" }}
                    className="flex items-start sm:items-center gap-4 p-3 sm:p-4 rounded-2xl border border-transparent transition-all cursor-default"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(198,255,0,0.3)]">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-white/80 font-medium text-base sm:text-lg">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Report Holographic CTA */}
      <section className="py-24 sm:py-32 lg:py-40 bg-[#020205] border-t border-white/10 relative z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(198,255,0,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="container mx-auto px-6 text-center relative z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-24 h-24 mx-auto bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center mb-8 rotate-45"
          >
            <Hexagon className="w-12 h-12 text-primary -rotate-45" />
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-white/40 text-xs sm:text-sm font-black uppercase tracking-[0.28em] sm:tracking-[0.4em] mb-6"
          >
            Still not convinced?
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display font-black text-[clamp(3rem,14vw,6rem)] md:text-8xl uppercase tracking-tighter leading-[0.95] mb-8 drop-shadow-xl"
          >
            Read our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">Trust Report</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/50 font-medium max-w-2xl mx-auto mb-12"
          >
            Full transparency. Annual independent security audits published openly. We hide nothing.
          </motion.p>
          
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="min-h-16 w-full sm:w-auto px-8 sm:px-12 text-base sm:text-lg font-black bg-white/10 text-white border border-white/20 hover:bg-white hover:text-black rounded-full transition-colors shadow-2xl backdrop-blur-md"
          >
            Download 2024 Report
          </motion.button>
        </div>
      </section>
    </div>
  );
}
