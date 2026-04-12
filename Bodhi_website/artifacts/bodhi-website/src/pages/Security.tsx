import { HolographicBackground } from "@/components/ui/holographic-background";
import { motion } from "framer-motion";
import { Shield, Lock, Fingerprint } from "lucide-react";

export default function Security() {
  return (
    <div className="min-h-screen pt-32 pb-24 text-white relative">
      <HolographicBackground />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center mb-24"
        >
          <Shield className="w-20 h-20 text-primary mx-auto mb-8" />
          <h1 className="font-display font-black text-6xl md:text-8xl uppercase mb-8">
            Bank-Grade<br/>Security
          </h1>
          <p className="text-2xl text-white/70">
            Your money is alive, but it's also locked down. We use military-grade encryption to keep your funds and data safe.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { icon: Lock, title: "256-bit Encryption", desc: "Your data is encrypted in transit and at rest." },
            { icon: Fingerprint, title: "Biometric Auth", desc: "FaceID and TouchID supported out of the box." },
            { icon: Shield, title: "FDIC Insured", desc: "Funds are insured up to $250,000 through our partner banks." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md text-center"
            >
              <item.icon className="w-12 h-12 text-primary mx-auto mb-6" />
              <h3 className="font-bold text-2xl mb-4">{item.title}</h3>
              <p className="text-white/70">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
