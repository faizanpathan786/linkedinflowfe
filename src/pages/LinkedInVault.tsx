import { useEffect, useState } from 'react';
import {
  Shield,
  Trash2,
  CheckCircle,
  Lock,
  Linkedin,
  RefreshCw,
  AlertTriangle,
  Clock,
  Zap,
  ExternalLink,
  Key,
  Info,
} from 'lucide-react';
import { useLinkedInOAuth } from '../hooks/useLinkedInOAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { linkedInAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LinkedInProfile {
  firstName?: string;
  lastName?: string;
  headline?: string;
  pictureUrl?: string;
  vanityName?: string;
  personUrn?: string;
}

export function LinkedInVault() {
  const [isTesting, setIsTesting] = useState(false);
  const [profile, setProfile] = useState<LinkedInProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const { user } = useAuthStore();

  const {
    linkedInStatus,
    isLoading,
    isConnected,
    isExpired,
    vanityName,
    connectedAt,
    daysUntilExpiry,
    connect,
    disconnect,
    fetchStatus,
    testConnection,
  } = useLinkedInOAuth();

  useEffect(() => { fetchStatus(); }, []);

  useEffect(() => {
    if (!isConnected || !user?.id) return;
    setProfileLoading(true);
    linkedInAPI.getProfile(user.id)
      .then((res) => { if (res?.success && res?.data) setProfile(res.data); })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [isConnected, user?.id]);

  const handleConnect = async () => { await connect(); };
  const handleDisconnect = async () => { await disconnect(); };
  const handleTest = async () => {
    setIsTesting(true);
    await testConnection();
    setIsTesting(false);
  };

  const showConnected = isConnected;
  const showRevoked = linkedInStatus !== null && !isConnected && isExpired;

  const isValidVanityName = (s: string) => /^[a-zA-Z0-9\-_%]+$/.test(s) && s.length > 0;
  const rawHandle = profile?.vanityName || vanityName || '';
  const handle = isValidVanityName(rawHandle) ? rawHandle : '';
  const profileUrl = handle ? `https://www.linkedin.com/in/${handle}/` : 'https://www.linkedin.com/in/me/';
  const displayName = profile?.firstName
    ? [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    : rawHandle || 'LinkedIn User';

  const expiresAt = linkedInStatus?.data?.expiresAt;
  const expDate = expiresAt ? new Date(expiresAt) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  const isExpiredNow = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  const tokenPercent = daysUntilExpiry !== null
    ? Math.max(0, Math.min(100, Math.round((daysUntilExpiry / 60) * 100)))
    : 100;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">

      {/* ── Connected State ── */}
      {showConnected && (
        <>
          {/* Hero profile card */}
          <div className="rounded-2xl border border-[#e0dfdc] bg-white overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
            {/* Banner */}
            <div className="relative h-32 bg-gradient-to-br from-[#0a66c2] via-[#0073b1] to-[#004182] overflow-hidden">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
              <div className="absolute -bottom-6 -right-4 opacity-[0.07]">
                <Linkedin className="h-36 w-36 text-white" />
              </div>
              {/* Status pill */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-white">Connected</span>
              </div>
            </div>

            <div className="px-6 pb-5">
              {profileLoading ? (
                <div className="animate-pulse">
                  <div className="flex items-end justify-between -mt-10 mb-4">
                    <div className="h-20 w-20 rounded-full bg-[#e0dfdc] border-4 border-white" />
                    <div className="h-8 w-28 bg-[#e8edf2] rounded-lg mt-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-44 bg-[#e8edf2] rounded-full" />
                    <div className="h-3 w-32 bg-[#e8edf2] rounded-full" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Avatar + actions */}
                  <div className="flex items-end justify-between -mt-10 mb-4 relative z-10">
                    <div className="h-20 w-20 rounded-full border-4 border-white bg-[#0a66c2] flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                      {profile?.pictureUrl ? (
                        <img src={profile.pictureUrl} alt="LinkedIn avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-2xl leading-none">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-12">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTest}
                        disabled={isTesting || isLoading}
                        className="h-8 !border-[#dce6f1] !bg-[#f8fafc] !text-[#191919] hover:!bg-[#eef3f8] text-xs"
                      >
                        <RefreshCw className={cn('mr-1.5 h-3 w-3', isTesting && 'animate-spin')} />
                        {isTesting ? 'Testing…' : 'Test'}
                      </Button>
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 h-8 rounded-md border border-[#0a66c2] px-3 text-xs font-semibold text-[#0a66c2] hover:bg-[#0a66c2]/5 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={isLoading}
                        className="h-8 !border-red-200 !bg-red-50 !text-red-600 hover:!bg-red-100 text-xs"
                      >
                        <Trash2 className="mr-1.5 h-3 w-3" />
                        Disconnect
                      </Button>
                    </div>
                  </div>

                  {/* Name + handle */}
                  <div>
                    <p className="text-lg font-bold text-[#191919] leading-tight">{displayName}</p>
                    {handle && (
                      <p className="text-xs text-[#595959] mt-0.5">linkedin.com/in/{handle}</p>
                    )}
                    {profile?.headline && (
                      <p className="text-sm text-[#595959] mt-1.5 leading-snug line-clamp-2">{profile.headline}</p>
                    )}
                  </div>

                  {/* Footer meta */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[#f0f3f6]">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-semibold text-green-700">Active</span>
                    </div>
                    {connectedAt && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#595959]" />
                        <span className="text-xs text-[#595959]">
                          Connected {new Date(connectedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {expDate && (
                      <div className="flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-[#595959]" />
                        <span className="text-xs text-[#595959]">
                          Token expires {expDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Token health + info row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Token health */}
            <div className={cn(
              'rounded-xl border p-4 space-y-3',
              isExpiredNow ? 'border-red-200 bg-red-50'
              : isExpiringSoon ? 'border-amber-200 bg-amber-50'
              : 'border-[#dce6f1] bg-[#f8fafc]'
            )}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#595959]">Token Health</p>
                <span className={cn(
                  'text-xs font-bold',
                  isExpiredNow ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-[#0a66c2]'
                )}>
                  {isExpiredNow ? 'Expired' : daysUntilExpiry !== null ? `${daysUntilExpiry}d left` : 'Active'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#e0dfdc] overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    isExpiredNow ? 'bg-red-500' : isExpiringSoon ? 'bg-amber-500' : 'bg-[#0a66c2]'
                  )}
                  style={{ width: `${tokenPercent}%` }}
                />
              </div>
              {(isExpiredNow || isExpiringSoon) && (
                <div className={cn('flex items-start gap-2 rounded-lg border p-2.5 text-xs',
                  isExpiredNow ? 'border-red-200 bg-red-100 text-red-700' : 'border-amber-200 bg-amber-100 text-amber-700'
                )}>
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{isExpiredNow ? 'Reconnect to resume automation.' : `Expires in ${daysUntilExpiry}d — reconnect soon.`}</span>
                </div>
              )}
              {(isExpiredNow || isExpiringSoon) && (
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full h-8 !bg-[#0a66c2] !text-white hover:!bg-[#004182] text-xs"
                >
                  <Lock className="mr-1.5 h-3 w-3" />
                  Reconnect LinkedIn
                </Button>
              )}
              {!isExpiredNow && !isExpiringSoon && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-2.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  <span className="text-xs text-green-700 font-medium">Token is healthy</span>
                </div>
              )}
            </div>

            {/* Permissions */}
            <div className="rounded-xl border border-[#dce6f1] bg-[#f8fafc] p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#595959]">Permissions</p>
              <div className="space-y-2">
                {[
                  { label: 'Post on your behalf', granted: true },
                  { label: 'Read profile info', granted: true },
                  { label: 'Access email address', granted: true },
                ].map((perm) => (
                  <div key={perm.label} className="flex items-center gap-2">
                    <div className={cn('flex h-4 w-4 items-center justify-center rounded-full shrink-0', perm.granted ? 'bg-green-100' : 'bg-[#f0f3f6]')}>
                      <CheckCircle className={cn('h-2.5 w-2.5', perm.granted ? 'text-green-600' : 'text-[#a0a7af]')} />
                    </div>
                    <span className="text-xs text-[#191919]">{perm.label}</span>
                  </div>
                ))}
              </div>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#0a66c2]/10 border border-[#0a66c2]/20 px-2 py-0.5 text-[10px] font-semibold text-[#0a66c2]">
                  <Zap className="h-2.5 w-2.5" />
                  Share on LinkedIn
                </span>
              </div>
            </div>

            {/* Security tips */}
            <div className="rounded-xl border border-[#dce6f1] bg-[#f8fafc] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-[#0a66c2]" />
                <p className="text-xs font-semibold uppercase tracking-wide text-[#595959]">Security</p>
              </div>
              <div className="space-y-2.5">
                {[
                  'Your password is never stored — only a revocable access token.',
                  'Tokens expire automatically every ~60 days.',
                  'You can disconnect at any time to revoke access.',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Info className="h-3 w-3 text-[#0a66c2] mt-0.5 shrink-0" />
                    <span className="text-[11px] text-[#595959] leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}

      {/* ── Not Connected State ── */}
      {!showConnected && (
        <div className="flex flex-col gap-4">

          {/* CTA hero */}
          <div className="rounded-2xl border border-[#e0dfdc] bg-white overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
            <div className="relative bg-gradient-to-br from-[#0a66c2] via-[#0073b1] to-[#004182] px-8 py-12 text-center overflow-hidden">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
              <div className="absolute -bottom-8 -right-8 opacity-[0.06]">
                <Linkedin className="h-48 w-48 text-white" />
              </div>
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                  <Linkedin className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {showRevoked ? 'Reconnect LinkedIn' : 'Connect LinkedIn'}
                  </h2>
                  <p className="text-sm text-white/70 mt-1 max-w-xs mx-auto">
                    {showRevoked
                      ? 'Your token has expired. Reconnect to resume automation.'
                      : 'Link your account to start scheduling and publishing posts automatically.'}
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
                  {isLoading ? 'Connecting…' : showRevoked ? 'Reconnect Now' : 'Connect with LinkedIn'}
                </Button>
              </div>
            </div>
          </div>

          {/* Setup steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#dce6f1] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#595959] mb-4">Before you connect</p>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Enable 2FA', desc: 'Turn on Two-Factor Authentication on your LinkedIn account for enhanced security.' },
                  { step: '2', title: 'Authorize the App', desc: 'Follow the on-screen prompts from LinkedIn to securely authorize the connection.' },
                ].map((s) => (
                  <div key={s.step} className="flex gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef3f8] border border-[#dce6f1] text-[10px] font-bold text-[#0a66c2] shrink-0 mt-0.5">
                      {s.step}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#191919]">{s.title}</p>
                      <p className="text-[11px] text-[#595959] mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#dce6f1] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#595959] mb-4">What you'll unlock</p>
              <div className="space-y-2.5">
                {[
                  { icon: Zap, label: 'Auto-publish scheduled posts' },
                  { icon: RefreshCw, label: 'Auto-retry on failed posts' },
                  { icon: Shield, label: 'Secure token-based access' },
                  { icon: Clock, label: 'Queue-based posting schedule' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#eef3f8] border border-[#dce6f1] shrink-0">
                      <Icon className="h-3 w-3 text-[#0a66c2]" />
                    </div>
                    <span className="text-xs text-[#191919]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
