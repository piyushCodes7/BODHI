import { HolographicBackground } from "@/components/ui/holographic-background";
import { motion } from "framer-motion";

export default function Product() {
  return (
    <div className="min-h-screen pt-32 pb-24 text-white relative">
      <HolographicBackground />
      <div className="container mx-auto px-6 relative z-10">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-black text-6xl md:text-8xl uppercase mb-8"
        >
          The Product
        </motion.h1>
        <p className="text-2xl text-white/70 max-w-3xl mb-16">
          Bodhi isn't just a tracking app. It's a living ecosystem for your finances.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { title: "Social Saving", desc: "Pool money with friends for shared goals." },
            { title: "AI Pulse", desc: "Real-time insights on your spending habits." },
            { title: "Venture Clubs", desc: "Access startup investments as a community." },
            { title: "Collab Trips", desc: "Manage group expenses seamlessly." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors"
            >
              <h3 className="font-display font-bold text-3xl mb-4 text-primary">{feature.title}</h3>
              <p className="text-xl text-white/70">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
