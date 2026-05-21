// Realistic SaaS product visual used by both LoginForm and Signup pages.

function MetricPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-md ${tone}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export function ProductHeroVisual() {
  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-[#071018] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.18),transparent_32%),radial-gradient(circle_at_78%_20%,rgba(16,185,129,0.18),transparent_30%),linear-gradient(135deg,#05070b_0%,#0b1320_52%,#081722_100%)]" />
      <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative z-10 flex h-full w-full flex-col justify-between p-5 sm:p-6 lg:px-10 lg:py-8 xl:px-12">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-sky-300">LinkedInFlow</p>
            <p className="text-sm text-white/70">Automate LinkedIn content with a real workflow.</p>
          </div>
        </div>

        <div className="mx-auto max-w-lg space-y-4 lg:space-y-5 xl:translate-x-2">
          <h2 className="max-w-lg text-[2.4rem] font-semibold leading-[1.02] tracking-tight text-white sm:text-[2.75rem] xl:text-[3.8rem]">
            Set it up once.
            <span className="block text-[#7cc9ff]">Let it run from here.</span>
          </h2>
          <p className="max-w-md text-sm leading-6 text-white/68 sm:text-sm">
            Plan, generate, schedule, and publish LinkedIn posts from one polished workspace. Built for teams that want a production-ready content system.
          </p>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <MetricPill label="Queue health" value="94%" tone="text-sky-300" />
            <MetricPill label="Scheduled" value="18 posts" tone="text-sky-300" />
            <MetricPill label="Published" value="2.1k reach" tone="text-white/92" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-lg rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Workspace preview</p>
              <p className="mt-1 text-[15px] font-semibold text-white">Weekly content pipeline</p>
            </div>
            <div className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[11px] font-medium text-sky-200">
              Live
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-sky-200/60">Drafts</p>
              <p className="mt-1 text-lg font-semibold text-white">12</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-sky-200/60">Scheduled</p>
              <p className="mt-1 text-lg font-semibold text-white">8</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">Published</p>
              <p className="mt-1 text-lg font-semibold text-white">41</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Brand mark ────────────────────────────────────────────────────────────────

export function BrandMark() {
  return (
    <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9 flex-shrink-0" aria-hidden="true">
      <rect width="36" height="36" rx="8" fill="#0a66c2" />
      <circle cx="12" cy="13" r="3.4" fill="#ffffff" />
      <circle cx="24" cy="13" r="3.4" fill="#ffffff" />
      <circle cx="18" cy="24" r="3.4" fill="#ffffff" />
      <line x1="12" y1="13" x2="24" y2="13" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
      <line x1="18" y1="13" x2="18" y2="24" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

// ── Shared left panel ─────────────────────────────────────────────────────────

interface AuthLeftPanelProps {
  tagline?: string;
}

export function AuthLeftPanel({ tagline = 'Grow your professional presence — effortlessly.' }: AuthLeftPanelProps) {
  return (
      <div className="relative hidden min-h-screen overflow-hidden border-r border-white/10 bg-[#071018] lg:flex lg:w-full">
      <ProductHeroVisual />
    </div>
  );
}
