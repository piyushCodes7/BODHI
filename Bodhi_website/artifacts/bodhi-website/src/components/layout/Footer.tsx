import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-black/50 border-t border-white/10 pt-24 pb-12 px-6 lg:px-12 mt-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-secondary/30 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
          <div className="md:col-span-2">
            <h2 className="font-display font-black text-4xl mb-4 text-white">BODHI</h2>
            <p className="text-white/60 text-lg max-w-sm mb-8 font-medium">
              Bodhi: Make Your Money Alive.
            </p>
            <p className="text-white/40 max-w-sm">
              Stop Doom-Scrolling, Start Doom-Investing. Because Anxiety Is Not A Vibe.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-6">Explore</h3>
            <ul className="space-y-4">
              <li><Link href="/" className="text-white/60 hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/product" className="text-white/60 hover:text-primary transition-colors">Product</Link></li>
              <li><Link href="/security" className="text-white/60 hover:text-primary transition-colors">Security</Link></li>
              <li><Link href="/about" className="text-white/60 hover:text-primary transition-colors">About Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-white mb-6">Legal</h3>
            <ul className="space-y-4">
              <li><a href="#" className="text-white/60 hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-white/60 hover:text-primary transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-white/40 text-sm">
          <p>© {new Date().getFullYear()} Bodhi Financial. All rights reserved.</p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">TikTok</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
