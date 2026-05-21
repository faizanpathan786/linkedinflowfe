import { motion } from "framer-motion";
import { Star, Briefcase, Globe, Zap, Database, Shield, Code2, Building2, Cpu } from "lucide-react";

const VP = { once: false, amount: 0 } as const;

function WordReveal({ text, className = "", baseDelay = 0 }: { text: string; className?: string; baseDelay?: number }) {
  const words = text.split(" ");
  return (
    <span className={`${className} inline-flex flex-wrap gap-x-[0.3em]`}>
      {words.map((word, i) => (
        <span key={i} className="overflow-hidden inline-block leading-tight">
          <motion.span
            className="inline-block"
            initial={{ y: "115%", opacity: 0 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={VP}
            transition={{ duration: 0.6, delay: baseDelay + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

const BRANDS = [
  { name: "TechCorp",   Icon: Building2 },
  { name: "DevShield",  Icon: Shield    },
  { name: "CloudBase",  Icon: Database  },
  { name: "CodeFlow",   Icon: Code2     },
  { name: "NexaGlobe",  Icon: Globe     },
  { name: "SparkLabs",  Icon: Zap       },
  { name: "CoreStack",  Icon: Cpu       },
  { name: "WorkBridge", Icon: Briefcase },
];

const TESTIMONIALS = [
  {
    name: "Sarah Jenkins", role: "Founder & CEO", initials: "SJ",
    color: "from-violet-500/20 to-purple-500/10",
    flipDir: -1,
    quote: "I went from posting once a month to every day, without spending more time. In 6 weeks my follower count doubled and I closed 2 inbound deals directly from LinkedIn.",
  },
  {
    name: "Marcus Wei", role: "Growth Marketer", initials: "MW",
    color: "from-blue-500/20 to-cyan-500/10",
    flipDir: 0,
    quote: "The analytics told me carousels outperform text posts 3x on my profile. I doubled down and hit 400% reach growth in one month. I don't guess anymore, I just look at the data.",
  },
  {
    name: "Elena Rodriguez", role: "B2B Sales Leader", initials: "ER",
    color: "from-[#0a66c2]/20 to-[#2d7fda]/10",
    flipDir: 1,
    quote: "My sales team all post consistently now without me chasing them. One dashboard, everyone on brand, zero chaos. Our LinkedIn pipeline went from nothing to 30% of new business.",
  },
];

export function SocialProof() {
  const doubled = [...BRANDS, ...BRANDS];

  return (
    <section className="py-20 bg-[#eef3f8] border-y border-[#dce6f1] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">

        <motion.p
          className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#86888a] mb-8"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Join 2,000+ professionals already growing on autopilot
        </motion.p>

        {/* Logo marquee */}
        <motion.div
          className="relative overflow-hidden mb-20"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={VP}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute left-0 top-0 bottom-0 w-28 bg-gradient-to-r from-[#eef3f8] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-28 bg-gradient-to-l from-[#eef3f8] to-transparent z-10 pointer-events-none" />
          <div className="flex gap-10 animate-marquee-slow w-max">
            {doubled.map(({ name, Icon }, i) => (
              <div key={i}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[#dce6f1] bg-white
                           text-[#595959] hover:text-[#0a66c2] hover:border-[#0a66c2]/25 hover:shadow-sm transition-all duration-200 select-none shrink-0"
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Section heading */}
        <div className="text-center mb-14">
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a66c2] mb-3"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={VP} transition={{ duration: 0.5 }}
          >
            Real professionals. Real results.
          </motion.p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight">
            <WordReveal text="People like you, growing faster than ever" baseDelay={0.1} />
          </h2>
        </div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-6" style={{ perspective: "1200px" }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, rotateY: t.flipDir * 45, y: 50, scale: 0.9, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, rotateY: 0, y: 0, scale: 1, filter: "blur(0px)" }}
              viewport={VP}
              transition={{ duration: 0.75, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
              className="relative overflow-hidden rounded-2xl border border-[#e0dfdc]
                         bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] group"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0a66c2]/20 to-transparent" />
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#0a66c2]/6 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />

              <div className="flex gap-1 mb-5">
                {[0,1,2,3,4].map(s => <Star key={s} className="w-3.5 h-3.5 fill-[#0a66c2] text-[#0a66c2]" />)}
              </div>
              <div className="absolute top-5 right-5 text-5xl font-serif leading-none text-[#0a66c2]/[0.06] select-none pointer-events-none">"</div>
              <p className="text-[#595959] leading-relaxed mb-6 text-[0.93rem]">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-5 border-t border-[#e0dfdc]">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center font-bold text-sm text-[#191919] shrink-0`}>
                  {t.initials}
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#191919]">{t.name}</div>
                  <div className="text-xs text-[#86888a]">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
