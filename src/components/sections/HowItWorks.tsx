import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link2, PenTool, BarChart3 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const steps = [
  {
    icon: <Link2 className="w-7 h-7 text-[#0a66c2]" />,
    label: "Step 1",
    title: "Link your account",
    description: "One-click OAuth. 60 seconds flat. Your LinkedIn is connected, no passwords stored, no risk, no IT required.",
  },
  {
    icon: <PenTool className="w-7 h-7 text-[#0a66c2]" />,
    label: "Step 2",
    title: "Schedule once, post forever",
    description: "Use AI to draft, your calendar to schedule, and LinkedInFlow to handle the rest. Batch a whole month in one sitting.",
  },
  {
    icon: <BarChart3 className="w-7 h-7 text-[#0a66c2]" />,
    label: "Step 3",
    title: "Grow while you sleep",
    description: "We publish at peak engagement times and show you exactly which posts drive followers so you do more of what works.",
  },
];

const INTERVAL_MS = 3500;
const VP = { once: false, amount: 0 } as const;

const cardVariants = {
  enter:  { opacity: 0, scale: 0.96, filter: "blur(8px)"  },
  center: { opacity: 1, scale: 1,    filter: "blur(0px)"  },
  exit:   { opacity: 0, scale: 0.97, filter: "blur(6px)"  },
};

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const { actualTheme } = useTheme();
  const isDark = actualTheme === "dark";

  useEffect(() => {
    const id = setInterval(() => setActive(p => (p + 1) % steps.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="how-it-works" className="py-24 px-4 bg-[#eef3f8]">
      <div className="max-w-7xl mx-auto">

        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a66c2] mb-3"
            initial={{ opacity: 0, y: -18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={VP} transition={{ duration: 0.5, delay: 0.1 }}
          >
            How it works
          </motion.p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-[#191919]">Up and running in 3 steps</h2>
          <p className="text-lg text-[#595959]">From zero to posting consistently, in less time than your morning coffee.</p>
        </motion.div>

        {/* Step pills */}
        <div className="grid md:grid-cols-3 gap-6 relative mb-16">
          <div className="hidden md:block absolute top-6 left-[18%] right-[18%] h-px bg-[#dce6f1] z-0" />

          {steps.map((step, i) => (
            <motion.button
              key={i}
              onClick={() => setActive(i)}
              className="relative z-10 flex flex-col items-center text-center focus:outline-none group"
              initial={{ opacity: 0, y: -18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VP}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                animate={{
                  borderColor: active === i ? "#0a66c2" : (isDark ? "#2a2a2d" : "#e0dfdc"),
                  boxShadow: active === i ? "0 0 0 4px rgba(10,102,194,0.12)" : "none",
                  backgroundColor: active === i ? (isDark ? "#1b2230" : "#eef3f8") : (isDark ? "#1a1a1c" : "#ffffff"),
                }}
                transition={{ duration: 0.35 }}
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center mb-3 relative"
              >
                <motion.span animate={{ opacity: active === i ? 1 : 0.4 }} transition={{ duration: 0.3 }}>
                  {step.icon}
                </motion.span>
                <motion.div
                  animate={{
                    backgroundColor: active === i ? "#0a66c2" : (isDark ? "#2a2a2d" : "#dce6f1"),
                    color: active === i ? "#ffffff" : (isDark ? "#8a8a8d" : "#86888a"),
                  }}
                  transition={{ duration: 0.3 }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm"
                >
                  {i + 1}
                </motion.div>
              </motion.div>
              <motion.span
                animate={{ opacity: active === i ? 1 : 0.45 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-semibold text-[#191919]"
              >
                {step.title}
              </motion.span>
            </motion.button>
          ))}
        </div>

        {/* Glass card */}
        <motion.div
          className="relative flex justify-center"
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={VP}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-x-[10%] -top-6 h-32 bg-[#0a66c2]/8 blur-3xl rounded-full pointer-events-none" />
          <div
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden bg-white dark:bg-[#1a1a1c] border border-[#dce6f1] dark:border-[#2a2a2d]"
            style={{
              boxShadow: "0 8px 32px rgba(10,102,194,0.08), 0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0a66c2]/20 to-transparent pointer-events-none" />

            <div className="relative min-h-[220px] flex items-center justify-center px-8 py-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  variants={cardVariants}
                  initial="enter" animate="center" exit="exit"
                  transition={{
                    duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94],
                    opacity: { duration: 0.35 }, filter: { duration: 0.4 },
                    scale: { duration: 0.45, delay: 0.04 },
                  }}
                  className="flex flex-col items-center text-center w-full"
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
                    style={{ background: "linear-gradient(135deg,rgba(10,102,194,0.12) 0%,rgba(10,102,194,0.05) 100%)", border: "1px solid rgba(10,102,194,0.20)" }}
                  >
                    {steps[active].icon}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#0a66c2]/70 mb-2">{steps[active].label}</span>
                  <h3 className="text-2xl font-bold mb-3 text-[#191919]">{steps[active].title}</h3>
                  <p className="text-[#595959] max-w-sm leading-relaxed">{steps[active].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress bar + dots */}
            <div className="px-8 pb-8 flex flex-col items-center gap-4">
              <div className="w-full h-0.5 rounded-full bg-[#dce6f1] overflow-hidden">
                <motion.div key={active} className="h-full rounded-full bg-[#0a66c2]"
                  initial={{ width: "0%" }} animate={{ width: "100%" }}
                  transition={{ duration: INTERVAL_MS / 1000, ease: "linear" }}
                />
              </div>
              <div className="flex items-center gap-3">
                {steps.map((_, i) => (
                  <button key={i} onClick={() => setActive(i)} className="focus:outline-none" aria-label={`Step ${i + 1}`}>
                    <motion.div
                      animate={{ width: active === i ? 24 : 8, opacity: active === i ? 1 : 0.35 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="h-2 rounded-full bg-[#0a66c2]"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
