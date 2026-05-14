import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Legend,
  LabelList,
} from 'recharts';
import { useLinkedInStore } from '@/store/useLinkedInStore';
import { postsAPI } from '@/lib/api';
import { designSystem } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

type DateRange = '7d' | '30d' | '90d';

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-[var(--shadow-md)] px-3 py-2.5 text-xs">
      <p className="font-medium text-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.fill || p.stroke }} />
          {p.name}: <span className="font-semibold text-foreground ml-auto pl-3">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function Analytics() {
  const { posts, setPosts } = useLinkedInStore();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  // Passive background fetch if store is empty
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

  // ── Activity by date range ───────────────────────────────────────────────────
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

  // ── Status distribution ──────────────────────────────────────────────────────
  const statusData = useMemo(() => {
    return [
      { name: 'Published', value: publishedCount, color: designSystem.colors.success },
      { name: 'Draft',     value: draftCount,     color: designSystem.colors.warning },
      { name: 'Scheduled', value: scheduledCount, color: designSystem.colors.info },
      { name: 'Failed',    value: failedCount,    color: designSystem.colors.danger },
    ].filter(s => s.value > 0);
  }, [publishedCount, draftCount, scheduledCount, failedCount]);

  // ── Post type distribution ───────────────────────────────────────────────────
  const typeData = useMemo(() => {
    return [
      { name: 'Text',  value: posts.filter(p => p.post_type === 'text').length,  color: designSystem.colors.info },
      { name: 'Image', value: posts.filter(p => p.post_type === 'image').length, color: designSystem.colors.success },
      { name: 'Link',  value: posts.filter(p => p.post_type === 'link').length,  color: designSystem.colors.warning },
      { name: 'Video', value: posts.filter(p => p.post_type === 'video').length, color: designSystem.colors.danger },
    ].filter(s => s.value > 0);
  }, [posts]);

  // ── Upcoming scheduled ──────────────────────────────────────────────────────
  const scheduledPosts = useMemo(() =>
    posts
      .filter(p => p.status === 'scheduled' && p.scheduled_at)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime()),
    [posts],
  );

  // ── Recent posts ────────────────────────────────────────────────────────────
  const recentPosts = useMemo(() =>
    [...posts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8),
    [posts],
  );

  // ── Monthly trend ────────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const today  = new Date();
    return Array.from({ length: monthCount }, (_, i) => {
      const d    = new Date(today.getFullYear(), today.getMonth() - (monthCount - 1 - i), 1);
      const mo   = d.getMonth();
      const yr   = d.getFullYear();
      const total     = posts.filter(p => { const pd = new Date(p.created_at); return pd.getMonth() === mo && pd.getFullYear() === yr; }).length;
      const published = posts.filter(p => { const pd = new Date(p.created_at); return pd.getMonth() === mo && pd.getFullYear() === yr && p.status === 'published'; }).length;
      return { name: months[mo], total, published };
    });
  }, [posts, monthCount]);

  // Published change vs previous month (for the last two months in the range)
  const publishedChange = useMemo(() => {
    if (monthlyData.length < 2) return { pct: 0, up: false };
    const lastIdx = monthlyData.length - 1;
    const last = monthlyData[lastIdx].published;
    const prev = monthlyData[lastIdx - 1].published;
    if (prev === 0) return { pct: last === 0 ? 0 : 100, up: last > prev };
    const diff = last - prev;
    const pct = Math.round((diff / prev) * 100);
    return { pct: Math.abs(pct), up: diff >= 0 } as const;
  }, [monthlyData]);

  // ── Best day / time to post ──────────────────────────────────────────────────
  const bestDayTime = useMemo(() => {
    const published = posts.filter(p => p.status === 'published' && p.published_at);
    if (published.length < 3) return null;

    const days       = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const dayCounts  = new Array(7).fill(0);
    const hourCounts = new Array(24).fill(0);

    published.forEach(p => {
      const d = new Date(p.published_at!);
      dayCounts[d.getDay()]++;
      hourCounts[d.getHours()]++;
    });

    const bestDayIdx  = dayCounts.indexOf(Math.max(...dayCounts));
    const bestHourIdx = hourCounts.indexOf(Math.max(...hourCounts));
    const bestHour    = bestHourIdx;
    const ampm        = bestHour >= 12 ? 'PM' : 'AM';
    const hour12      = bestHour % 12 === 0 ? 12 : bestHour % 12;

    return {
      day:       days[bestDayIdx],
      hourLabel: `${hour12}:00 ${ampm}`,
      dayCount:  dayCounts[bestDayIdx],
      hourCount: hourCounts[bestHourIdx],
    };
  }, [posts]);

  // ── Top published posts ──────────────────────────────────────────────────────
  const topPublishedPosts = useMemo(() =>
    [...posts]
      .filter(p => p.status === 'published')
      .sort((a, b) => new Date(b.published_at ?? b.created_at).getTime() - new Date(a.published_at ?? a.created_at).getTime())
      .slice(0, 5),
    [posts],
  );

  const statusMeta = {
    published: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', badge: 'badge-success' },
    draft:     { icon: Clock,       color: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-100 dark:bg-amber-900/30',     badge: 'badge-warning' },
    scheduled: { icon: Calendar,    color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-100 dark:bg-blue-900/30',       badge: 'badge-info' },
    failed:    { icon: XCircle,     color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-100 dark:bg-red-900/30',         badge: 'badge-error' },
  } as const;

  const typeIcon = { text: FileText, image: ImageIcon, link: LinkIcon, video: Play } as const;

  return (
    <div className="space-y-3 animate-fade-in">

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="space-y-4">

        {/* ── Top bar: tabs + controls ─────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview"  className="text-xs h-7 gap-1.5 text-black data-[state=active]:text-black"><BarChart3 className="h-3 w-3" />Overview</TabsTrigger>
            <TabsTrigger value="posts"     className="text-xs h-7 gap-1.5 text-black data-[state=active]:text-black"><MessageSquare className="h-3 w-3" />Posts</TabsTrigger>
            <TabsTrigger value="scheduled" className="text-xs h-7 gap-1.5 text-black data-[state=active]:text-black">
              <Calendar className="h-3 w-3" />Scheduled
              {scheduledCount > 0 && (
                <Badge variant="secondary" className="ml-0.5 text-[10px] px-1.5 py-0 h-4 badge-info border">
                  {scheduledCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="text-xs h-7 gap-1.5 text-black data-[state=active]:text-black"><Target className="h-3 w-3" />Breakdown</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 rounded-lg border border-border bg-muted/50">
              {(['7d', '30d', '90d'] as DateRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={cn(
                    'h-7 px-3 text-xs font-medium rounded-md transition-colors',
                    dateRange === r
                      ? 'bg-background text-foreground shadow-[var(--shadow-xs)]'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => navigate('/dashboard/create-post')}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create post
            </Button>
          </div>
        </div>

        {/* ── Summary metrics ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Posts',  value: posts.length,   icon: MessageSquare, color: 'text-primary',                              bg: 'bg-primary/10'   },
            { label: 'Published',    value: publishedCount, icon: CheckCircle,   color: 'text-green-600 dark:text-green-400',        bg: 'bg-green-500/10' },
            { label: 'Success Rate', value: successRate,    icon: TrendingUp,    color: 'text-primary',                              bg: 'bg-primary/10',  suffix: '%' },
            { label: 'Scheduled',    value: scheduledCount, icon: Calendar,      color: 'text-amber-600 dark:text-amber-400',        bg: 'bg-amber-500/10' },
          ].map((s) => (
            <div key={s.label} className="metric-card space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="section-label text-black">{s.label}</span>
                <div className={cn('flex items-center justify-center w-7 h-7 rounded-md', s.bg)}>
                  <s.icon className={cn('h-3.5 w-3.5', s.color)} />
                </div>
              </div>
              <p className={cn('text-[26px] font-bold tracking-tight tabular-nums leading-none', s.color)}>
                {s.value}{s.suffix ?? ''}
              </p>
            </div>
          ))}
        </div>

        {/* ── Overview ───────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Activity bar chart */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-[#f8fafb] border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-black">
                    <BarChart3 className="h-3.5 w-3.5 text-[#0a66c2]" />
                    Activity
                  </CardTitle>
                  <span className="text-[10px] font-semibold text-[#0a66c2] bg-white border border-[#dce6f1] rounded-full px-2.5 py-1">Last {dateRange}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {posts.length === 0 ? (
                  <EmptyChart label="Create posts to see activity" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={activityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.6 }} />
                        <Bar dataKey="total"     name="Created"   fill="hsl(var(--muted-foreground) / 0.25)" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="published" name="Published" fill="hsl(var(--primary))"                 radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-3 mt-3 pl-1">
                      <LegendDot color="hsl(var(--muted-foreground) / 0.4)" label="Created" />
                      <LegendDot color="hsl(var(--primary))"                label="Published" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution — redesigned for product realism */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-[#f8fafb] border-b border-gray-200">
                <CardTitle className="flex items-center gap-3 text-sm font-semibold text-black">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/20">
                    <Target className="h-4 w-4 text-[#0a66c2]" />
                  </div>
                  Status Distribution
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-4">
                {posts.length === 0 || statusData.length === 0 ? (
                  <EmptyChart label="No data yet" />
                ) : (
                  <div className="flex items-center gap-4">
                    {/* Pie + center summary */}
                    <div className="w-44 flex-shrink-0">
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={44}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                          >
                            {statusData.map((entry, i) => (
                              <Cell key={`cell-${i}`} fill={entry.color} strokeWidth={1} stroke="#ffffff" />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="-mt-24 text-center">
                        <p className="text-2xl font-bold text-gray-900 tabular-nums">{posts.length}</p>
                        <p className="text-[12px] text-gray-500">Total posts</p>
                      </div>
                    </div>

                    {/* Legend with counts and percent bars */}
                    <div className="flex-1">
                      <div className="grid gap-3">
                        {statusData.map((s) => {
                          const pct = Math.round((s.value / (posts.length || 1)) * 100);
                          return (
                            <div key={s.name} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                                  <p className="text-xs text-gray-500">{s.value} posts</p>
                                </div>
                              </div>

                              <div className="w-32">
                                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                                </div>
                                <div className="text-[11px] text-gray-500 text-right mt-1">{pct}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly trend */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
            {/* Header */}
            <div className="px-5 pt-4 pb-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0a66c2]/10">
                  <TrendingUp className="h-4 w-4 text-[#0a66c2]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">Monthly Trend</p>
                  <p className="text-[11px] text-gray-400 leading-none mt-0.5">Posts created vs published per month</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#0a66c2] bg-[#0a66c2]/8 px-2.5 py-1 rounded-full">
                Last {monthCount}mo
              </span>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              <div className="px-4 py-3 text-center">
                <p className="text-2xl font-bold tabular-nums leading-none text-gray-800">{monthlyData.reduce((s, m) => s + m.total, 0)}</p>
                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: '#94a3b8' }} />
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Total Created</p>
                </div>
              </div>

              <div className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold tabular-nums leading-none text-[#0a66c2]">{monthlyData.reduce((s, m) => s + m.published, 0)}</p>
                  <span className={cn('inline-flex items-center text-sm font-medium px-2 py-0.5 rounded-full', publishedChange.up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                    {publishedChange.up ? '▲' : '▼'} {publishedChange.pct}%
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: '#0a66c2' }} />
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Published</p>
                </div>
              </div>

              <div className="px-4 py-3 text-center">
                <p className="text-2xl font-bold tabular-nums leading-none text-emerald-600">{monthlyData.length ? Math.round(monthlyData.reduce((s, m) => s + m.published, 0) / monthlyData.length) : 0}</p>
                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: '#10b981' }} />
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Avg / Month</p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="px-4 pt-3 pb-2">
              {posts.length === 0 ? (
                <EmptyChart label="No posts yet" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barCategoryGap="34%">
                      <defs>
                        <linearGradient id="createdGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#eef6ff" />
                          <stop offset="100%" stopColor="#e2e8f0" />
                        </linearGradient>
                        <linearGradient id="publishedGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#0a66c2" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#0a66c2" stopOpacity={0.75} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />

                      <Bar dataKey="total" name="Created" fill="url(#createdGrad)" radius={[6, 6, 0, 0]} barSize={18} />
                      <Bar dataKey="published" name="Published" fill="url(#publishedGrad)" radius={[6, 6, 0, 0]} barSize={12}>
                        <LabelList dataKey="published" position="top" content={({ x, y, value }: any) => (
                          value > 0 ? (
                            <text x={x} y={y - 6} textAnchor="middle" fill="#0f172a" fontSize={10} fontWeight={600}>{value}</text>
                          ) : null
                        )} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 bg-[#f8fafb] border-t border-gray-100 flex items-center gap-4">
              <LegendDot color="#e2e8f0" label="Created" />
              <LegendDot color="#0a66c2" label="Published" />
            </div>
          </div>

          {bestDayTime && (
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
              {/* Header */}
              <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0a66c2]/10">
                    <TrendingUp className="h-4 w-4 text-[#0a66c2]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">Best Time to Post</p>
                    <p className="text-[11px] text-gray-400 leading-none mt-0.5">Derived from your publish history</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#0a66c2] bg-[#0a66c2]/8 px-2.5 py-1 rounded-full">
                  AI Insight
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                {/* Best Day */}
                <div className="px-5 py-5 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Best Day</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 leading-none">{bestDayTime.day}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0a66c2]" />
                      <p className="text-[11px] text-gray-500">
                        {bestDayTime.dayCount} post{bestDayTime.dayCount !== 1 ? 's' : ''} published
                      </p>
                    </div>
                  </div>
                  <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0a66c2]"
                      style={{ width: `${Math.min(100, (bestDayTime.dayCount / posts.filter(p => p.status === 'published' && p.published_at).length) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Best Hour */}
                <div className="px-5 py-5 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Best Hour</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 leading-none">{bestDayTime.hourLabel}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <p className="text-[11px] text-gray-500">
                        {bestDayTime.hourCount} post{bestDayTime.hourCount !== 1 ? 's' : ''} published
                      </p>
                    </div>
                  </div>
                  <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, (bestDayTime.hourCount / posts.filter(p => p.status === 'published' && p.published_at).length) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-[#f8fafb] border-t border-gray-100 flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  Based on <span className="font-semibold text-gray-600">{posts.filter(p => p.status === 'published' && p.published_at).length} published posts</span>
                </p>
                <div className="flex items-center gap-1 text-[11px] text-[#0a66c2] font-medium">
                  <TrendingUp className="h-3 w-3" />
                  Peak engagement window
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Posts ──────────────────────────────────────────────── */}
        <TabsContent value="posts">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 bg-[#f8fafb] border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-black">
                <MessageSquare className="h-3.5 w-3.5 text-[#0a66c2]" />
                Recent Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPosts.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="icon-container mx-auto">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">No posts yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Create your first post to see it here.</p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/dashboard/create-post')}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />Create post
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentPosts.map((post) => {
                    const meta     = statusMeta[post.status];
                    const Icon     = meta.icon;
                    const TypeIcon = typeIcon[post.post_type] ?? FileText;
                    return (
                      <div key={post.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <div className={cn('h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5', meta.bg)}>
                          <Icon className={cn('h-3.5 w-3.5', meta.color)} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="text-[13px] text-foreground line-clamp-1 leading-relaxed">{post.content}</p>
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                            <Badge variant="outline" className={cn('text-[10px] capitalize', meta.badge)}>
                              <Icon className="mr-1 h-3 w-3" />{post.status}
                            </Badge>
                            <span className="flex items-center gap-1"><TypeIcon className="h-3 w-3" />{post.post_type}</span>
                            <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
                            {post.scheduled_at && post.status === 'scheduled' && (
                              <span className="text-blue-600 dark:text-blue-400">
                                · Sends {format(new Date(post.scheduled_at), 'MMM d, h:mm a')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {topPublishedPosts.length > 0 && (
            <Card className="mt-4 overflow-hidden">
              <CardHeader className="pb-3 bg-[#f8fafb] border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-black">
                  <CheckCircle className="h-3.5 w-3.5 text-[#0a66c2]" />
                  Published Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {topPublishedPosts.map((post) => (
                    <div key={post.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 group">
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-[13px] text-foreground line-clamp-2 leading-relaxed">{post.content}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {post.content.length} chars
                          {post.published_at && <> · Published {format(new Date(post.published_at), 'MMM d, yyyy')}</>}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(post.content);
                          toast.success('Copied to clipboard.');
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                        title="Copy content"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Scheduled ──────────────────────────────────────────── */}
        <TabsContent value="scheduled">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 bg-[#f8fafb] border-b border-gray-200">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-black">
                <Calendar className="h-3.5 w-3.5 text-[#0a66c2]" />
                Upcoming Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scheduledPosts.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="icon-container mx-auto">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">No scheduled posts</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Schedule a post to see your queue.</p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/dashboard/create-post')}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />Schedule a post
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduledPosts.map((post, idx) => {
                    const scheduledDate = new Date(post.scheduled_at!);
                    const isToday       = scheduledDate.toDateString() === new Date().toDateString();
                    const isPast        = scheduledDate < new Date();
                    return (
                      <div key={post.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                        <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-blue-400">
                          <span className="text-[9px] font-semibold uppercase leading-none">
                            {format(scheduledDate, 'MMM')}
                          </span>
                          <span className="text-base font-bold leading-tight">{scheduledDate.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground line-clamp-1 leading-relaxed">{post.content}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px]">
                            <span className={cn(
                              'font-medium',
                              isPast  ? 'text-red-600 dark:text-red-400' :
                              isToday ? 'text-amber-600 dark:text-amber-400' :
                                        'text-primary dark:text-blue-400',
                            )}>
                              {isPast ? 'Overdue · ' : isToday ? 'Today · ' : ''}
                              {format(scheduledDate, 'h:mm a')}
                            </span>
                            {isPast && (
                              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                <AlertCircle className="h-3 w-3" />
                                Pending publish
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">#{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Breakdown ──────────────────────────────────────────── */}
        <TabsContent value="breakdown" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Status bars - Beautiful & Minimal */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-[#f8fafb] border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-black">
                  <Target className="h-3.5 w-3.5 text-[#0a66c2]" />
                  By Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {posts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">No posts yet.</p>
                ) : (
                  <>
                    {[
                      { label: 'Published', count: publishedCount, color: '#10b981', icon: CheckCircle },
                      { label: 'Draft',     count: draftCount,     color: '#f59e0b', icon: Clock },
                      { label: 'Scheduled', count: scheduledCount, color: '#3b82f6', icon: Calendar },
                      { label: 'Failed',    count: failedCount,    color: '#ef4444', icon: XCircle },
                    ].map((item) => {
                      const pct = posts.length > 0 ? Math.round((item.count / posts.length) * 100) : 0;
                      const Icon = item.icon;

                      return (
                        <div key={item.label} className="p-2.5 rounded-lg border border-border/40 bg-muted/20 hover:border-border/60 hover:bg-muted/30 transition-all duration-300">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" style={{ color: item.color }} />
                              <span className="text-xs font-medium text-foreground">{item.label}</span>
                            </div>
                            <span className="text-xs font-semibold text-foreground">
                              {item.count} <span className="text-muted-foreground font-normal">({pct}%)</span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ backgroundColor: item.color, width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Type breakdown - Beautiful & Minimal */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-[#f8fafb] border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-black">
                  <FileText className="h-3.5 w-3.5 text-[#0a66c2]" />
                  By Content Type
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {typeData.length === 0 ? (
                  <EmptyChart label="No posts yet" />
                ) : (
                  <div className="space-y-3">
                    {/* Chart */}
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={false}
                        >
                          {typeData.map((entry, i) => (
                            <Cell key={`cell-${i}`} fill={entry.color} strokeWidth={1} stroke="hsl(var(--background))" />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} posts`, name]}
                          content={<ChartTooltip />}
                          cursor={{ fill: 'transparent' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-2">
                      {typeData.map((d) => {
                        const Icon = typeIcon[d.name.toLowerCase() as keyof typeof typeIcon] || FileText;
                        const percentage = Math.round((d.value / typeData.reduce((sum, item) => sum + item.value, 0)) * 100);

                        return (
                          <div key={d.name} className="p-2 rounded-lg border border-border/40 bg-muted/20 hover:border-border/60 hover:bg-muted/30 transition-all duration-300">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon className="h-3.5 w-3.5" style={{ color: d.color }} />
                              <span className="text-xs font-medium text-foreground capitalize">{d.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {d.value} posts <span className="text-foreground font-semibold">({percentage}%)</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Publishing rate */}
          <Card>
            <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-primary/20">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(hsl(var(--primary)) ${successRate * 3.6}deg, hsl(var(--muted)) 0deg)`,
                    mask: 'radial-gradient(circle at center, transparent 55%, black 56%)',
                    WebkitMask: 'radial-gradient(circle at center, transparent 55%, black 56%)',
                  }}
                />
                <span className="text-xl font-bold text-primary relative z-10">{successRate}%</span>
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-base font-semibold text-foreground">Publishing Rate</p>
                <p className="text-sm text-muted-foreground">
                  {publishedCount} of {posts.length} posts successfully published to LinkedIn.
                  {failedCount > 0 && ` ${failedCount} failed — check the Posts page.`}
                </p>
              </div>
              <div className="sm:ml-auto shrink-0">
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/posts')}>
                  View all posts
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-center">
      <BarChart3 className="h-8 w-8 text-muted-foreground/25" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function LegendDot({ color, label, opacity = 1 }: { color: string; label: string; opacity?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color, opacity }} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
