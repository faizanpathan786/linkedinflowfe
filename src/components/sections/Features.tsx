import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import { Sparkles, Layers, Lock } from "lucide-react";

const FEATURES = [
  {
    icon: <Sparkles className="w-5 h-5 text-[#0a66c2]" />,
    title: "AI that writes in your voice, not a robot's",
    description: "Capture a raw thought. LinkedInFlow turns it into a scroll-stopping post that sounds like you, not a template. No blank screen. No writer's block. Ever.",
  },
  {
    icon: <Layers className="w-5 h-5 text-[#0a66c2]" />,
    title: "From idea to published in under 5 minutes",
    description: "Capture ideas, draft with AI, schedule to your calendar, and publish, all in one place. Your content pipeline finally runs itself.",
  },
  {
    icon: <Lock className="w-5 h-5 text-[#0a66c2]" />,
    title: "Built on LinkedIn's official API. Always safe.",
    description: "One-click OAuth connection. Zero passwords stored. Zero risk of account bans. We play by LinkedIn's rules so your profile stays protected.",
  },
];

const ENTRY_X = [-90, 0, 90];
const ENTRY_Y = [-20, -70, -20];

interface CardProps {
  feature: (typeof FEATURES)[number];
  index: number;
  isActive: boolean;
  onActivate: () => void;
  reduceMotion: boolean | null;
}

function FeatureCard({ feature, index, isActive, onActivate, reduceMotion }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.25 });

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-14, 14]), { stiffness: 350, damping: 28 });
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [12, -12]), { stiffness: 350, damping: 28 });

  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const [swept, setSwept] = useState(false);

  const col = index % 3;
  const _entryX = ENTRY_X[col];
  const _entryY = ENTRY_Y[col];
  const delay = index * 0.11;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rawX.set(x);
    rawY.set(y);
    setGlow({ x: (x + 0.5) * 100, y: (y + 0.5) * 100 });
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
    setGlow({ x: 50, y: 50 });
  }

  return (
    <div style={{ perspective: "900px" }} onMouseEnter={onActivate}>
      <motion.div
        ref={ref}
        style={reduceMotion ? {} : { rotateX, rotateY }}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.92, filter: "blur(8px)" }}
        animate={isInView ? { opacity: 1, scale: 1, filter: "blur(0px)" } : {}}
        transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative overflow-hidden rounded-2xl border border-[#e0dfdc]
                   bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] cursor-default h-full
                   hover:shadow-[0_8px_32px_rgba(10,102,194,0.10)] transition-shadow duration-300"
      >
        {/* Active top-edge glow line */}
        <motion.div
          className="absolute inset-x-0 top-0 h-px pointer-events-none"
          animate={{
            background: isActive
              ? "linear-gradient(90deg,transparent,rgba(10,102,194,0.7),transparent)"
              : "linear-gradient(90deg,transparent,rgba(224,223,220,0.8),transparent)",
            opacity: isActive ? 1 : 0.8,
          }}
          transition={{ duration: 0.45 }}
        />

        {/* Corner orb when active */}
        <motion.div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#0a66c2]/8 blur-3xl pointer-events-none"
          animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1.3 : 0.7 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Mouse-follow specular */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(380px circle at ${glow.x}% ${glow.y}%, rgba(10,102,194,0.06), transparent 65%)`,
          }}
        />

        {/* Shimmer sweep on scroll entry */}
        <AnimatePresence>
          {isInView && !swept && (
            <motion.div
              key="sweep"
              className="pointer-events-none absolute inset-y-0 w-28 z-10
                         bg-linear-to-r from-transparent via-[#0a66c2]/4 to-transparent skew-x-18"
              initial={{ x: "-140%" }}
              animate={{ x: "220%" }}
              exit={{}}
              transition={{ duration: 0.75, delay: delay + 0.22, ease: "easeOut" }}
              onAnimationComplete={() => setSwept(true)}
            />
          )}
        </AnimatePresence>

        {/* Icon box */}
        <motion.div
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl
                     border border-[#0a66c2]/20 bg-[#eef3f8] shrink-0"
          animate={
            isActive && !reduceMotion
              ? { scale: [1, 1.18, 0.95, 1.05, 1], rotate: [0, -10, 8, -4, 0] }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {feature.icon}
        </motion.div>

        <h3 className="text-base font-bold text-[#191919] mb-2 leading-snug
                       group-hover:text-[#0a66c2] transition-colors duration-300">
          {feature.title}
        </h3>
        <p className="text-sm text-[#595959] leading-relaxed">
          {feature.description}
        </p>

        {/* Bottom accent bar */}
        <motion.div
          className="mt-5 h-px rounded-full bg-linear-to-r from-[#0a66c2] to-[#5aa6f6]"
          animate={{ scaleX: isActive ? 1 : 0.25, opacity: isActive ? 1 : 0.2 }}
          style={{ transformOrigin: "left" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>
    </div>
  );
}

export function Features() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setActiveIndex((c) => (c + 1) % FEATURES.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <section id="features" className="relative overflow-hidden py-24 px-4 bg-[#eef3f8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(10,102,194,0.05)_0%,transparent_50%)]" />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-[#0a66c2]/6 blur-3xl"
        animate={{ y: [0, -16, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#0a66c2]/5 blur-3xl"
        animate={{ y: [0, 18, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: -18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0a66c2] mb-4">Why LinkedInFlow</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-[#191919]">
            Everything you need to own LinkedIn.
          </h2>
          <p className="text-lg text-[#595959]">
            Built for founders who know LinkedIn works but don't have 2 hours a day to prove it.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard
              key={i}
              feature={f}
              index={i}
              isActive={activeIndex === i}
              onActivate={() => setActiveIndex(i)}
              reduceMotion={reduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
