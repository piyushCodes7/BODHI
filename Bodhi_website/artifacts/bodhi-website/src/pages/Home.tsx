import { motion, useScroll, useTransform } from "framer-motion";
import { HolographicBackground } from "@/components/ui/holographic-background";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { Button } from "@/components/ui/button";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import { ArrowRight, Users, Activity, Plane, Zap } from "lucide-react";
import { useRef, type CSSProperties } from "react";

function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[
        { symbol: "₹", x: "10%", y: "20%", duration: "8s",  delay: "0s" },
        { symbol: "$", x: "85%", y: "15%", duration: "9s",  delay: "-3s" },
        { symbol: "%", x: "80%", y: "70%", duration: "10s", delay: "-5s" },
        { symbol: "€", x: "15%", y: "80%", duration: "8s",  delay: "-1.5s" },
      ].map((el, i) => (
        <div
          key={i}
          className="float-symbol absolute text-5xl md:text-7xl font-black text-white/10 font-display"
          style={{
            left: el.x,
            top: el.y,
            "--float-duration": el.duration,
            "--float-delay": el.delay,
          } as CSSProperties}
        >
          {el.symbol}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen relative text-white">
      <HolographicBackground />

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center justify-center pt-20 overflow-hidden">
        <FloatingElements />
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium tracking-wide uppercase">Main Character Money. Activated.</span>
          </motion.div>

          <motion.h1 
            className="font-display font-black text-6xl md:text-8xl lg:text-[140px] leading-[0.85] tracking-tighter mb-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            YOUR MONEY.<br />
            <span className="text-primary italic inline-block mt-2">ALIVE!</span>
          </motion.h1>

          <motion.p 
            className="text-xl md:text-2xl text-white/70 max-w-2xl font-medium mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Financial anxiety is dead. Make your money fun, social, and alive with Bodhi.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button size="lg" className="h-14 px-8 text-lg font-bold bg-white text-black hover:bg-white/90 rounded-2xl w-full sm:w-auto">
              <FaApple className="mr-2 h-6 w-6" /> App Store
            </Button>
            <Button size="lg" className="h-14 px-8 text-lg font-bold bg-white/10 text-white border border-white/20 hover:bg-white/20 rounded-2xl w-full sm:w-auto backdrop-blur-md">
              <FaGooglePlay className="mr-2 h-5 w-5" /> Google Play
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature 1: Social Saving */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mb-8 border border-secondary/50">
                <Users className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h2 className="font-display font-black text-5xl md:text-6xl mb-6">SOCIAL SAVING.<br/>POOLED POWER.</h2>
              <p className="text-xl text-white/70 mb-8">
                Group savings funds. Goal-based pooled money with friends. Your squad, your stakes.
              </p>
              <ul className="space-y-4 mb-8">
                {['Create shared vaults instantly', 'Track everyone\'s contributions', 'Celebrate goals together'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-lg">
                    <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <div className="flex justify-center">
              <PhoneMockup>
                <div className="p-6 h-full flex flex-col pt-12">
                  <h3 className="font-bold text-2xl mb-6">Squad Vault</h3>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4 backdrop-blur-md">
                    <div className="text-white/60 text-sm mb-1">Total Pooled</div>
                    <div className="text-4xl font-display font-bold text-primary">$4,500</div>
                    <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-3/4 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-3 mt-4">
                    {[
                      { name: "Alex", amount: "$1,500", color: "bg-blue-500" },
                      { name: "Jordan", amount: "$2,000", color: "bg-purple-500" },
                      { name: "You", amount: "$1,000", color: "bg-primary text-black" },
                    ].map((user, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${user.color} flex items-center justify-center font-bold text-xs`}>
                            {user.name[0]}
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                        <span className="font-bold">{user.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee — CSS-driven for zero JS overhead */}
      <div className="w-full overflow-hidden py-12 bg-primary text-black transform -rotate-2 scale-105 relative z-20">
        <div className="marquee-track">
          {[...Array(20)].map((_, i) => (
            <span key={i} className="font-display font-black text-4xl px-8 uppercase flex items-center gap-8">
              Zero Drama. All Profit. <span className="w-4 h-4 rounded-full bg-black flex-shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {/* Feature 2: AI Insights */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="flex justify-center order-2 md:order-1">
              <PhoneMockup>
                <div className="p-6 h-full flex flex-col pt-12">
                  <h3 className="font-bold text-2xl mb-6">Financial Pulse</h3>
                  <div className="flex-1 flex flex-col items-center justify-center relative">
                    {/* Heartbeat pulse animation */}
                    <div className="absolute w-48 h-48 bg-accent/20 rounded-full animate-ping" />
                    <div className="absolute w-32 h-32 bg-accent/40 rounded-full animate-pulse" />
                    <div className="relative z-10 w-24 h-24 bg-accent rounded-full flex items-center justify-center border-4 border-black shadow-[0_0_50px_rgba(255,0,128,0.5)]">
                      <Activity className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md mt-auto">
                    <p className="text-lg font-medium text-white mb-2">"You're spending 20% less on dining this week. Solid."</p>
                    <p className="text-sm text-accent font-bold">Bodhi AI Insight</p>
                  </div>
                </div>
              </PhoneMockup>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="order-1 md:order-2"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mb-8 border border-accent/50">
                <Activity className="w-8 h-8 text-accent" />
              </div>
              <h2 className="font-display font-black text-5xl md:text-6xl mb-6">AI INSIGHTS.<br/>YOUR PULSE.</h2>
              <p className="text-xl text-white/70 mb-8">
                AI-powered financial health. Real-time insights that feel like advice from a hyper-competent friend.
              </p>
              <Button variant="outline" className="rounded-full border-white/20 hover:bg-white/10 group">
                Meet Bodhi AI <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature 3: Collab Trips & Venture */}
      <section className="py-32 relative z-10 bg-black/40 backdrop-blur-xl border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="font-display font-black text-5xl md:text-7xl mb-6 uppercase">Investing. Evolved.</h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">Because playing solo is boring. Build wealth and memories with your people.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group hover:bg-white/10 transition-colors"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full group-hover:bg-blue-500/30 transition-colors" />
              <Plane className="w-12 h-12 text-blue-400 mb-8" />
              <h3 className="font-display font-black text-3xl mb-4">Collab Trips</h3>
              <p className="text-white/70 text-lg mb-8">Group trip expenses and collaborative spending tracking. Split costs without ruining the group chat.</p>
              <div className="h-48 rounded-2xl bg-black/50 border border-white/10 p-6 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold">Tokyo 2025</span>
                  <span className="text-blue-400 font-bold">Active</span>
                </div>
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-black" />
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group hover:bg-white/10 transition-colors"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-colors" />
              <Zap className="w-12 h-12 text-primary mb-8" />
              <h3 className="font-display font-black text-3xl mb-4">Venture Clubs</h3>
              <p className="text-white/70 text-lg mb-8">Community investment clubs. Access seed funding pools usually reserved for the 1%.</p>
              <div className="h-48 rounded-2xl bg-black/50 border border-white/10 p-6 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold">Alpha Syndicate</span>
                  <span className="text-primary font-bold">+24.5%</span>
                </div>
                <div className="w-full h-16 bg-white/5 rounded-lg flex items-end overflow-hidden">
                  <div className="w-1/4 h-[30%] bg-primary/40 border-t border-primary" />
                  <div className="w-1/4 h-[50%] bg-primary/60 border-t border-primary" />
                  <div className="w-1/4 h-[40%] bg-primary/80 border-t border-primary" />
                  <div className="w-1/4 h-[90%] bg-primary border-t border-primary" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="font-display font-black text-6xl md:text-8xl lg:text-9xl tracking-tighter mb-8 uppercase"
          >
            Get Bodhi.
          </motion.h2>
          <p className="text-2xl text-white/80 font-medium mb-12 max-w-2xl mx-auto">
            Social gains. Serious wealth. Join the waitlist or download now.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" className="h-16 px-10 text-xl font-bold bg-primary text-black hover:bg-primary/90 rounded-2xl w-full sm:w-auto shadow-[0_0_40px_rgba(198,255,0,0.4)]">
              <FaApple className="mr-3 h-7 w-7" /> Download iOS
            </Button>
            <Button size="lg" className="h-16 px-10 text-xl font-bold bg-white text-black hover:bg-white/90 rounded-2xl w-full sm:w-auto">
              <FaGooglePlay className="mr-3 h-6 w-6" /> Download Android
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
