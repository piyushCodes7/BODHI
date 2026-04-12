import { HolographicBackground } from "@/components/ui/holographic-background";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="min-h-screen pt-32 pb-24 text-white relative">
      <HolographicBackground />
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl"
        >
          <h1 className="font-display font-black text-6xl md:text-8xl uppercase mb-8">
            About Bodhi
          </h1>
          <div className="prose prose-invert prose-lg">
            <p className="text-2xl text-white/90 leading-relaxed font-medium mb-8">
              We built Bodhi because traditional banking apps made us feel like we were doing chores. 
              Finance shouldn't be a spreadsheet—it should be a multiplayer game where everyone wins.
            </p>
            <p className="text-white/70 text-xl">
              Bodhi was founded in 2024 by a team of designers and engineers who wanted to bring 
              main-character energy to personal finance. We believe that when you manage money with 
              your friends, you make better decisions and build real wealth.
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-24 p-12 rounded-[3rem] bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 backdrop-blur-xl"
        >
          <h2 className="font-display font-black text-4xl mb-6">Join the Movement</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl">
            We're always looking for ambitious engineers, designers, and growth hackers to join our team.
          </p>
          <a href="mailto:careers@bodhi.app" className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-white text-black font-bold text-lg hover:bg-white/90 transition-colors">
            View Open Roles
          </a>
        </motion.div>
      </div>
    </div>
  );
}
