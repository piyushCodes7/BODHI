import { Link } from "wouter";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="relative bg-[#0A0A1A] pt-24 sm:pt-32 pb-10 sm:pb-12 overflow-hidden border-t border-white/5">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/20 blur-[150px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 sm:gap-16 mb-20 sm:mb-32">
          <div className="md:col-span-6">
            <h2 className="font-display font-black text-[clamp(3.25rem,14vw,4.5rem)] md:text-7xl leading-[0.95] mb-6 text-white uppercase tracking-tighter">
              Get Bodhi.
            </h2>
            <p className="text-lg sm:text-xl text-white/60 mb-10 max-w-md">
              Social gains. Serious wealth. Stop doom-scrolling, start doom-investing. Because anxiety is not a vibe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="h-16 px-8 text-lg font-bold bg-primary text-black hover:bg-primary/90 rounded-2xl w-full sm:w-auto shadow-[0_0_30px_rgba(198,255,0,0.3)]">
                <FaApple className="mr-3 h-7 w-7" /> App Store
              </Button>
              <Button size="lg" className="h-16 px-8 text-lg font-bold bg-white/5 text-white hover:bg-white/10 border border-white/10 rounded-2xl w-full sm:w-auto backdrop-blur-sm">
                <FaGooglePlay className="mr-3 h-6 w-6" /> Google Play
              </Button>
            </div>
          </div>
          
          <div className="md:col-span-3">
            <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Explore</h3>
            <ul className="space-y-4">
              <li><Link href="/" className="text-white/60 hover:text-primary transition-colors font-medium">Home</Link></li>
              <li><Link href="/product" className="text-white/60 hover:text-primary transition-colors font-medium">Product</Link></li>
              <li><Link href="/security" className="text-white/60 hover:text-primary transition-colors font-medium">Security</Link></li>
              <li><Link href="/about" className="text-white/60 hover:text-primary transition-colors font-medium">About Us</Link></li>
            </ul>
          </div>
          
          <div className="md:col-span-3">
            <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Legal</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-white/60 hover:text-primary transition-colors font-medium">Terms of Service</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary transition-colors font-medium">Privacy Policy</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary transition-colors font-medium">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-white/40 text-sm font-medium">
          <p>© {new Date().getFullYear()} Bodhi Financial. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 mt-6 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors uppercase tracking-wider text-xs font-bold">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors uppercase tracking-wider text-xs font-bold">Instagram</a>
            <a href="#" className="hover:text-primary transition-colors uppercase tracking-wider text-xs font-bold">TikTok</a>
          </div>
        </div>
      </div>
      
      {/* Massive Background Text */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full overflow-hidden pointer-events-none select-none z-0 flex justify-center">
        <span className="font-display font-black text-[25vw] leading-none text-white/[0.02] whitespace-nowrap tracking-tighter">
          BODHI
        </span>
      </div>
    </footer>
  );
}
