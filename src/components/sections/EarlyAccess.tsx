import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { earlyAccessAPI } from "@/lib/api";

const VP = { once: false, amount: 0 } as const;

export function EarlyAccess() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    try {
      setLoading(true);
      await earlyAccessAPI.submit(trimmed);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="early-access"
      className="py-28 px-4 bg-[#eef3f8] relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#0a66c2]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10 text-center">

        <motion.p
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a66c2] mb-3"
          initial={{ opacity: 0, y: -18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.5 }}
        >
          Early Access
        </motion.p>

        <motion.h2
          className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight mb-4 leading-tight"
          initial={{ opacity: 0, y: -18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Be the first to grow on LinkedIn
        </motion.h2>

        <motion.p
          className="text-lg text-[#595959] mb-10 leading-relaxed"
          initial={{ opacity: 0, y: -18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          LinkedInFlow is currently invite-only. Drop your email and we'll reach out personally to get you set up.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: -18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VP}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-[#0a66c2]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-[#0a66c2]" />
                </div>
                <p className="text-xl font-semibold text-[#191919]">You're on the list!</p>
                <p className="text-[#595959]">We'll reach out to <span className="font-medium text-[#191919]">{email}</span> soon.</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={loading}
                  className="w-full sm:flex-1 h-12 px-4 rounded-full text-sm bg-white border border-[#dce6f1] text-[#191919] placeholder:text-[#86888a] focus:outline-none focus:border-[#0a66c2] focus:ring-2 focus:ring-[#0a66c2]/20 transition-colors shadow-sm disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 px-7 rounded-full text-sm font-semibold bg-[#0a66c2] text-white hover:bg-[#004182] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_4px_20px_rgba(10,102,194,0.30)] hover:shadow-[0_4px_32px_rgba(10,102,194,0.45)] flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Get Early Access <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.p
          className="text-xs text-[#86888a] mt-5"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={VP}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          No spam. No credit card. We'll reach out personally.
        </motion.p>

      </div>
    </section>
  );
}
