import { Link } from "react-router-dom";
import { Linkedin, Twitter, Github } from "lucide-react";

const LINKS = {
  Product: [
    { label: "Features",     href: "#features"  },
    { label: "Pricing",      href: "#pricing"   },
    { label: "Integrations", href: "#"           },
    { label: "Changelog",    href: "#"           },
  ],
  Docs: [
    { label: "Getting Started", href: "#" },
    { label: "API Reference",   href: "#" },
    { label: "Guides",          href: "#" },
  ],
  Company: [
    { label: "About",            href: "#"                      },
    { label: "Contact",          href: "#contact"               },
    { label: "Privacy Policy",   href: "/legal/privacy-policy"  },
    { label: "Terms of Service", href: "/legal/user-agreement"  },
  ],
};

export function Footer() {
  return (
    <footer className="relative bg-[#1b1f23] text-white overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-lg mb-5 group">
              <div className="bg-[#0a66c2] text-white p-1.5 rounded-lg group-hover:shadow-[0_0_18px_rgba(10,102,194,0.50)] transition-shadow duration-200">
                <Linkedin className="w-5 h-5" />
              </div>
              <span className="group-hover:text-[#70b5f9] transition-colors duration-200">LinkedInFlow</span>
            </Link>
            <p className="text-[#86888a] text-sm max-w-xs leading-relaxed">
              The command center for serious LinkedIn operators. Create, schedule,
              and publish content without the busywork.
            </p>

            {/* Social icons */}
            <div className="flex gap-3 mt-6">
              {[
                { Icon: Linkedin, href: "#" },
                { Icon: Twitter,  href: "#" },
                { Icon: Github,   href: "#" },
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.04]
                             flex items-center justify-center text-[#86888a]
                             hover:text-[#0a66c2] hover:border-[#0a66c2]/30 hover:bg-[#0a66c2]/10
                             transition-all duration-200"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, items]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-white mb-4">{heading}</h4>
              <ul className="space-y-3">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('/') ? (
                      <Link
                        to={href}
                        className="text-sm text-[#86888a] hover:text-[#70b5f9] transition-colors duration-200"
                      >
                        {label}
                      </Link>
                    ) : (
                      <a
                        href={href}
                        className="text-sm text-[#86888a] hover:text-[#70b5f9] transition-colors duration-200"
                      >
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/[0.07] flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#555d64]">
          <p>© {new Date().getFullYear()} LinkedInFlow. All rights reserved.</p>
          <p className="text-[#3d4449]">Built for LinkedIn operators, by LinkedIn operators.</p>
        </div>
      </div>
    </footer>
  );
}
