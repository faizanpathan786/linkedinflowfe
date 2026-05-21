import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageError } from '@/components/ui/page-error';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '@/lib/api';
import {
  Plus, RefreshCw, CheckCircle, FileText, Calendar,
  ArrowUpRight, BarChart3, MessageSquare, Lightbulb,
  Sparkles, Linkedin, Activity, TrendingUp, Clock,
  CalendarDays,
} from 'lucide-react';
import { useLinkedInStore } from '@/store/useLinkedInStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLinkedInOAuth } from '@/hooks/useLinkedInOAuth';
import { LinkedInGateModal } from '@/components/posts/LinkedInGateModal';
import { cn } from '@/lib/utils';
import { NumberTicker } from '@/components/ui/magic/number-ticker';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
  XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { format, subDays, parseISO, isToday, isTomorrow } from 'date-fns';
import { loadQueueSettings, getNextQueueSlot } from '@/lib/queue';

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, iconBg, iconColor, onClick, loading,
}: {
  label: string; value: number; sub: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  onClick?: () => void; loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#e8eaed] px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-6 w-10" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-[#e8eaed] px-4 py-3 transition-all duration-150',
        onClick && 'cursor-pointer hover:border-[#c8cdd5] hover:shadow-sm',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
          <Icon className={cn('h-3.5 w-3.5', iconColor)} />
        </div>
        <span className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-[22px] font-bold text-[#111827] tabular-nums leading-none mb-1">
        <NumberTicker value={value} />
      </p>
      <p className="text-[11px] text-[#9ca3af]">{sub}</p>
    </div>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e8eaed] rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-semibold text-[#111827] mb-0.5">{label}</p>
      <p className="text-[#9ca3af]">Published: <span className="font-semibold text-[#111827]">{payload[0].value}</span></p>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { posts, linkedInStatus, setPosts, ideas } = useLinkedInStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);
  const firstName = user?.name?.split(' ')[0] || 'there';
  const [isLoading,    setIsLoading]    = useState(posts.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [chartRange,   setChartRange]   = useState<'7D' | '30D' | '90D'>('30D');
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => localStorage.getItem('linkedinflow_onboarding_dismissed') === '1',
  );
  const [dailyPromptDismissed, setDailyPromptDismissed] = useState(false);

  const isLinkedInConnected = Boolean(linkedInStatus?.isConnected && !linkedInStatus?.isExpired);
  const { connect, isLoading: connectLoading } = useLinkedInOAuth();
  const [showGate, setShowGate] = useState(false);

  const goToCreatePost = () => {
    if (linkedInStatus !== null && !isLinkedInConnected) {
      setShowGate(true);
    } else {
      navigate('/dashboard/create-post');
    }
  };

  const fetchPosts = (silent = false) => {
    if (!silent) setIsLoading(true); else setIsRefreshing(true);
    setError(null);
    postsAPI.getPosts()
      .then(d => setPosts(d.posts ?? []))
      .catch(() => { if (!silent) setError('Could not load posts. Check your connection and try again.'); })
      .finally(() => { setIsLoading(false); setIsRefreshing(false); });
  };

  useEffect(() => { fetchPosts(posts.length > 0); }, []);

  const queueSettings = useMemo(() => loadQueueSettings(), []);
  const nextQueueSlot = useMemo(() => getNextQueueSlot(queueSettings, posts), [queueSettings, posts]);

  const slotLabel = useMemo(() => {
    if (!nextQueueSlot) return null;
    if (isToday(nextQueueSlot))    return `today at ${format(nextQueueSlot, 'h:mm a')}`;
    if (isTomorrow(nextQueueSlot)) return `tomorrow at ${format(nextQueueSlot, 'h:mm a')}`;
    return format(nextQueueSlot, "EEE MMM d 'at' h:mm a");
  }, [nextQueueSlot]);

  // ── counts ──────────────────────────────────────────────────────────────────
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const draftCount     = posts.filter(p => p.status === 'draft').length;
  const failedCount    = posts.filter(p => p.status === 'failed').length;

  // ── chart data ──────────────────────────────────────────────────────────────
  const chartDays = chartRange === '7D' ? 7 : chartRange === '30D' ? 30 : 90;
  const activityData = useMemo(() => {
    return Array.from({ length: chartDays }, (_, i) => {
      const day   = subDays(new Date(), chartDays - 1 - i);
      const key   = format(day, 'yyyy-MM-dd');
      const count = posts.filter(p => {
        if (p.status !== 'published' || !p.published_at) return false;
        return format(parseISO(p.published_at), 'yyyy-MM-dd') === key;
      }).length;
      const interval = chartDays <= 7 ? 1 : chartDays <= 30 ? 5 : 14;
      return {
        date:  format(day, 'MMM d'),
        count,
        label: i % interval === 0 ? format(day, 'MMM d') : '',
      };
    });
  }, [posts, chartDays]);
  const hasActivity = activityData.some(d => d.count > 0);

  // ── lists ───────────────────────────────────────────────────────────────────
  const recentPosts = useMemo(() =>
    [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6),
  [posts]);

  const upcomingPosts = useMemo(() =>
    [...posts].filter(p => p.status === 'scheduled' && p.scheduled_at)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
      .slice(0, 5),
  [posts]);

  const weeklyIdeas = useMemo(() => {
    const cut = Date.now() - 7 * 86400_000;
    return ideas.filter(i => new Date(i.captured_at).getTime() >= cut);
  }, [ideas]);

  const showDailyPrompt = !dailyPromptDismissed && ideas.length > 0 && !isLoading;

  const onboardingSteps = [
    { label: 'Connect your LinkedIn account', done: isLinkedInConnected, href: '/dashboard/linkedin-vault' },
    { label: 'Capture your first idea',       done: ideas.length > 0,    href: '/dashboard/ideas'         },
    { label: 'Create your first post',        done: posts.length > 0,    href: '/dashboard/create-post'   },
  ];
  const showOnboarding = !onboardingDismissed && !onboardingSteps.every(s => s.done) && !isLoading;

  const statusMeta: Record<string, { dot: string; badge: string; label: string }> = {
    published:  { dot: 'bg-emerald-500', badge: 'badge-success', label: 'Published'  },
    draft:      { dot: 'bg-amber-400',   badge: 'badge-warning', label: 'Draft'      },
    scheduled:  { dot: 'bg-blue-500',    badge: 'badge-info',    label: 'Scheduled'  },
    failed:     { dot: 'bg-red-500',     badge: 'badge-error',   label: 'Failed'     },
    publishing: { dot: 'bg-blue-500',    badge: 'badge-info',    label: 'Publishing' },
  };

  const tagColors: Record<string, string> = {
    win:      'bg-emerald-50 text-emerald-700',
    lesson:   'bg-blue-50 text-blue-700',
    opinion:  'bg-purple-50 text-purple-700',
    thought:  'bg-gray-100 text-gray-600',
    update:   'bg-sky-50 text-sky-700',
    question: 'bg-orange-50 text-orange-700',
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-fade-in">
      {showGate && <LinkedInGateModal onDismiss={() => setShowGate(false)} />}

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="px-1 py-1">
        <div className="flex flex-wrap items-center justify-between gap-4">

          {/* Left: greeting + meta */}
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar */}
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#0a66c2]/10 flex items-center justify-center text-[15px] font-bold text-[#0a66c2]">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[17px] font-bold text-[#111827] leading-tight">
                  {greeting}, {firstName}!
                </h1>
                {isLinkedInConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    LinkedIn connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0 cursor-pointer" onClick={connect}>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Not connected · Connect
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#9ca3af] mt-0.5 flex items-center gap-2">
                <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
                <span className="text-[#e8eaed]">·</span>
                <span className={isRefreshing ? 'text-[#0a66c2]' : 'text-[#9ca3af]'}>
                  {isRefreshing ? 'Refreshing…' : `${posts.length} post${posts.length !== 1 ? 's' : ''} total`}
                </span>
              </p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchPosts(true)}
              disabled={isRefreshing}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e8eaed] bg-white text-[#9ca3af] hover:text-[#374151] hover:bg-[#f8f9fb] transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
            </button>
            <Button
              size="sm" variant="outline"
              className="h-8 text-[13px] rounded-lg border-[#e8eaed] text-[#374151] hover:bg-[#f8f9fb] gap-1.5"
              onClick={() => navigate('/dashboard/content-calendar')}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Planner</span>
            </Button>
            <Button
              size="sm"
              className="h-8 text-[13px] rounded-lg gap-1.5 bg-[#0a66c2] hover:bg-[#0958a8]"
              onClick={goToCreatePost}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Post</span>
            </Button>
          </div>

        </div>
      </div>

      {error && <PageError message={error} onRetry={() => fetchPosts()} />}

      {/* ── LinkedIn connect banner ───────────────────────────────────── */}
      {!isLoading && !isLinkedInConnected && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#bfdbfe]">
            <Linkedin className="h-4 w-4 text-[#0a66c2]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#1e40af]">Connect your LinkedIn account</p>
            <p className="text-[12px] text-[#3b82f6] mt-0.5">Link LinkedIn to publish and schedule posts directly.</p>
          </div>
          <Button size="sm" className="shrink-0 rounded-lg bg-[#0a66c2] hover:bg-[#0958a8]" onClick={connect} disabled={connectLoading}>
            Connect
          </Button>
        </div>
      )}

      {/* ── Onboarding ────────────────────────────────────────────────── */}
      {showOnboarding && (
        <div className="bg-white rounded-xl border border-[#e8eaed] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-[#111827]">Get started</p>
            <button
              className="text-[11px] text-[#9ca3af] hover:text-[#6b7280]"
              onClick={() => { localStorage.setItem('linkedinflow_onboarding_dismissed', '1'); setOnboardingDismissed(true); }}
            >
              Dismiss
            </button>
          </div>
          <div className="space-y-2">
            {onboardingSteps.map(s => (
              <div
                key={s.label}
                className={cn('flex items-center gap-3', !s.done && 'cursor-pointer')}
                onClick={() => !s.done && navigate(s.href)}
              >
                <div className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  s.done ? 'border-emerald-500 bg-emerald-500' : 'border-[#d1d5db]',
                )}>
                  {s.done && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <span className={cn('text-[13px]', s.done ? 'line-through text-[#9ca3af]' : 'text-[#374151]')}>{s.label}</span>
                {!s.done && <ArrowUpRight className="h-3.5 w-3.5 text-[#9ca3af] ml-auto" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Metric cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Posts" value={posts.length}
          sub="All time"
          icon={FileText} iconBg="bg-[#eff6ff]" iconColor="text-[#0a66c2]"
          onClick={() => navigate('/dashboard/posts')} loading={isLoading}
        />
        <MetricCard
          label="Published" value={publishedCount}
          sub={posts.length > 0 ? `${Math.round((publishedCount / posts.length) * 100)}% success rate` : 'No posts yet'}
          icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600"
          onClick={() => navigate('/dashboard/posts')} loading={isLoading}
        />
        <MetricCard
          label="Scheduled" value={scheduledCount}
          sub={scheduledCount > 0 ? 'Queued to publish' : 'Nothing scheduled'}
          icon={Calendar} iconBg="bg-blue-50" iconColor="text-blue-600"
          onClick={() => navigate('/dashboard/posts')} loading={isLoading}
        />
        <MetricCard
          label="Drafts" value={draftCount}
          sub={failedCount > 0 ? `${failedCount} failed — needs review` : 'Ready to publish'}
          icon={Activity} iconBg={failedCount > 0 ? 'bg-red-50' : 'bg-amber-50'} iconColor={failedCount > 0 ? 'text-red-500' : 'text-amber-600'}
          onClick={() => navigate('/dashboard/posts')} loading={isLoading}
        />
      </div>

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {!isLoading && posts.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-[#d1d5db] p-6 sm:p-10 text-center">
          <div className="h-10 w-10 rounded-full bg-[#f3f4f6] flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="h-5 w-5 text-[#9ca3af]" />
          </div>
          <p className="text-[14px] font-semibold text-[#111827]">Welcome to LinkedInFlow</p>
          <p className="text-[13px] text-[#9ca3af] mt-1 max-w-xs mx-auto">Create your first post to start growing your LinkedIn audience.</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button size="sm" className="rounded-lg" onClick={goToCreatePost}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create post
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => navigate('/dashboard/posts?import=1')}>
              Import posts
            </Button>
          </div>
        </div>
      )}

      {/* ── Main 2-column layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">

        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="space-y-4 min-w-0 overflow-hidden">

          {/* Publishing activity chart */}
          <div className="bg-white rounded-xl border border-[#e8eaed]">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-3 sm:py-4 border-b border-[#f0f0f0]">
              <div>
                <p className="text-[14px] font-semibold text-[#111827]">Publishing Activity</p>
                <p className="text-[12px] text-[#9ca3af] mt-0.5">Posts published over time</p>
              </div>
              <div className="flex items-center gap-0.5 bg-[#f3f4f6] rounded-lg p-0.5">
                {(['7D', '30D', '90D'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors',
                      chartRange === r ? 'bg-white text-[#111827] shadow-sm' : 'text-[#9ca3af] hover:text-[#6b7280]',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 sm:p-5">
              {isLoading ? (
                <Skeleton className="h-[140px] w-full rounded-lg" />
              ) : hasActivity ? (
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={activityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0a66c2" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0a66c2" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#e8eaed', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="count" stroke="#0a66c2" strokeWidth={2} fill="url(#grad)" dot={false} activeDot={{ r: 4, fill: '#0a66c2', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[140px] flex-col items-center justify-center gap-2 text-center">
                  <BarChart3 className="h-8 w-8 text-[#e5e7eb]" />
                  <p className="text-[13px] font-medium text-[#374151]">No published posts yet</p>
                  <p className="text-[12px] text-[#9ca3af]">Activity appears after your first publish.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent posts */}
          <div className="bg-white rounded-xl border border-[#e8eaed]">
            <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-[#f0f0f0]">
              <p className="text-[14px] font-semibold text-[#111827]">Recent Posts</p>
              {posts.length > 0 && (
                <button
                  className="text-[12px] text-[#0a66c2] font-medium hover:underline flex items-center gap-0.5"
                  onClick={() => navigate('/dashboard/posts')}
                >
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="divide-y divide-[#f8f9fb]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 sm:px-5 py-3.5">
                    <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                    <Skeleton className="flex-1 h-3.5" />
                    <Skeleton className="h-3 w-10 shrink-0" />
                    <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentPosts.length > 0 ? (
              <div className="divide-y divide-[#f8f9fb]">
                {recentPosts.map(post => {
                  const meta = statusMeta[post.status] ?? statusMeta['draft'];
                  return (
                    <div
                      key={post.id}
                      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3.5 hover:bg-[#fafafa] transition-colors cursor-pointer"
                      onClick={() => navigate('/dashboard/posts')}
                    >
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', meta.dot)} />
                      <p className="flex-1 min-w-0 text-[13px] text-[#374151] truncate">{post.content}</p>
                      <span className="hidden sm:inline text-[11px] text-[#9ca3af] shrink-0">{format(new Date(post.created_at), 'MMM d')}</span>
                      <Badge variant="outline" className={cn('shrink-0 text-[10px] font-medium capitalize', meta.badge)}>
                        {meta.label}
                      </Badge>
                    </div>
                  );
                })}
                {posts.length > 6 && (
                  <div className="px-5 py-3 text-center">
                    <button
                      className="text-[12px] text-[#0a66c2] font-medium hover:underline"
                      onClick={() => navigate('/dashboard/posts')}
                    >
                      +{posts.length - 6} more posts
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 sm:py-10 gap-3 text-center px-4 sm:px-5">
                <div className="h-9 w-9 rounded-full bg-[#f3f4f6] flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-[#d1d5db]" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#374151]">No posts yet</p>
                  <p className="text-[12px] text-[#9ca3af] mt-0.5">Create your first post to get started.</p>
                </div>
                <Button size="sm" className="rounded-lg" onClick={goToCreatePost}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Create post
                </Button>
              </div>
            )}
          </div>

          {/* This week's ideas */}
          <div className="bg-white rounded-xl border border-[#e8eaed]">
            <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-[#111827]">This Week's Ideas</p>
                {weeklyIdeas.length > 0 && (
                  <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                    {weeklyIdeas.length}
                  </span>
                )}
              </div>
              <button
                className="text-[12px] text-[#0a66c2] font-medium hover:underline"
                onClick={() => navigate('/dashboard/ideas')}
              >
                View all
              </button>
            </div>
            <div className="p-4">
              {weeklyIdeas.length === 0 ? (
                <div className="flex items-center justify-between rounded-lg border border-dashed border-[#e5e7eb] bg-[#fafafa] px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Lightbulb className="h-4 w-4 text-[#d1d5db]" />
                    <p className="text-[13px] text-[#9ca3af]">No ideas captured this week</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-lg text-[12px] h-7" onClick={() => navigate('/dashboard/ideas')}>
                    Capture
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {weeklyIdeas.slice(0, 4).map(idea => (
                    <div
                      key={idea.id}
                      className="flex items-center gap-2.5 rounded-lg border border-[#f0f0f0] bg-[#fafafa] px-3 py-2.5 cursor-pointer hover:border-[#e8eaed] hover:bg-white transition-colors"
                      onClick={() => navigate('/dashboard/ideas')}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      <p className="flex-1 min-w-0 text-[13px] text-[#374151] truncate">{idea.text}</p>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', tagColors[idea.tag] ?? 'bg-amber-50 text-amber-700')}>
                        {idea.tag}
                      </span>
                    </div>
                  ))}
                  {weeklyIdeas.length > 4 && (
                    <button className="w-full text-center text-[12px] text-[#0a66c2] font-medium py-1 hover:underline" onClick={() => navigate('/dashboard/ideas')}>
                      +{weeklyIdeas.length - 4} more ideas
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Right column ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 min-w-0">

          {/* Status summary */}
          <div className="bg-white rounded-xl border border-[#e8eaed] p-4">
            <p className="text-[13px] font-semibold text-[#111827] mb-3">Status Overview</p>
            {isLoading ? (
              <div className="space-y-2.5">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-1.5">
                {[
                  { label: 'Published',  count: publishedCount, bar: 'bg-emerald-500', href: '/dashboard/posts?tab=published' },
                  { label: 'Scheduled',  count: scheduledCount, bar: 'bg-blue-500',    href: '/dashboard/posts?tab=scheduled' },
                  { label: 'Drafts',     count: draftCount,     bar: 'bg-amber-400',   href: '/dashboard/posts?tab=draft'     },
                  { label: 'Failed',     count: failedCount,    bar: 'bg-red-400',     href: '/dashboard/posts?tab=failed'    },
                ].map(row => {
                  const pct = posts.length > 0 ? Math.round((row.count / posts.length) * 100) : 0;
                  return (
                    <div
                      key={row.label}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#f8f9fb] cursor-pointer transition-colors"
                      onClick={() => navigate(row.href)}
                    >
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', row.bar)} />
                      <span className="flex-1 text-[13px] text-[#374151]">{row.label}</span>
                      <span className="text-[13px] font-semibold text-[#111827] tabular-nums w-5 text-right">{row.count}</span>
                      <div className="w-16 h-1.5 rounded-full bg-[#f3f4f6] overflow-hidden shrink-0">
                        <div className={cn('h-full rounded-full', row.bar)} style={{ width: `${pct}%`, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI action prompt */}
          {showDailyPrompt && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <p className="text-[13px] font-semibold text-[#92400e]">Ready to create</p>
                </div>
                <button onClick={() => setDailyPromptDismissed(true)} className="text-[11px] text-amber-500 hover:text-amber-700">
                  dismiss
                </button>
              </div>
              <p className="text-[12px] text-amber-700 mb-3 leading-relaxed">
                You have <span className="font-semibold">{ideas.length} idea{ideas.length !== 1 ? 's' : ''}</span> captured.
                {slotLabel ? <> Next queue slot is <span className="font-semibold">{slotLabel}</span>.</> : <> Turn one into a LinkedIn post with AI.</>}
              </p>
              <Button
                size="sm"
                className="w-full h-8 text-[12px] rounded-lg bg-amber-500 hover:bg-amber-600 text-white border-0"
                onClick={() => navigate('/dashboard/ai-interview')}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Turn idea into post
              </Button>
            </div>
          )}

          {/* Upcoming queue */}
          <div className="bg-white rounded-xl border border-[#e8eaed] flex-1">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#9ca3af]" />
                <p className="text-[13px] font-semibold text-[#111827]">Upcoming Queue</p>
              </div>
              {scheduledCount > 0 && (
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">
                  {scheduledCount}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : upcomingPosts.length > 0 ? (
              <div className="divide-y divide-[#f8f9fb]">
                {upcomingPosts.map((post, i) => (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[#fafafa] cursor-pointer transition-colors"
                    onClick={() => navigate('/dashboard/posts')}
                  >
                    <span className="text-[11px] font-bold text-[#d1d5db] tabular-nums mt-0.5 w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#374151] truncate leading-snug">{post.content}</p>
                      <p className="text-[11px] text-[#9ca3af] mt-0.5">
                        {format(new Date(post.scheduled_at!), 'MMM d · h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                {scheduledCount > 5 && (
                  <div className="px-4 py-2.5 text-center">
                    <button className="text-[12px] text-[#0a66c2] font-medium hover:underline" onClick={() => navigate('/dashboard/posts')}>
                      +{scheduledCount - 5} more
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-2">
                <TrendingUp className="h-7 w-7 text-[#e5e7eb]" />
                <p className="text-[13px] font-medium text-[#374151]">Queue is empty</p>
                <p className="text-[12px] text-[#9ca3af]">Schedule a post to fill it up.</p>
                <Button
                  size="sm" variant="outline"
                  className="rounded-lg mt-1 text-[12px]"
                  onClick={goToCreatePost}
                >
                  Schedule post
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
