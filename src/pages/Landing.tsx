import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { EarlyAccess } from "@/components/sections/EarlyAccess";
import { FAQ } from "@/components/sections/FAQ";
import { ContactUs } from "@/components/sections/ContactUs";
import { FinalCTA } from "@/components/sections/FinalCTA";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Hero />
        <Features />
        <HowItWorks />
        <EarlyAccess />
        <FAQ />
        <ContactUs />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
