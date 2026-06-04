import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FloatingPaths } from "@/components/ui/floating-paths";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [cursor, setCursor] = useState({ x: -999, y: -999 });

  const titleRows = [
    ["Your LinkedIn,"],
    ["Finally"],
    ["On Autopilot"],
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (rect) setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const handleMouseLeave = () => setCursor({ x: -999, y: -999 });

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="pt-32 pb-20 px-4 overflow-hidden relative bg-[#eef3f8]"
    >
      {/* Cursor spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(500px circle at ${cursor.x}px ${cursor.y}px, rgba(10,102,194,0.10), transparent 70%)`,
        }}
      />

      {/* Background paths */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* Animated spotlight orbs */}
      <motion.div
        className="absolute left-1/4 top-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(10,102,194,0.25) 0%, transparent 70%)', filter: 'blur(80px)' }}
        animate={{ x: [0, 100, -50, 0], y: [0, -80, 50, 0], scale: [1, 1.3, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-1/3 top-1/3 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(10,102,194,0.20) 0%, transparent 70%)', filter: 'blur(80px)' }}
        animate={{ x: [0, -80, 60, 0], y: [0, 100, -50, 0], scale: [1.2, 1, 1.3, 1.2] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-5xl mx-auto mb-16">

          {/* Headline */}
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-[-0.045em] mb-6 leading-[1.08] px-2"
            style={{ fontFamily: "'Orbitron', system-ui, -apple-system, 'Segoe UI', sans-serif", fontWeight: 500 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            {titleRows.map((row, rowIndex) => (
              <div key={row.join("-")} className="overflow-visible py-1">
                <motion.div
                  className="flex flex-wrap items-center justify-center gap-x-2 md:gap-x-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: rowIndex * 0.15 }}
                >
                  {row.map((word) => {
                    const isHighlight = rowIndex === 1;
                    return (
                      <motion.span key={word} className="inline-block">
                        <span className={isHighlight
                          ? "bg-gradient-to-b from-[#55b6ff] via-[#1f86f3] to-[#0a66c2] bg-clip-text text-transparent"
                          : "bg-gradient-to-b from-[#2f3746] via-[#3a4352] to-[#596273] dark:from-[#ffffff] dark:via-[#ededed] dark:to-[#cfcfcf] bg-clip-text text-transparent"
                        }>
                          {word}
                        </span>
                      </motion.span>
                    );
                  })}
                </motion.div>
              </div>
            ))}
          </motion.h1>

          {/* Animated divider */}
          <motion.div
            className="mx-auto mb-6 h-px w-28 bg-linear-to-r from-transparent via-[#0a66c2] to-transparent"
            initial={{ opacity: 0, scaleX: 0.35 }}
            animate={{ opacity: [0.35, 0.75, 0.35], scaleX: [0.35, 1, 0.35] }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 0.45 }}
          />

          {/* Subtitle */}
          <motion.p
            className="text-xl text-[#595959] mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            LinkedInFlow turns your weekly wins, lessons, and thoughts into polished
            LinkedIn posts so founders build real inbound in 30 minutes a week.
          </motion.p>

          {/* CTA */}
          <motion.div
            className="relative inline-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            {/* Animated glow ring behind button */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{ boxShadow: ['0 0 0 0px rgba(10,102,194,0.4)', '0 0 0 12px rgba(10,102,194,0)', '0 0 0 0px rgba(10,102,194,0)'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 1.5 }}
            />
            <a href="#early-access">
              <Button
                size="lg"
                className="relative h-12 px-8 text-base bg-[#0a66c2] text-white hover:bg-[#004182] border-0
                           font-semibold shadow-[0_4px_20px_rgba(10,102,194,0.35)] hover:shadow-[0_4px_32px_rgba(10,102,194,0.50)]
                           transition-all duration-200"
              >
                Get Early Access <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
