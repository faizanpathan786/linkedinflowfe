import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const VP = { once: false, amount: 0 } as const;

const faqs = [
  { q: "Is it safe to connect my LinkedIn account?",
    a: "100%. We use LinkedIn's official OAuth 2.0 API, the same method LinkedIn recommends. We never see, store, or touch your password. You can revoke access in one click from your LinkedIn security settings anytime." },
  { q: "Will scheduling posts hurt my LinkedIn reach?",
    a: "No, this is a common myth. LinkedIn's own documentation confirms that posts published via their official API perform identically to manual posts. What drives reach is content quality, not how you post. Our analytics help you figure out exactly what that means for your audience." },
  { q: "What do I actually get in the 14-day free trial?",
    a: "Full, unrestricted access to everything in the Pro plan: unlimited scheduling, AI drafting, advanced analytics, and priority support. No credit card required. No 'lite' version. The real thing, free for 14 days." },
  { q: "Can I cancel at any time?",
    a: "Yes, always. No lock-in, no cancellation fees, no awkward phone calls. Cancel in two clicks from your account settings. Your subscription stays active until the end of your billing period." },
  { q: "What happens to my content if I cancel or downgrade?",
    a: "Every post you've already published stays live on LinkedIn, that's yours forever. Your drafts and vault content stay safely stored in LinkedInFlow. Downgrading just limits how many new posts you can schedule going forward." },
  { q: "How fast will I see results?",
    a: "Most users report a noticeable increase in profile views and connection requests within the first two weeks of consistent posting. Reach and follower growth typically compound after 30 days. The analytics dashboard shows you exactly what's working so you can accelerate faster." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 bg-[#eef3f8] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0a66c2]/4 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <motion.p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a66c2] mb-3"
            initial={{ opacity: 0, y: -18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={VP} transition={{ duration: 0.5 }}
          >
            FAQ
          </motion.p>
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight mb-3"
            initial={{ opacity: 0, y: -18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={VP} transition={{ duration: 0.5, delay: 0.1 }}
          >
            Every question you have, answered
          </motion.h2>
          <motion.p className="text-[#595959]"
            initial={{ opacity: 0, y: -18 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={VP} transition={{ duration: 0.5, delay: 0.2 }}
          >
            No fluff, no fine print, just straight answers.
          </motion.p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = open === i;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VP}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-xl border transition-colors duration-200
                  ${isOpen
                    ? "border-[#0a66c2]/25 bg-white shadow-[0_0_0_3px_rgba(10,102,194,0.06)]"
                    : "border-[#e0dfdc] bg-white hover:border-[#0a66c2]/25 shadow-sm"}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left focus:outline-none group"
                >
                  <span className={`shrink-0 text-xs font-mono font-bold tabular-nums transition-colors duration-200 ${isOpen ? "text-[#0a66c2]" : "text-[#86888a]"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`flex-1 text-sm font-semibold transition-colors duration-200 ${isOpen ? "text-[#191919]" : "text-[#374151] group-hover:text-[#191919]"}`}>
                    {faq.q}
                  </span>
                  <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 ${isOpen ? "bg-[#0a66c2]/12 text-[#0a66c2]" : "bg-[#eef3f8] text-[#595959]"}`}>
                    {isOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 pl-[3.25rem] text-sm text-[#595959] leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
