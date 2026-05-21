import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/auth/AuthIllustration";

const NAV_LINKS = [
  { label: "Features",     href: "#features"      },
  { label: "How it works", href: "#how-it-works"  },
  { label: "Early Access", href: "#early-access"  },
  { label: "Contact Us",   href: "#contact"       },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(100, (window.scrollY / docHeight) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/92 backdrop-blur-xl border-b border-[#e0dfdc] shadow-[0_1px_20px_rgba(0,0,0,0.08)]"
          : "bg-transparent border-b border-transparent"
      }`}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg select-none group">
          <motion.div
            whileHover={{ scale: 1.1, rotate: -5 }}
            transition={{ type: "spring", stiffness: 380, damping: 14 }}
            className="shrink-0"
          >
            <BrandMark />
          </motion.div>
          <span className="text-[#191919] group-hover:text-[#0a66c2] transition-colors duration-200">
            LinkedInFlow
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-[#595959] hover:text-[#191919] transition-colors duration-200 py-1 group"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 h-px w-0 bg-[#0a66c2] group-hover:w-full transition-all duration-300 ease-out rounded-full" />
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button
              variant="ghost"
              className="hidden sm:inline-flex h-9 text-sm text-[#595959] hover:text-[#191919] hover:bg-[#f3f2ee]"
            >
              Sign In
            </Button>
          </Link>
          <a href="#early-access">
            <Button
              className="h-9 px-5 text-sm bg-[#0a66c2] text-white hover:bg-[#004182] border-0
                         shadow-[0_0_18px_rgba(10,102,194,0.20)] hover:shadow-[0_0_28px_rgba(10,102,194,0.35)]
                         transition-all duration-200 font-semibold"
            >
              Get Early Access
            </Button>
          </a>
        </div>
      </div>

      {/* Scroll progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-transparent">
        <motion.div
          className="h-full bg-gradient-to-r from-[#0a66c2] via-[#0073b1] to-[#00a0dc]"
          style={{ width: `${scrollProgress}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>
    </motion.nav>
  );
}
