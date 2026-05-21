import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const VP = { once: false, amount: 0 } as const;

const plans = [
  {
    name: "Free", monthly: 0, yearly: 0,
    description: "Try LinkedInFlow with no commitment, no credit card needed.",
    entryX: -80,
    features: [
      "1 LinkedIn account",
      "10 posts / month",
      "Basic scheduling",
      "Content calendar",
    ],
  },
  {
    name: "Founder", monthly: 49, yearly: 39, popular: true,
    description: "For founders who want a consistent LinkedIn presence without the grind.",
    entryX: 0,
    features: [
      "1 LinkedIn account",
      "Unlimited posts",
      "AI Post Interview",
      "Brand Voice settings",
      "Analytics: what worked",
      "Priority support",
    ],
  },
  {
    name: "Team", monthly: 99, yearly: 79,
    description: "For small teams and agencies managing multiple LinkedIn accounts.",
    entryX: 80,
    features: [
      "Up to 3 LinkedIn accounts",
      "Unlimited posts",
      "AI Post Interview",
      "Shared content calendar",
      "Approval workflow",
      "Dedicated onboarding",
    ],
  },
];

function WordReveal({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`${className} inline-flex flex-wrap justify-center gap-x-[0.3em]`}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="overflow-hidden inline-block leading-tight">
          <motion.span className="inline-block"
            initial={{ y: "115%", opacity: 0 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={VP}
            transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-28 px-4 bg-[#eef3f8] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#0a66c2]/4 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <motion.p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a66c2] mb-3"
            initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={VP} transition={{ duration: 0.5 }}
          >
            Pricing
          </motion.p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight mb-4">
            <WordReveal text="Less than one lost client pays for a year" />
          </h2>
          <motion.p className="text-lg text-[#595959] mb-10"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={VP} transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            LinkedIn ghostwriters charge $2,000/month. LinkedInFlow does it for $49/mo. Start free, no credit card needed.
          </motion.p>

          <motion.div
            className="inline-flex items-center gap-3 rounded-full border border-[#dce6f1] bg-white px-4 py-2 shadow-sm"
            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={VP} transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={`text-sm font-medium transition-colors duration-200 ${!isYearly ? "text-[#191919]" : "text-[#86888a]"}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-250 focus:outline-none ${isYearly ? "bg-[#0a66c2]" : "bg-[#dce6f1]"}`}
              aria-label="Toggle billing"
            >
              <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                style={{ left: isYearly ? "calc(100% - 1.375rem)" : "0.125rem" }}
              />
            </button>
            <span className={`text-sm font-medium flex items-center gap-2 transition-colors duration-200 ${isYearly ? "text-[#191919]" : "text-[#86888a]"}`}>
              Yearly
              <span className="bg-[#eef3f8] text-[#0a66c2] text-xs px-2 py-0.5 rounded-full font-semibold border border-[#dce6f1]">Save 20%</span>
            </span>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-center">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, x: plan.entryX, y: 80, scale: 0.82, filter: "blur(12px)" }}
              whileInView={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
              viewport={VP}
              transition={{ duration: 0.75, delay: i * 0.13, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: plan.popular ? -4 : -8, scale: plan.popular ? 1.01 : 1.02, transition: { duration: 0.25 } }}
              className={`relative flex flex-col rounded-2xl overflow-visible
                ${plan.popular
                  ? "border-2 border-[#0a66c2]/50 bg-white shadow-[0_0_50px_rgba(10,102,194,0.14)] scale-[1.03]"
                  : "border border-[#e0dfdc] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)]"}`}
            >
              <div className={`absolute inset-x-0 top-0 h-px ${plan.popular ? "bg-gradient-to-r from-transparent via-[#0a66c2]/50 to-transparent" : "bg-gradient-to-r from-transparent via-[#dce6f1] to-transparent"}`} />

              {plan.popular && (
                <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-[#0a66c2] text-white text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_20px_rgba(10,102,194,0.35)]">
                  <Zap className="w-3 h-3" /> Most Popular
                </div>
              )}

              <div className="p-7 flex flex-col flex-1">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2 text-[#191919]">{plan.name}</h3>
                  <p className="text-sm text-[#595959]">{plan.description}</p>
                </div>

                <div className="mb-7">
                  <div className="flex items-end gap-1">
                    <AnimatePresence mode="wait">
                      <motion.span key={isYearly ? "y" : "m"} className="text-4xl font-bold text-[#191919]"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.22 }}
                      >
                        {plan.monthly === 0 ? "Free" : `$${isYearly ? plan.yearly : plan.monthly}`}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-[#86888a] mb-1">/mo</span>
                  </div>
                  {isYearly && plan.yearly > 0 && (
                    <motion.p className="text-xs text-[#86888a] mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      Billed ${plan.yearly * 12}/year
                    </motion.p>
                  )}
                </div>

                <a href="https://linkedinflowfe.vercel.app" target="_blank" rel="noopener noreferrer" className="mb-7">
                  <Button className={`w-full font-semibold transition-all duration-200
                    ${plan.popular
                      ? "bg-[#0a66c2] text-white hover:bg-[#004182] border-0 shadow-[0_0_22px_rgba(10,102,194,0.22)] hover:shadow-[0_0_32px_rgba(10,102,194,0.38)]"
                      : "bg-[#f3f2ee] text-[#191919] border border-[#e0dfdc] hover:bg-[#eef3f8] hover:border-[#0a66c2]/25"}`}
                  >
                    {plan.monthly === 0 ? "Get started free" : plan.popular ? "Start Free Trial" : "Get started"}
                  </Button>
                </a>

                <div className="h-px bg-[#e0dfdc] mb-6" />
                <ul className="space-y-3.5 mt-auto">
                  {plan.features.map((f, j) => (
                    <motion.li key={f}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={VP}
                      transition={{ duration: 0.4, delay: i * 0.13 + j * 0.07 + 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? "bg-[#eef3f8]" : "bg-[#eef3f8]"}`}>
                        <Check className={`w-2.5 h-2.5 ${plan.popular ? "text-[#0a66c2]" : "text-[#595959]"}`} />
                      </span>
                      <span className="text-sm text-[#595959]">{f}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
