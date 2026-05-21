import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Clock, CheckCircle2, Send } from "lucide-react";

const VP = { once: false, amount: 0 } as const;

const perks = [
  { icon: Clock,         label: "Response within 24 hours"     },
  { icon: MessageSquare, label: "Dedicated account walkthrough" },
  { icon: CheckCircle2,  label: "No sales pressure, ever"       },
];



function ShimmerSweep({ trigger }: { trigger: boolean }) {
  const [swept, setSwept] = useState(false);

  useEffect(() => {
    if (trigger) setSwept(false);
  }, [trigger]);

  return (
    <AnimatePresence>
      {trigger && !swept && (
        <motion.div
          key="sweep"
          className="pointer-events-none absolute inset-y-0 w-32 z-20
                     bg-gradient-to-r from-transparent via-[#0a66c2]/[0.04] to-transparent skew-x-[18deg]"
          initial={{ x: "-140%" }}
          animate={{ x: "200%" }}
          exit={{}}
          transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
          onAnimationComplete={() => setSwept(true)}
        />
      )}
    </AnimatePresence>
  );
}

export function ContactUs() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0 });
  const [submitted, setSubmitted] = useState(false);

  const FIELDS = [
    { id: "contact-name",  label: "Name",    type: "text",  placeholder: "Your name",       autoComplete: undefined },
    { id: "contact-email", label: "Email",   type: "email", placeholder: "you@company.com", autoComplete: "email"   },
  ];

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="py-24 px-4 bg-[#eef3f8] relative overflow-hidden"
    >
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0a66c2]/5 blur-[130px] rounded-full pointer-events-none"
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 bottom-0 w-[350px] h-[350px] bg-[#0a66c2]/4 blur-[100px] rounded-full pointer-events-none"
        animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="max-w-6xl mx-auto grid gap-14 lg:grid-cols-[1fr_1.1fr] items-start relative z-10">

        {/* LEFT PANEL */}
        <div>
          <motion.div
            className="flex items-center gap-2 mb-4"
            initial={{ opacity: 0, y: -18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VP}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className="w-2 h-2 rounded-full bg-[#0a66c2]"
              animate={{ opacity: [1, 0.2, 1], scale: [1, 1.4, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a66c2]">
              Contact us
            </span>
          </motion.div>

          <motion.h2
            className="text-3xl md:text-4xl font-bold text-[#191919] tracking-tight mb-4 leading-tight"
            initial={{ opacity: 0, y: -18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VP}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Let's build your LinkedIn growth plan together.
          </motion.h2>

          <motion.p
            className="text-[#595959] text-lg leading-relaxed mb-10"
            initial={{ opacity: 0, y: -18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VP}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Tell us about your goals and we'll show you exactly how LinkedInFlow
            fits your workflow, no generic demo, no sales pressure.
          </motion.p>


          <ul className="space-y-4">
            {perks.map(({ icon: Icon, label }, j) => (
              <motion.li
                key={label}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: -18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VP}
                transition={{ duration: 0.4, delay: 0.35 + j * 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.span
                  className="w-9 h-9 rounded-xl bg-[#eef3f8] border border-[#dce6f1] flex items-center justify-center shrink-0"
                  whileInView={{ scale: [0.5, 1.15, 1] }}
                  viewport={VP}
                  transition={{ duration: 0.45, delay: 0.4 + j * 0.1, ease: "backOut" }}
                >
                  <Icon className="w-4 h-4 text-[#0a66c2]" />
                </motion.span>
                <span className="text-sm text-[#595959]">{label}</span>
              </motion.li>
            ))}
          </ul>

          <motion.div
            className="mt-10 flex items-center gap-3 text-sm text-[#86888a]"
            initial={{ opacity: 0, y: -18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VP}
            transition={{ delay: 0.6 }}
          >
            <Mail className="w-4 h-4 shrink-0" />
            <span>hello@linkedinflow.com</span>
          </motion.div>
        </div>

        {/* FORM CARD */}
        <motion.div
          className="relative rounded-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          viewport={VP}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "#ffffff",
            border: "1px solid #dce6f1",
            boxShadow: "0 8px 32px rgba(10,102,194,0.07), 0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0a66c2]/20 to-transparent pointer-events-none" />
          <ShimmerSweep trigger={isInView} />

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: "blur(6px)" }}
                transition={{ duration: 0.3 }}
                onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                className="p-7 md:p-9"
              >
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  {FIELDS.map((f, k) => (
                    <motion.div
                      key={f.id}
                      className="space-y-2"
                      initial={{ opacity: 0, y: -18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={VP}
                      transition={{ duration: 0.4, delay: 0.2 + k * 0.08 }}
                    >
                      <label htmlFor={f.id} className="text-sm font-medium text-[#374151]">{f.label}</label>
                      <Input
                        id={f.id}
                        name={f.id.replace("contact-", "")}
                        type={f.type}
                        placeholder={f.placeholder}
                        autoComplete={f.autoComplete}
                        className="bg-[#f8fafc] border-[#dce6f1] text-[#191919] placeholder:text-[#86888a]
                                   focus:border-[#0a66c2]/50 focus:ring-[#0a66c2]/15 transition-all duration-200"
                      />
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="space-y-2 mb-6"
                  initial={{ opacity: 0, y: -18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VP}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <label htmlFor="contact-message" className="text-sm font-medium text-[#374151]">Message</label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    placeholder="Tell us what you need help with"
                    className="min-h-36 bg-[#f8fafc] border-[#dce6f1] text-[#191919] placeholder:text-[#86888a]
                               focus:border-[#0a66c2]/50 focus:ring-[#0a66c2]/15 transition-all duration-200 resize-none"
                  />
                </motion.div>

                <motion.div
                  className="flex items-center justify-between gap-4 flex-col sm:flex-row"
                  initial={{ opacity: 0, y: -18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VP}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <p className="text-sm text-[#86888a]">We usually respond within one business day.</p>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto bg-[#0a66c2] text-white hover:bg-[#004182] border-0
                               font-semibold shadow-[0_0_20px_rgba(10,102,194,0.18)]
                               hover:shadow-[0_0_32px_rgba(10,102,194,0.32)] transition-all duration-200"
                  >
                    <Send className="w-4 h-4 mr-2" /> Send message
                  </Button>
                </motion.div>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                className="p-7 md:p-9 flex flex-col items-center justify-center min-h-[340px] text-center"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-[#eef3f8] border border-[#dce6f1] flex items-center justify-center mb-5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.5, ease: "backOut" }}
                >
                  <CheckCircle2 className="w-8 h-8 text-[#0a66c2]" />
                </motion.div>
                <motion.h3
                  className="text-xl font-bold text-[#191919] mb-2"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Message sent!
                </motion.h3>
                <motion.p
                  className="text-[#595959] text-sm mb-6"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  We'll get back to you within one business day.
                </motion.p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  <Button
                    variant="outline"
                    className="border-[#dce6f1] text-[#191919] hover:bg-[#eef3f8] text-sm"
                    onClick={() => setSubmitted(false)}
                  >
                    Send another
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
}
