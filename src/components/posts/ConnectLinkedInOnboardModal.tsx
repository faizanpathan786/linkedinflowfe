import {
  Shield,
  Lock,
  Linkedin,
  RefreshCw,
  Clock,
  Zap,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLinkedInOAuth } from '@/hooks/useLinkedInOAuth';
import { useAuthStore } from '@/store/useAuthStore';

const STORAGE_KEY = (userId: string) => `li_onboard_dismissed_${userId}`;

export function shouldShowOnboard(userId: string): boolean {
  return !localStorage.getItem(STORAGE_KEY(userId));
}

export function dismissOnboard(userId: string): void {
  localStorage.setItem(STORAGE_KEY(userId), '1');
}

interface Props {
  open: boolean;
  onDismiss: () => void;
  /** When true, dismissal is stored in localStorage so the modal never auto-shows again. Default false. */
  persistDismiss?: boolean;
}

export function ConnectLinkedInOnboardModal({ open, onDismiss, persistDismiss = false }: Props) {
  const { connect, isLoading } = useLinkedInOAuth();
  const { user } = useAuthStore();

  const handleDismiss = () => {
    if (persistDismiss && user?.id) dismissOnboard(user.id);
    onDismiss();
  };

  const handleConnect = async () => {
    if (persistDismiss && user?.id) dismissOnboard(user.id);
    await connect();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent
        className="sm:max-w-lg p-0 overflow-hidden gap-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-[#0a66c2] via-[#0073b1] to-[#004182] px-8 py-10 text-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)' }}
          />
          <div className="absolute -bottom-8 -right-8 opacity-[0.06]">
            <Linkedin className="h-48 w-48 text-white" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
              <Linkedin className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60 mb-1">Welcome to LinkedInFlow</p>
              <h2 className="text-xl font-bold text-white">Connect your LinkedIn account</h2>
              <p className="text-sm text-white/70 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Link your account to start scheduling and publishing posts automatically.
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleConnect}
              disabled={isLoading}
              className="h-11 px-8 !bg-white !text-[#0a66c2] hover:!bg-white/90 font-semibold shadow-lg"
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Connecting…' : 'Connect with LinkedIn'}
            </Button>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-[#f8f9fb]">
          <div className="rounded-xl border border-[#dce6f1] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#595959] mb-3">Before you connect</p>
            <div className="space-y-3">
              {[
                { step: '1', title: 'Enable 2FA', desc: 'Turn on Two-Factor Authentication on LinkedIn.' },
                { step: '2', title: 'Authorize the App', desc: 'Follow LinkedIn prompts to grant access.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eef3f8] border border-[#dce6f1] text-[9px] font-bold text-[#0a66c2] shrink-0 mt-0.5">
                    {s.step}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[#191919]">{s.title}</p>
                    <p className="text-[10px] text-[#595959] mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#dce6f1] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#595959] mb-3">What you'll unlock</p>
            <div className="space-y-2">
              {[
                { icon: Zap,       label: 'Auto-publish scheduled posts' },
                { icon: RefreshCw, label: 'Auto-retry on failed posts'   },
                { icon: Shield,    label: 'Secure token-based access'    },
                { icon: Clock,     label: 'Queue-based posting schedule' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#eef3f8] border border-[#dce6f1] shrink-0">
                    <Icon className="h-2.5 w-2.5 text-[#0a66c2]" />
                  </div>
                  <span className="text-[10px] text-[#191919]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 bg-[#f8f9fb] flex justify-center">
          <button
            onClick={handleDismiss}
            className="text-[12px] text-[#595959] hover:text-[#191919] transition-colors"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
