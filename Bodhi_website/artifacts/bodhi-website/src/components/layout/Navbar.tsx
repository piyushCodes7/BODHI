import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();

  const links = [
    { href: "/product", label: "Product" },
    { href: "/security", label: "Security" },
    { href: "/about", label: "About Us" },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-background/50 border-b border-white/5"
    >
      <div className="flex items-center gap-12">
        <Link href="/" className="font-display font-black text-2xl tracking-tighter text-white">
          BODHI
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location === link.href ? "text-primary" : "text-white/70"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" className="hidden md:inline-flex border-white/20 text-white hover:bg-white/10">
          Log In
        </Button>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
          Get the App
        </Button>
      </div>
    </motion.nav>
  );
}
