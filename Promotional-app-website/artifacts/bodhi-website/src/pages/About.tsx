import { HolographicBackground } from "@/components/ui/holographic-background";
import { motion, useScroll, useTransform } from "framer-motion";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import { Globe, Zap, Users, Shield, Cpu, Flame } from "lucide-react";

const manifesto = [
  { label: "Founded", value: "2024" },
  { label: "Team", value: "28 people" },
  { label: "HQ", value: "Bangalore" },
  { label: "Raised", value: "$4.2M" },
];

const values = [
  { title: "Social > Solo", body: "Money is better when it's shared. Collective decisions beat individual guesses.", accent: "text-primary", bg: "bg-primary/5", border: "border-primary/20", shadow: "rgba(198,255,0,0.2)", icon: Users },
  { title: "Clarity > Complexity", body: "If we can't explain it simply, we haven't built it right. Plain language, always.", accent: "text-purple-400", bg: "bg-purple-500/5", border: "border-purple-400/20", shadow: "rgba(168,85,247,0.2)", icon: Zap },
  { title: "Action > Anxiety", body: "We surface what matters and hide what doesn't. Less noise, more signal, zero dread.", accent: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-400/20", shadow: "rgba(59,130,246,0.2)", icon: Target },
  { title: "Earned > Given", body: "Trust is built through transparency, not terms of service. Security is our foundation.", accent: "text-pink-400", bg: "bg-pink-500/5", border: "border-pink-400/20", shadow: "rgba(236,72,153,0.2)", icon: Shield },
  { title: "Speed > Permission", body: "Move fast, fix fast. We ship weekly and break nothing in production.", accent: "text-primary", bg: "bg-primary/5", border: "border-primary/20", shadow: "rgba(198,255,0,0.2)", icon: Flame },
  { title: "Gen Z > Everyone", body: "We're building for the generation that inherits the economy. The best tools.", accent: "text-orange-400", bg: "bg-orange-500/5", border: "border-orange-400/20", shadow: "rgba(249,115,22,0.2)", icon: Cpu },
];

function Target(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
}

export default function About() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const opacity1 = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div className="min-h-screen text-white bg-[#0A0A1A] relative overflow-hidden perspective-1000">
      <HolographicBackground />

      {/* Hero / Manifesto Parallax */}
      <section className="relative min-h-[90vh] flex items-center pt-28 sm:pt-32 pb-24 sm:pb-32 overflow-hidden z-10">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            style={{ y: y1, opacity: opacity1 }}
            className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/10 blur-[160px] rounded-full" 
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotateY: -30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, type: "spring", bounce: 0.4 }}
              className="w-20 h-20 bg-white/5 border border-white/20 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(255,255,255,0.1)] backdrop-blur-xl"
            >
              <Globe className="w-10 h-10 text-white/80" />
            </motion.div>

            <motion.span
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-primary/80 mb-6 block"
            >
              Our Manifesto
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, rotateX: 30, y: 100 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              transition={{ duration: 1.2, type: "spring", bounce: 0.3 }}
              className="font-display font-black text-[clamp(3.4rem,9.6vw,112px)] uppercase tracking-tighter leading-[0.82] mb-12 drop-shadow-2xl max-w-full"
            >
              Built for<br />
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-300 italic break-words">Main<br />Characters.</span>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                  className="absolute bottom-0 left-0 h-4 bg-primary/30 -z-10 blur-sm" 
                />
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="max-w-2xl space-y-8 text-xl sm:text-2xl text-white/60 font-medium leading-relaxed"
            >
              <p>
                Traditional banking apps made us feel like we were doing chores. Finance shouldn't be a spreadsheet — it should be a <strong className="text-white">multiplayer game</strong> where everyone wins.
              </p>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out" />
                <p className="text-primary font-black text-2xl sm:text-3xl relative z-10 drop-shadow-md">
                  Anxiety is not a vibe.<br/>Let's make money alive.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3D Stats Strip */}
      <section className="py-16 sm:py-20 relative z-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl border-y border-white/10" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 lg:gap-8 max-w-6xl mx-auto">
            {manifesto.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: "spring", bounce: 0.5 }}
                whileHover={{ scale: 1.1, translateY: -10 }}
                className="text-center p-5 lg:p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl relative group cursor-default min-w-0 overflow-hidden"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0 bg-primary/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                <div className="font-display font-black text-[clamp(2.1rem,4.6vw,3.75rem)] leading-[0.95] break-words text-primary mb-3 drop-shadow-[0_0_15px_rgba(198,255,0,0.5)]" style={{ transform: "translateZ(30px)" }}>{item.value}</div>
                <div className="text-sm font-black uppercase tracking-[0.2em] text-white/50" style={{ transform: "translateZ(20px)" }}>{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values 3D Bento */}
      <section className="py-24 sm:py-32 lg:py-40 relative z-10 perspective-1000">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-gradient-to-r from-purple-500/10 via-transparent to-primary/10 blur-[100px] pointer-events-none -z-10" />
        
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 20 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            className="mb-24 text-center"
          >
            <span className="text-xs sm:text-sm font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-white/40 mb-4 block">What we believe</span>
            <h2 className="font-display font-black text-[clamp(3.5rem,15vw,6rem)] md:text-8xl uppercase tracking-tighter leading-[0.95] drop-shadow-xl">Core <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/30">Values</span></h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50, rotateY: 30 }}
                  whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, type: "spring", bounce: 0.4 }}
                  whileHover={{ scale: 1.05, rotateX: 5, rotateY: -5, zIndex: 10 }}
                  className={`relative p-[1px] rounded-[2.5rem] overflow-hidden group`}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className={`h-full bg-[#0A0A1A]/90 backdrop-blur-xl rounded-[2.5rem] p-7 sm:p-10 border ${v.border} relative overflow-hidden`}>
                    <div className={`absolute -right-10 -top-10 w-40 h-40 ${v.bg} rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity`} />
                    
                    <div className={`w-14 h-14 rounded-2xl ${v.bg} border ${v.border} flex items-center justify-center mb-8 shadow-[0_0_20px_${v.shadow}] group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 h-7 ${v.accent}`} />
                    </div>
                    
                    <h3 className={`font-display font-black text-3xl mb-5 ${v.accent} drop-shadow-md`}>{v.title}</h3>
                    <p className="text-lg text-white/60 font-medium leading-relaxed">{v.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Download Epic Strip */}
      <section className="py-24 sm:py-32 lg:py-40 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", bounce: 0.6 }}
            className="w-32 h-32 mx-auto bg-primary rounded-full blur-[80px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"
          />
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display font-black text-[clamp(3rem,14vw,6rem)] md:text-8xl uppercase tracking-tighter leading-[0.95] mb-12 drop-shadow-2xl"
          >
            Get <span className="text-primary italic">Bodhi</span> today.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-3 h-16 px-10 text-lg font-black bg-white text-black hover:bg-gray-200 rounded-full transition-all w-full sm:w-auto shadow-2xl"
            >
              <FaApple className="h-7 w-7" /> App Store
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-3 h-16 px-10 text-lg font-black bg-black/50 backdrop-blur-xl text-white border border-white/20 hover:bg-white/10 rounded-full transition-all w-full sm:w-auto shadow-2xl"
            >
              <FaGooglePlay className="h-6 w-6" /> Google Play
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
