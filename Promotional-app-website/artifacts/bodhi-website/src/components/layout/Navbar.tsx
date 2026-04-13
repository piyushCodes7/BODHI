import { useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();

  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.96]);
  const blur = useTransform(scrollY, [0, 80], [0, 20]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 0.12]);
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const backgroundColor = useMotionTemplate`rgba(10, 10, 26, ${bgOpacity})`;
  const backdropFilter = useMotionTemplate`blur(${blur}px)`;
  const borderColor = useMotionTemplate`rgba(255, 255, 255, ${borderOpacity})`;

  const links = [
    { href: "/product", label: "Product" },
    { href: "/security", label: "Security" },
    { href: "/about", label: "About Us" },
  ];

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-primary z-[60] origin-left"
        style={{ scaleX }}
      />

      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-[2px] left-0 right-0 z-50 px-4 sm:px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor,
          backdropFilter,
          WebkitBackdropFilter: backdropFilter as any,
          borderBottom: `1px solid`,
          borderBottomColor: borderColor as any,
        }}
      >
        <div className="flex items-center gap-10 min-w-0">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(198,255,0,1)]"
            />
            <span className="font-display font-black text-2xl tracking-tighter text-white">
              BODHI
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-primary ${
                  location === link.href ? "text-primary" : "text-white/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            className="hidden md:inline-flex border-white/15 text-white/80 hover:bg-white/8 hover:border-white/25 hover:text-white transition-all font-bold text-sm"
          >
            Log In
          </Button>
          <Button className="bg-primary text-black hover:bg-primary/90 font-black shadow-[0_0_20px_rgba(198,255,0,0.4)] hover:shadow-[0_0_35px_rgba(198,255,0,0.7)] transition-all text-xs sm:text-sm px-3 sm:px-5">
            Get the App
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden border-white/15 text-white/80 hover:bg-white/8 hover:border-white/25 hover:text-white transition-all"
            onClick={() => setIsOpen((open) => !open)}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </motion.nav>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[74px] left-4 right-4 z-40 md:hidden rounded-[1.5rem] border border-white/10 bg-[#0A0A1A]/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <div className="flex flex-col gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-wider transition-colors hover:bg-white/8 hover:text-primary ${
                    location === link.href ? "bg-primary/10 text-primary" : "text-white/70"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Button
                variant="outline"
                className="mt-2 border-white/15 text-white/80 hover:bg-white/8 hover:border-white/25 hover:text-white transition-all font-bold text-sm"
              >
                Log In
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
