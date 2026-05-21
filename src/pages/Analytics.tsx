import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Play,
  Plus,
  AlertCircle,
  Copy,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts';
import { useLinkedInStore } from '@/store/useLinkedInStore';
import { postsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

type DateRange = '7d' | '30d' | '90d';
type TabId = 'overview' | 'posts' | 'scheduled' | 'breakdown';

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e8eaed] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)] px-3 py-2 text-xs">
      <p className="font-semibold text-[#111827] mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-[#6b7280]">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.fill || p.stroke }} />
          {p.name}: <span className="font-semibold text-[#111827] ml-auto pl-3">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[11px] text-[#9ca3af]">{label}</span>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[180px] flex-col items-center justify-center gap-2 text-center">
      <BarChart3 className="h-7 w-7 text-[#d1d5db]" />
      <p className="text-[13px] text-[#9ca3af]">{label}</p>
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function Analytics() {
  const { posts, setPosts } = useLinkedInStore();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
    if (posts.length === 0) {
      postsAPI.getPosts()
        .then(d => setPosts(d.posts ?? []))
        .catch(() => {});
    }
  }, []);

  const rangeDays  = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
  const monthCount = dateRange === '7d' ? 1 : dateRange === '30d' ? 3 : 6;

  // ── Derived stats ────────────────────────────────────────────────────────────
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount     = posts.filter(p => p.status === 'draft').length;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const failedCount    = posts.filter(p => p.status === 'failed').length;
  const successRate    = (publishedCount + failedCount) > 0
    ? Math.round((publishedCount / (publishedCount + failedCount)) * 100)
    : 0;

  const activityData = useMemo(() => {
    return Array.from({ length: rangeDays }, (_, i) => {
      const day    = subDays(new Date(), rangeDays - 1 - i);
      const dayStr = day.toDateString();
      const label  = rangeDays === 7 ? format(day, 'EEE') : format(day, 'M/d');
      const total  = posts.filter(p => new Date(p.created_at).toDateString() === dayStr).length;
      const published = posts.filter(p =>
        new Date(p.created_at).toDateString() === dayStr && p.status === 'published',
      ).length;
      return { name: label, total, published };
    });
  }, [posts, rangeDays]);

  const STATUS_COLORS = { published: '#10b981', draft: '#f59e0b', scheduled: '#3b82f6', failed: '#ef4444' };
  const TYPE_COLORS   = { text: '#3b82f6', image: '#10b981', link: '#f59e0b', video: '#ef4444' };

  const statusData = useMemo(() => [
    { name: 'Published', value: publishedCount, color: STATUS_COLORS.published },
    { name: 'Draft',     value: draftCount,     color: STATUS_COLORS.draft     },
    { name: 'Scheduled', value: scheduledCount, color: STATUS_COLORS.scheduled },
    { name: 'Failed',    value: failedCount,    color: STATUS_COLORS.failed    },
  ].filter(s => s.value > 0), [publishedCount, draftCount, scheduledCount, failedCount]);

  const typeData = useMemo(() => [
    { name: 'Text',  value: posts.filter(p => p.post_type === 'text').length,  color: TYPE_COLORS.text  },
    { name: 'Image', value: posts.filter(p => p.post_type === 'image').length, color: TYPE_COLORS.image },
    { name: 'Link',  value: posts.filter(p => p.post_type === 'link').length,  color: TYPE_COLORS.link  },
    { name: 'Video', value: posts.filter(p => p.post_type === 'video').length, color: TYPE_COLORS.video },
  ].filter(s => s.value > 0), [posts]);

  const scheduledPosts = useMemo(() =>
    posts
      .filter(p => p.status === 'scheduled' && p.scheduled_at)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()),
    [posts],
  );

  const recentPosts = useMemo(() =>
    [...posts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8),
    [posts],
  );

  const monthlyData = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const today  = new Date();
    return Array.from({ length: monthCount }, (_, i) => {
      const d  = new Date(today.getFullYear(), today.getMonth() - (monthCount - 1 - i), 1);
      const mo = d.getMonth(), yr = d.getFullYear();
      const total     = posts.filter(p => { const pd = new Date(p.created_at); return pd.getMonth() === mo && pd.getFullYear() === yr; }).length;
      const published = posts.filter(p => { const pd = new Date(p.created_at); return pd.getMonth() === mo && pd.getFullYear() === yr && p.status === 'published'; }).length;
      return { name: months[mo], total, published };
    });
  }, [posts, monthCount]);

  const publishedChange = useMemo(() => {
    if (monthlyData.length < 2) return { pct: 0, up: false };
    const last = monthlyData[monthlyData.length - 1].published;
    const prev = monthlyData[monthlyData.length - 2].published;
    if (prev === 0) return { pct: last === 0 ? 0 : 100, up: last > prev };
    const diff = last - prev;
    return { pct: Math.abs(Math.round((diff / prev) * 100)), up: diff >= 0 };
  }, [monthlyData]);

  const bestDayTime = useMemo(() => {
    const published = posts.filter(p => p.status === 'published' && p.published_at);
    if (published.length < 3) return null;
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dayCounts = new Array(7).fill(0), hourCounts = new Array(24).fill(0);
    published.forEach(p => {
      const d = new Date(p.published_at!);
      dayCounts[d.getDay()]++;
      hourCounts[d.getHours()]++;
    });
    const bestDayIdx  = dayCounts.indexOf(Math.max(...dayCounts));
    const bestHourIdx = hourCounts.indexOf(Math.max(...hourCounts));
    const ampm = bestHourIdx >= 12 ? 'PM' : 'AM';
    const h12  = bestHourIdx % 12 === 0 ? 12 : bestHourIdx % 12;
    return { day: days[bestDayIdx], hourLabel: `${h12}:00 ${ampm}`, dayCount: dayCounts[bestDayIdx], hourCount: hourCounts[bestHourIdx] };
  }, [posts]);

  const topPublishedPosts = useMemo(() =>
    [...posts]
      .filter(p => p.status === 'published')
      .sort((a, b) => new Date(b.published_at ?? b.created_at).getTime() - new Date(a.published_at ?? a.created_at).getTime())
      .slice(0, 5),
    [posts],
  );

  const typeIcon = { text: FileText, image: ImageIcon, link: LinkIcon, video: Play } as const;

  const statusPill: Record<string, string> = {
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft:     'bg-amber-50 text-amber-700 border-amber-200',
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    failed:    'bg-rose-50 text-rose-700 border-rose-200',
  };

  const TABS = [
    { id: 'overview'  as TabId, label: 'Overview',  icon: BarChart3     },
    { id: 'posts'     as TabId, label: 'Posts',      icon: MessageSquare },
    { id: 'scheduled' as TabId, label: 'Scheduled',  icon: Calendar, count: scheduledCount },
    { id: 'breakdown' as TabId, label: 'Breakdown',  icon: Target        },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 animate-fade-in">

      {/* ── Action bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        <div className="flex items-center p-0.5 rounded-lg border border-[#e8eaed] bg-white">
          {(['7d', '30d', '90d'] as DateRange[]).map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={cn(
                'h-7 px-3 text-[12px] font-medium rounded-md transition-colors',
                dateRange === r ? 'bg-[#0a66c2] text-white' : 'text-[#6b7280] hover:text-[#374151]',
              )}
            >{r}</button>
          ))}
        </div>
        <button
          onClick={() => navigate('/dashboard/create-post')}
          className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-[#0a66c2] hover:bg-[#0958a8] text-white text-[13px] font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Create post
        </button>
      </div>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Posts',  value: posts.length,   icon: MessageSquare, iconBg: 'bg-[#0a66c2]/10', iconColor: 'text-[#0a66c2]' },
          { label: 'Published',    value: publishedCount, icon: CheckCircle,   iconBg: 'bg-emerald-50',   iconColor: 'text-emerald-600' },
          { label: 'Success Rate', value: successRate,    icon: TrendingUp,    iconBg: 'bg-[#0a66c2]/10', iconColor: 'text-[#0a66c2]', suffix: '%' },
          { label: 'Scheduled',    value: scheduledCount, icon: Calendar,      iconBg: 'bg-amber-50',     iconColor: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.05)] px-4 py-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#6b7280]">{s.label}</span>
              <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0', s.iconBg)}>
                <s.icon className={cn('h-3.5 w-3.5', s.iconColor)} />
              </div>
            </div>
            <p className="text-[26px] font-bold tracking-tight tabular-nums leading-none text-[#111827]">
              {s.value}{s.suffix ?? ''}
            </p>
          </div>
        ))}
      </div>

      {/* ── Main card ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.05)] flex flex-col">

        {/* Tab bar */}
        <div className="flex items-center border-b border-[#e8eaed] px-2 shrink-0 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-1.5 h-10 px-3 text-[13px] font-medium transition-colors whitespace-nowrap shrink-0',
                activeTab === tab.id ? 'text-[#0a66c2]' : 'text-[#6b7280] hover:text-[#374151]',
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count != null && tab.count > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#eff6ff] text-[#0a66c2]">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0a66c2] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4">

          {/* ── Overview ─────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-4">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Activity chart */}
                <div className="rounded-xl border border-[#e8eaed] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e8eaed] bg-[#fafafa]">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5 text-[#0a66c2]" />
                      <span className="text-[13px] font-semibold text-[#111827]">Activity</span>
                    </div>
                    <span className="text-[11px] font-medium text-[#0a66c2] bg-[#eff6ff] border border-[#dce6f1] rounded-full px-2 py-0.5">
                      Last {dateRange}
                    </span>
                  </div>
                  <div className="p-4">
                    {posts.length === 0 ? <EmptyChart label="Create posts to see activity" /> : (
                      <>
                        <ResponsiveContainer width="100%" height={150}>
                          <BarChart data={activityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8f9fb' }} />
                            <Bar dataKey="total"     name="Created"   fill="#e5e7eb" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="published" name="Published" fill="#0a66c2" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="flex gap-3 mt-2 pl-1">
                          <LegendDot color="#e5e7eb" label="Created" />
                          <LegendDot color="#0a66c2" label="Published" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Status distribution */}
                <div className="rounded-xl border border-[#e8eaed] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8eaed] bg-[#fafafa]">
                    <Target className="h-3.5 w-3.5 text-[#0a66c2]" />
                    <span className="text-[13px] font-semibold text-[#111827]">Status Distribution</span>
                  </div>
                  <div className="p-4">
                    {posts.length === 0 || statusData.length === 0 ? <EmptyChart label="No data yet" /> : (
                      <div className="flex items-center gap-4">
                        <div className="relative w-40 shrink-0">
                          <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                              <Pie data={statusData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2} dataKey="value">
                                {statusData.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} strokeWidth={1} stroke="#fff" />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-[20px] font-bold text-[#111827] tabular-nums">{posts.length}</p>
                            <p className="text-[10px] text-[#9ca3af]">total</p>
                          </div>
                        </div>
                        <div className="flex-1 space-y-2.5">
                          {statusData.map(s => {
                            const pct = Math.round((s.value / (posts.length || 1)) * 100);
                            return (
                              <div key={s.name}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1.5">
                                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                                    <span className="text-[12px] font-medium text-[#374151]">{s.name}</span>
                                  </div>
                                  <span className="text-[11px] text-[#9ca3af]">{s.value} · {pct}%</span>
                                </div>
                                <div className="h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly trend */}
              <div className="rounded-xl border border-[#e8eaed] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e8eaed] bg-[#fafafa]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-[#0a66c2]" />
                    <span className="text-[13px] font-semibold text-[#111827]">Monthly Trend</span>
                  </div>
                  <span className="text-[11px] font-medium text-[#0a66c2] bg-[#eff6ff] border border-[#dce6f1] rounded-full px-2 py-0.5">
                    Last {monthCount}mo
                  </span>
                </div>

                {/* Summary row */}
                <div className="grid grid-cols-3 divide-x divide-[#f3f4f6] border-b border-[#e8eaed]">
                  {[
                    { label: 'Total Created', value: monthlyData.reduce((s, m) => s + m.total, 0),     color: '#9ca3af' },
                    { label: 'Published',     value: monthlyData.reduce((s, m) => s + m.published, 0), color: '#0a66c2', change: publishedChange },
                    { label: 'Avg / Month',   value: monthlyData.length ? Math.round(monthlyData.reduce((s, m) => s + m.published, 0) / monthlyData.length) : 0, color: '#10b981' },
                  ].map(s => (
                    <div key={s.label} className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <p className="text-[22px] font-bold tabular-nums leading-none" style={{ color: s.color }}>{s.value}</p>
                        {s.change && (
                          <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded-full', s.change.up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
                            {s.change.up ? '▲' : '▼'} {s.change.pct}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                        <p className="text-[10px] font-medium text-[#9ca3af] uppercase tracking-wide">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 pt-3 pb-2">
                  {posts.length === 0 ? <EmptyChart label="No posts yet" /> : (
                    <>
                      <ResponsiveContainer width="100%" height={130}>
                        <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="34%">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8f9fb' }} />
                          <Bar dataKey="total"     name="Created"   fill="#e5e7eb" radius={[5, 5, 0, 0]} barSize={18} />
                          <Bar dataKey="published" name="Published" fill="#0a66c2" radius={[5, 5, 0, 0]} barSize={12}>
                            <LabelList dataKey="published" position="top" content={({ x, y, value }: any) =>
                              value > 0 ? <text x={x} y={y - 5} textAnchor="middle" fill="#374151" fontSize={10} fontWeight={600}>{value}</text> : null
                            } />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex gap-3 mt-2 pl-1">
                        <LegendDot color="#e5e7eb" label="Created" />
                        <LegendDot color="#0a66c2" label="Published" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Best time */}
              {bestDayTime && (
                <div className="rounded-xl border border-[#e8eaed] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e8eaed] bg-[#fafafa]">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-[#0a66c2]" />
                      <span className="text-[13px] font-semibold text-[#111827]">Best Time to Post</span>
                    </div>
                    <span className="text-[11px] font-medium text-[#0a66c2] bg-[#eff6ff] border border-[#dce6f1] rounded-full px-2 py-0.5">
                      AI Insight
                    </span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-[#f3f4f6]">
                    {[
                      { label: 'Best Day',  value: bestDayTime.day,       sub: `${bestDayTime.dayCount} posts published`,  barPct: (bestDayTime.dayCount / posts.filter(p => p.status === 'published' && p.published_at).length) * 100, color: '#0a66c2',  Icon: Calendar },
                      { label: 'Best Hour', value: bestDayTime.hourLabel, sub: `${bestDayTime.hourCount} posts published`, barPct: (bestDayTime.hourCount / posts.filter(p => p.status === 'published' && p.published_at).length) * 100, color: '#10b981', Icon: Clock    },
                    ].map(s => (
                      <div key={s.label} className="px-5 py-4 space-y-2.5">
                        <div className="flex items-center gap-1.5">
                          <s.Icon className="h-3.5 w-3.5 text-[#9ca3af]" />
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">{s.label}</p>
                        </div>
                        <p className="text-[18px] font-bold text-[#111827] leading-none">{s.value}</p>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                          <p className="text-[11px] text-[#9ca3af]">{s.sub}</p>
                        </div>
                        <div className="h-1.5 w-full bg-[#f3f4f6] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.barPct)}%`, background: s.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Posts ────────────────────────────────────────── */}
          {activeTab === 'posts' && (
            <div className="space-y-4">

              {/* Recent posts */}
              <div className="rounded-xl border border-[#e8eaed] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8eaed] bg-[#fafafa]">
                  <MessageSquare className="h-3.5 w-3.5 text-[#0a66c2]" />
                  <span className="text-[13px] font-semibold text-[#111827]">Recent Posts</span>
                </div>
                <div className="divide-y divide-[#f3f4f6]">
                  {recentPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                      <div className="h-12 w-12 rounded-xl bg-[#f8f9fb] border border-[#e8eaed] flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-[#d1d5db]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#111827]">No posts yet</p>
                        <p className="text-[12px] text-[#9ca3af] mt-0.5">Create your first post to see it here.</p>
                      </div>
                      <button onClick={() => navigate('/dashboard/create-post')} className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-[#0a66c2] hover:bg-[#0958a8] text-white text-[12px] font-medium transition-colors">
                        <Plus className="h-3.5 w-3.5" />Create post
                      </button>
                    </div>
                  ) : recentPosts.map(post => {
                    const TypeIcon = typeIcon[post.post_type] ?? FileText;
                    return (
                      <div key={post.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-[13px] text-[#111827] line-clamp-1 leading-relaxed">{post.content}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#9ca3af]">
                            <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10.5px] font-medium capitalize', statusPill[post.status] ?? '')}>
                              {post.status}
                            </span>
                            <span className="flex items-center gap-1"><TypeIcon className="h-3 w-3" />{post.post_type}</span>
                            <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                            {post.scheduled_at && post.status === 'scheduled' && (
                              <span className="text-[#0a66c2]">· Sends {format(new Date(post.scheduled_at), 'MMM d, h:mm a')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Published posts */}
              {topPublishedPosts.length > 0 && (
                <div className="rounded-xl border border-[#e8eaed] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8eaed] bg-[#fafafa]">
                    <CheckCircle className="h-3.5 w-3.5 text-[#0a66c2]" />
                    <span className="text-[13px] font-semibold text-[#111827]">Published Posts</span>
                  </div>
                  <div className="divide-y divide-[#f3f4f6]">
                    {topPublishedPosts.map(post => (
                      <div key={post.id} className="group flex items-start gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="text-[13px] text-[#111827] line-clamp-2 leading-relaxed">{post.content}</p>
                          <p className="text-[11px] text-[#9ca3af]">
                            {post.content.length} chars
                            {post.published_at && <> · Published {format(new Date(post.published_at), 'MMM d, yyyy')}</>}
                          </p>
                        </div>
                        <button
                          onClick={() => { navigator.clipboard.writeText(post.content); toast.success('Copied to clipboard.'); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#f3f4f6] text-[#9ca3af] hover:text-[#374151] shrink-0 mt-0.5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Scheduled ────────────────────────────────────── */}
          {activeTab === 'scheduled' && (
            <div className="rounded-xl border border-[#e8eaed] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8eaed] bg-[#fafafa]">
                <Calendar className="h-3.5 w-3.5 text-[#0a66c2]" />
                <span className="text-[13px] font-semibold text-[#111827]">Upcoming Queue</span>
              </div>
              {scheduledPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="h-12 w-12 rounded-xl bg-[#f8f9fb] border border-[#e8eaed] flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-[#d1d5db]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111827]">No scheduled posts</p>
                    <p className="text-[12px] text-[#9ca3af] mt-0.5">Schedule a post to see your queue.</p>
                  </div>
                  <button onClick={() => navigate('/dashboard/create-post')} className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-[#0a66c2] hover:bg-[#0958a8] text-white text-[12px] font-medium transition-colors">
                    <Plus className="h-3.5 w-3.5" />Schedule a post
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#f3f4f6]">
                  {scheduledPosts.map((post, idx) => {
                    const scheduledDate = new Date(post.scheduled_at!);
                    const isToday = scheduledDate.toDateString() === new Date().toDateString();
                    const isPast  = scheduledDate < new Date();
                    return (
                      <div key={post.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-[#eff6ff] text-[#0a66c2]">
                          <span className="text-[9px] font-semibold uppercase leading-none">{format(scheduledDate, 'MMM')}</span>
                          <span className="text-[14px] font-bold leading-tight">{scheduledDate.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[#111827] line-clamp-1 leading-relaxed">{post.content}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px]">
                            <span className={cn('font-medium', isPast ? 'text-rose-600' : isToday ? 'text-amber-600' : 'text-[#0a66c2]')}>
                              {isPast ? 'Overdue · ' : isToday ? 'Today · ' : ''}{format(scheduledDate, 'h:mm a')}
                            </span>
                            {isPast && (
                              <span className="flex items-center gap-1 text-rose-600">
                                <AlertCircle className="h-3 w-3" />Pending publish
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-[#9ca3af] shrink-0 mt-0.5">#{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Breakdown ────────────────────────────────────── */}
          {activeTab === 'breakdown' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* By status */}
                <div className="rounded-xl border border-[#e8eaed] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8eaed] bg-[#fafafa]">
                    <Target className="h-3.5 w-3.5 text-[#0a66c2]" />
                    <span className="text-[13px] font-semibold text-[#111827]">By Status</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {posts.length === 0 ? (
                      <p className="text-[12px] text-[#9ca3af] text-center py-4">No posts yet.</p>
                    ) : [
                      { label: 'Published', count: publishedCount, color: '#10b981', icon: CheckCircle },
                      { label: 'Draft',     count: draftCount,     color: '#f59e0b', icon: Clock       },
                      { label: 'Scheduled', count: scheduledCount, color: '#3b82f6', icon: Calendar    },
                      { label: 'Failed',    count: failedCount,    color: '#ef4444', icon: XCircle     },
                    ].map(item => {
                      const pct  = posts.length > 0 ? Math.round((item.count / posts.length) * 100) : 0;
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="rounded-lg border border-[#f3f4f6] bg-[#fafafa] px-3 py-2.5">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                              <span className="text-[12px] font-medium text-[#374151]">{item.label}</span>
                            </div>
                            <span className="text-[12px] font-semibold text-[#111827]">
                              {item.count} <span className="text-[#9ca3af] font-normal">({pct}%)</span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[#e5e7eb] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: item.color, width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* By type */}
                <div className="rounded-xl border border-[#e8eaed] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8eaed] bg-[#fafafa]">
                    <FileText className="h-3.5 w-3.5 text-[#0a66c2]" />
                    <span className="text-[13px] font-semibold text-[#111827]">By Content Type</span>
                  </div>
                  <div className="p-4">
                    {typeData.length === 0 ? <EmptyChart label="No posts yet" /> : (
                      <div className="space-y-3">
                        <ResponsiveContainer width="100%" height={150}>
                          <PieChart>
                            <Pie data={typeData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2} dataKey="value" label={false}>
                              {typeData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} strokeWidth={1} stroke="#fff" />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v, n) => [`${v} posts`, n]} content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-2">
                          {typeData.map(d => {
                            const Icon = typeIcon[d.name.toLowerCase() as keyof typeof typeIcon] || FileText;
                            const pct  = Math.round((d.value / typeData.reduce((s, i) => s + i.value, 0)) * 100);
                            return (
                              <div key={d.name} className="rounded-lg border border-[#f3f4f6] bg-[#fafafa] p-2">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <Icon className="h-3.5 w-3.5" style={{ color: d.color }} />
                                  <span className="text-[12px] font-medium text-[#374151] capitalize">{d.name}</span>
                                </div>
                                <p className="text-[11px] text-[#9ca3af]">
                                  {d.value} posts <span className="text-[#374151] font-semibold">({pct}%)</span>
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Publishing rate */}
              <div className="rounded-xl border border-[#e8eaed] p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#0a66c2 ${successRate * 3.6}deg, #e5e7eb 0deg)`,
                      mask: 'radial-gradient(circle at center, transparent 55%, black 56%)',
                      WebkitMask: 'radial-gradient(circle at center, transparent 55%, black 56%)',
                    }}
                  />
                  <span className="text-[18px] font-bold text-[#0a66c2] relative z-10">{successRate}%</span>
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-[14px] font-semibold text-[#111827]">Publishing Rate</p>
                  <p className="text-[13px] text-[#9ca3af]">
                    {publishedCount} of {posts.length} posts successfully published to LinkedIn.
                    {failedCount > 0 && ` ${failedCount} failed — check the Posts page.`}
                  </p>
                </div>
                <div className="sm:ml-auto shrink-0">
                  <button
                    onClick={() => navigate('/dashboard/posts')}
                    className="h-8 px-3 rounded-lg border border-[#e8eaed] text-[13px] font-medium text-[#374151] hover:bg-[#f8f9fb] transition-colors"
                  >
                    View all posts
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
