import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, FileText, Shield, Cookie, HelpCircle } from "lucide-react";

interface SectionData {
  id: string;
  heading: string;
  content: React.ReactNode;
}

interface PageConfig {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge: string;
  normalTitleFont?: boolean;
  sections: SectionData[];
}

function LegalPageShell({ config }: { config: PageConfig }) {
  const navigate = useNavigate();
  const location = useLocation();
  const from: string = (location.state as any)?.from;

  const handleBack = () => {
    if (from === "signup") {
      navigate("/signup");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa]">

      {/* Top bar */}
      <header className="bg-[#050505] border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-sm font-bold text-white tracking-tight">LinkedInFlow</span>
          <a
            href="mailto:hello@linkedinflow.com"
            className="text-sm font-medium text-white/80 hover:text-white transition-colors hidden sm:block"
          >
            hello@linkedinflow.com
          </a>
        </div>
      </header>

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-[#0a66c2] via-[#0057ab] to-[#003f85] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              {config.icon}
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              {config.badge}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">{config.title}</h1>
          <p className="text-blue-100 text-base max-w-xl">{config.subtitle}</p>
          <p className="mt-4 text-xs text-blue-200">Last updated: May 16, 2025</p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex gap-10 items-start">

          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-56 shrink-0 sticky top-20">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#86888a] mb-4 px-1">
              On this page
            </p>
            <nav className="space-y-0.5">
              {config.sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-[#595959] hover:text-[#0a66c2] px-3 py-2 rounded-lg hover:bg-[#eef3f8] transition-colors truncate"
                >
                  {s.heading}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-[#e0dfdc] shadow-sm overflow-hidden">
              {config.sections.map((s, i) => (
                <div
                  key={s.id}
                  id={s.id}
                  className={`px-8 md:px-12 py-8 ${i !== config.sections.length - 1 ? "border-b border-[#f0f0f0]" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 text-xs font-bold text-[#0a66c2] bg-[#eef3f8] rounded-md px-2 py-1 shrink-0 min-w-[2rem] text-center">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <h2 className="text-base font-bold text-[#191919] mb-3">{s.heading}</h2>
                      <div className="text-sm text-[#595959] leading-[1.75] space-y-3">
                        {s.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div className="mt-6 flex items-center justify-between text-xs text-[#86888a] px-1">
              <span>© 2025 LinkedInFlow. All rights reserved.</span>
              <a href="mailto:hello@linkedinflow.com" className="text-[#0a66c2] hover:underline">
                hello@linkedinflow.com
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── User Agreement ────────────────────────────────────────────────────────────

export function UserAgreement() {
  const config: PageConfig = {
    icon: <FileText className="w-5 h-5 text-white" />,
    badge: "Legal",
    title: "User Agreement",
    subtitle: "Please read these terms carefully before using LinkedInFlow. By creating an account you agree to be bound by this agreement.",
    sections: [
      {
        id: "acceptance",
        heading: "Acceptance of Terms",
        content: <p>By accessing or using LinkedInFlow you agree to be bound by these terms. If you do not agree, please do not use our service. These terms apply to all visitors, users, and others who access or use the service.</p>,
      },
      {
        id: "use-of-service",
        heading: "Use of Service",
        content: <p>LinkedInFlow provides LinkedIn automation and content scheduling tools for professional use. You agree to use the service only for lawful purposes and in strict accordance with LinkedIn's own terms of service and community guidelines.</p>,
      },
      {
        id: "account",
        heading: "Account Responsibility",
        content: <p>You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately at <a href="mailto:hello@linkedinflow.com" className="text-[#0a66c2]">hello@linkedinflow.com</a> if you suspect unauthorized access.</p>,
      },
      {
        id: "prohibited",
        heading: "Prohibited Activities",
        content: (
          <>
            <p>You may not use LinkedInFlow to spam, harass, or violate the rights of others. The following are strictly prohibited:</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li>Automated mass messaging or connection requests</li>
              <li>Scraping LinkedIn data in violation of LinkedIn's terms</li>
              <li>Impersonating any person or entity</li>
              <li>Distributing malware or malicious content</li>
            </ul>
          </>
        ),
      },
      {
        id: "termination",
        heading: "Termination",
        content: <p>We reserve the right to suspend or terminate your access at our sole discretion if you violate these terms, with or without prior notice. Upon termination, your right to use the service will immediately cease.</p>,
      },
      {
        id: "liability",
        heading: "Limitation of Liability",
        content: <p>LinkedInFlow is provided "as is" without warranties of any kind. To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the service.</p>,
      },
      {
        id: "contact-agreement",
        heading: "Contact",
        content: <p>For questions about this agreement, contact us at <a href="mailto:hello@linkedinflow.com" className="text-[#0a66c2]">hello@linkedinflow.com</a>. We aim to respond within two business days.</p>,
      },
    ],
  };

  return <LegalPageShell config={config} />;
}

// ── Privacy Policy ────────────────────────────────────────────────────────────

export function PrivacyPolicy() {
  const config: PageConfig = {
    icon: <Shield className="w-5 h-5 text-white" />,
    badge: "Privacy",
    title: "Privacy Policy",
    subtitle: "Your privacy matters to us. This policy explains what data we collect, how we use it, and the controls you have over it.",
    normalTitleFont: true,
    sections: [
      {
        id: "information-collected",
        heading: "Information We Collect",
        content: (
          <>
            <p>We collect information in the following categories:</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li><strong className="text-[#374151]">Account data</strong> — name and email address provided at registration</li>
              <li><strong className="text-[#374151]">LinkedIn OAuth token</strong> — a secure access token used to publish posts on your behalf</li>
              <li><strong className="text-[#374151]">Usage data</strong> — pages visited, features used, and performance metrics to improve the service</li>
            </ul>
          </>
        ),
      },
      {
        id: "how-we-use",
        heading: "How We Use Your Information",
        content: <p>Your data is used to operate and improve LinkedInFlow, personalize your experience, send essential service communications (e.g., post failure alerts), and comply with legal obligations. We do not use your data for advertising.</p>,
      },
      {
        id: "linkedin-data",
        heading: "LinkedIn Data",
        content: <p>When you connect your LinkedIn account via OAuth, we store a secure access token to publish posts on your behalf. We never see or store your LinkedIn password. You may revoke access at any time from Settings → LinkedIn Vault.</p>,
      },
      {
        id: "data-sharing",
        heading: "Data Sharing",
        content: <p>We do not sell, trade, or rent your personal data. We may share data with trusted sub-processors (e.g., cloud hosting, error monitoring) who are contractually bound to protect it. We may disclose data if required by law.</p>,
      },
      {
        id: "data-retention",
        heading: "Data Retention",
        content: <p>We retain your data for as long as your account is active. Upon account deletion, personal data is purged within 30 days except where retention is required by law.</p>,
      },
      {
        id: "security",
        heading: "Security",
        content: <p>We use TLS encryption in transit, AES-256 encryption at rest, and follow industry-standard security practices. No system is perfectly secure — if you discover a vulnerability, please notify us at <a href="mailto:hello@linkedinflow.com" className="text-[#0a66c2]">hello@linkedinflow.com</a>.</p>,
      },
      {
        id: "contact-privacy",
        heading: "Contact",
        content: <p>For privacy requests, data deletion, or questions, email <a href="mailto:hello@linkedinflow.com" className="text-[#0a66c2]">hello@linkedinflow.com</a>. We respond within five business days.</p>,
      },
    ],
  };

  return <LegalPageShell config={config} />;
}

// ── Cookie Policy ─────────────────────────────────────────────────────────────

export function CookiePolicy() {
  const config: PageConfig = {
    icon: <Cookie className="w-5 h-5 text-white" />,
    badge: "Cookies",
    title: "Cookie Policy",
    subtitle: "This page explains which cookies LinkedInFlow uses, why, and how you can manage your preferences.",
    sections: [
      {
        id: "what-are-cookies",
        heading: "What Are Cookies",
        content: <p>Cookies are small text files stored on your device when you visit a website. They enable core functionality, remember your preferences, and help us understand how the service is used.</p>,
      },
      {
        id: "essential-cookies",
        heading: "Essential Cookies",
        content: <p>These cookies are required for LinkedInFlow to function and cannot be disabled. They include session authentication tokens and CSRF protection tokens. Without them the service cannot operate.</p>,
      },
      {
        id: "analytics-cookies",
        heading: "Analytics Cookies",
        content: <p>We use privacy-respecting analytics to understand aggregate usage patterns — which features are popular, where errors occur, and how performance can be improved. Data is anonymised and never linked to individual users.</p>,
      },
      {
        id: "preference-cookies",
        heading: "Preference Cookies",
        content: <p>These cookies remember your in-app preferences such as theme (light/dark), timezone, and sidebar state so you don't have to re-configure them on every visit.</p>,
      },
      {
        id: "managing-cookies",
        heading: "Managing Cookies",
        content: <p>You can control or delete cookies via your browser settings. Disabling essential cookies will prevent you from logging in. Most browsers allow you to block third-party cookies while keeping first-party ones — this is the recommended configuration.</p>,
      },
      {
        id: "third-party-cookies",
        heading: "Third-Party Cookies",
        content: <p>Some third-party services integrated with LinkedInFlow (e.g., error monitoring) may set their own cookies. These are governed by their own privacy policies, which we link to where applicable.</p>,
      },
      {
        id: "contact-cookies",
        heading: "Contact",
        content: <p>Cookie questions? Email us at <a href="mailto:hello@linkedinflow.com" className="text-[#0a66c2]">hello@linkedinflow.com</a>.</p>,
      },
    ],
  };

  return <LegalPageShell config={config} />;
}

// ── Help Center ───────────────────────────────────────────────────────────────

export function HelpCenter() {
  const config: PageConfig = {
    icon: <HelpCircle className="w-5 h-5 text-white" />,
    badge: "Support",
    title: "Help Center",
    subtitle: "Find answers to the most common questions about LinkedInFlow. Can't find what you need? Email us and we'll reply within one business day.",
    sections: [
      {
        id: "connect-linkedin",
        heading: "How do I connect my LinkedIn account?",
        content: <p>Go to <strong className="text-[#374151]">Settings → LinkedIn Vault</strong> and click <em>Connect LinkedIn</em>. You'll be redirected to LinkedIn's official OAuth authorization page. Approve access and you'll be returned to LinkedInFlow — fully connected.</p>,
      },
      {
        id: "password-stored",
        heading: "Is my LinkedIn password stored?",
        content: <p>No. LinkedInFlow uses LinkedIn's official OAuth 2.0 flow. We receive a secure access token only — your password is never transmitted to or stored on our servers.</p>,
      },
      {
        id: "schedule-post",
        heading: "How do I schedule a post?",
        content: <p>Open <strong className="text-[#374151]">Create Post</strong>, write your content, then choose <em>Schedule</em> and pick a date and time. The post will be published automatically. You can review all scheduled posts under <strong className="text-[#374151]">Posts → Scheduled</strong>.</p>,
      },
      {
        id: "edit-post",
        heading: "Can I edit or delete a scheduled post?",
        content: <p>Yes. Navigate to <strong className="text-[#374151]">Posts → Scheduled</strong>, find the post, and use the edit (pencil) or delete (trash) icons. Changes take effect immediately.</p>,
      },
      {
        id: "failed-post",
        heading: "What happens if a post fails to publish?",
        content: <p>Failed posts appear in <strong className="text-[#374151]">Posts → Failed</strong> with a reason for the failure (e.g., expired token, LinkedIn API error). You can retry the post or edit it and re-schedule from there.</p>,
      },
      {
        id: "revoke-linkedin",
        heading: "How do I disconnect my LinkedIn account?",
        content: <p>Go to <strong className="text-[#374151]">Settings → LinkedIn Vault</strong> and click <em>Disconnect</em>. This revokes the access token immediately. You can reconnect at any time.</p>,
      },
      {
        id: "cancel-account",
        heading: "How do I cancel my account?",
        content: <p>Email us at <a href="mailto:hello@linkedinflow.com" className="text-[#0a66c2]">hello@linkedinflow.com</a> with the subject "Account deletion". We'll close your account and permanently delete your data within 30 days.</p>,
      },
      {
        id: "contact-support",
        heading: "Still need help?",
        content: <p>Email <a href="mailto:hello@linkedinflow.com" className="text-[#0a66c2]">hello@linkedinflow.com</a> with as much detail as possible. We respond within one business day, Monday–Friday.</p>,
      },
    ],
  };

  return <LegalPageShell config={config} />;
}
