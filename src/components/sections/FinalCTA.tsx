import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";

const VP = { once: false, amount: 0 } as const;

const PARTICLES = [
  { x: "12%", y: "18%", size: 3,   delay: 0    },
  { x: "88%", y: "14%", size: 2,   delay: 0.8  },
  { x: "24%", y: "72%", size: 2.5, delay: 1.6  },
  { x: "76%", y: "68%", size: 3,   delay: 0.4  },
  { x: "50%", y: "88%", size: 2,   delay: 1.2  },
  { x: "6%",  y: "50%", size: 1.5, delay: 2    },
  { x: "94%", y: "42%", size: 1.5, delay: 0.6  },
  { x: "38%", y: "10%", size: 2,   delay: 1.8  },
  { x: "62%", y: "82%", size: 2.5, delay: 0.2  },
];

function SplitHeading() {
  const line1 = "Your next 1,000 LinkedIn followers".split(" ");
  const line2 = "are closer than you think.".split(" ");

  return (
    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 leading-[1.06]">
      <span className="inline-flex flex-wrap justify-center gap-x-[0.3em] mb-1">
        {line1.map((word, i) => (
          <span key={i} className="overflow-hidden inline-block leading-tight">
            <motion.span className="inline-block text-white"
              initial={{ y: "115%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={VP}
              transition={{ duration: 0.65, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
      {" "}
      <span className="inline-flex flex-wrap justify-center gap-x-[0.3em]">
        {line2.map((word, i) => (
          <span key={i} className="overflow-hidden inline-block leading-tight">
            <motion.span
              className="inline-block animate-shimmer bg-gradient-to-r from-white via-[#a0c8ff] to-white bg-clip-text text-transparent"
              initial={{ y: "115%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={VP}
              transition={{ duration: 0.65, delay: 0.6 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    </h2>
  );
}

export function FinalCTA() {
  return (
    <section className="py-16 px-4 bg-[#0a66c2] relative overflow-hidden border-y border-[#0057ab]">
      {/* Spotlight Effects */}
      <motion.div
        className="absolute left-40 -top-40 w-[80vw] h-screen rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-40 top-20 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_600px_350px_at_50%_50%,rgba(255,255,255,0.07),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_400px_250px_at_30%_70%,rgba(255,255,255,0.04),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#004182] via-transparent to-[#0a66c2]/80 pointer-events-none" />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <motion.div key={i}
          className="absolute rounded-full bg-white/20 pointer-events-none"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={VP}
          transition={{ duration: 0.5, delay: p.delay * 0.5, ease: "backOut" }}
          animate={{ y: [0, -14, 0], opacity: [0.25, 0.7, 0.25] }}
        />
      ))}

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70 mb-2"
          initial={{ opacity: 0, y: -24, scale: 0.85 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={VP}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          The final step
        </motion.p>

        <SplitHeading />

        <motion.p
          className="text-2xl md:text-3xl font-bold text-white mb-4 mt-3 mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.55, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          Never Miss a LinkedIn Post Again
        </motion.p>

        <motion.p className="text-base text-white/70 mb-6 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={VP}
          transition={{ duration: 0.65, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Join 2,400+ creators who stopped struggling to post consistently and started growing —
          by spending less than 2 hours a week on LinkedIn.
        </motion.p>

        <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3"
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={VP}
          transition={{ duration: 0.6, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/signup">
            <Button size="lg"
              className="w-full sm:w-auto h-12 px-8 text-base bg-white text-[#0a66c2] hover:bg-white/95 border-0
                         font-bold shadow-[0_0_40px_rgba(255,255,255,0.20)] hover:shadow-[0_0_56px_rgba(255,255,255,0.30)]
                         transition-all duration-200"
            >
              Start Growing Free <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline"
              className="w-full sm:w-auto h-12 px-8 text-base border-2 border-white bg-transparent text-white
                         hover:bg-white/15 hover:border-white transition-all duration-200 font-semibold"
            >
              <Calendar className="mr-2 w-4 h-4" /> Book a Demo
            </Button>
          </Link>
        </motion.div>

        <motion.p className="mt-4 text-sm text-white/40"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={VP} transition={{ delay: 1.1 }}
        >
          14-day free trial · No credit card · Takes 2 minutes · Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}
