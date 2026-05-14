import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLinkedInStore } from '@/store/useLinkedInStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ideasAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Lightbulb, ChevronLeft, ChevronRight, Calendar, Plus, ArrowLeft } from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  parseISO,
  isWithinInterval,
} from 'date-fns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Idea {
  id: string;
  text: string;
  tag: string;
  capturedAt: string;
}

// ---------------------------------------------------------------------------
// Module-level helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const tagConfig: Record<string, { label: string; classes: string }> = {
  win:      { label: 'Win',      classes: 'bg-green-100 text-green-700' },
  lesson:   { label: 'Lesson',   classes: 'bg-blue-100 text-blue-700' },
  opinion:  { label: 'Opinion',  classes: 'bg-purple-100 text-purple-700' },
  thought:  { label: 'Thought',  classes: 'bg-gray-100 text-gray-600' },
  update:   { label: 'Update',   classes: 'bg-sky-100 text-sky-700' },
  question: { label: 'Question', classes: 'bg-orange-100 text-orange-700' },
};

const TAG_FILTERS = ['all', 'win', 'lesson', 'opinion', 'thought', 'update', 'question'];

const WEEKLY_GOAL = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeeklyWorkflow() {
  const navigate = useNavigate();
  const { posts } = useLinkedInStore();
  const { user } = useAuthStore();

  const [weekOffset, setWeekOffset] = useState(0);
  const [activeTag, setActiveTag] = useState<string>('all');
  const [ideas, setIdeas] = useState<Idea[]>([]);

  // Load ideas from API on mount
  useEffect(() => {
    ideasAPI.getAll()
      .then((res) => {
        if (res.success) {
          setIdeas(res.data.map((r) => ({ id: r.id, text: r.text, tag: r.tag, capturedAt: r.captured_at })));
        }
      })
      .catch(() => {});
  }, []);

  // Compute week boundaries
  const today = new Date();
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(addWeeks(today, weekOffset),   { weekStartsOn: 1 });

  // Scheduled posts for the selected week
  const scheduledThisWeek = useMemo(
    () =>
      posts
        .filter((p) => {
          if (p.status !== 'scheduled' || !p.scheduled_at) return false;
          const d = parseISO(p.scheduled_at);
          return isWithinInterval(d, { start: weekStart, end: weekEnd });
        })
        .sort(
          (a, b) =>
            new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime(),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, weekOffset],
  );

  // Filtered ideas (only relevant when viewing current week)
  const filteredIdeas = useMemo(
    () =>
      activeTag === 'all'
        ? ideas
        : ideas.filter((idea) => idea.tag === activeTag),
    [ideas, activeTag],
  );

  const progressPct = Math.min((scheduledThisWeek.length / WEEKLY_GOAL) * 100, 100);

  return (
    <div className="flex flex-col gap-6 lg:h-full lg:overflow-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* Top bar                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground -ml-1"
            onClick={() => navigate('/dashboard/ideas')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Ideas
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Week navigation */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-1 py-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setWeekOffset((o) => o - 1)}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm text-gray-600 whitespace-nowrap">
              {weekOffset === 0
                ? 'This week'
                : weekOffset === -1
                ? 'Last week'
                : weekOffset === 1
                ? 'Next week'
                : weekOffset < 0
                ? `${Math.abs(weekOffset)}w ago`
                : `${weekOffset}w ahead`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setWeekOffset((o) => o + 1)}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Capture idea */}
          <Button
            size="sm"
            onClick={() => navigate('/dashboard/ideas')}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Capture idea
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Two-column layout                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:flex-1 lg:grid-cols-2 lg:overflow-hidden">
        {/* ---------------------------------------------------------------- */}
        {/* Left — Ideas to post this week                                    */}
        {/* ---------------------------------------------------------------- */}
        <Card className="flex flex-col lg:overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Ideas to post this week
              </CardTitle>
              <span className="text-sm text-gray-500">
                {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Tag filter tabs */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TAG_FILTERS.map((tag) => {
                const cfg = tag !== 'all' ? tagConfig[tag] : null;
                const isActive = activeTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={cn(
                      'rounded-full border px-3 py-0.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'border-gray-800 bg-gray-800 text-white'
                        : cfg
                        ? `border-transparent ${cfg.classes} hover:opacity-80`
                        : 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200',
                    )}
                  >
                    {tag === 'all' ? 'All' : tagConfig[tag]?.label ?? tag}
                  </button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="lg:flex-1 lg:overflow-y-auto">
            {filteredIdeas.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Lightbulb className="h-10 w-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No ideas captured yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard/ideas')}
                >
                  Capture idea
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIdeas.map((idea) => {
                  const cfg = tagConfig[idea.tag];
                  return (
                    <div
                      key={idea.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3 hover:border-gray-200 hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {cfg && (
                            <span
                              className={cn(
                                'mb-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                cfg.classes,
                              )}
                            >
                              {cfg.label}
                            </span>
                          )}
                          <p className="line-clamp-2 text-sm text-gray-800">{idea.text}</p>
                          <p className="mt-1 text-[11px] text-gray-400">
                            Captured {timeAgo(idea.capturedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            navigate(`/dashboard/ai-interview?idea=${idea.id}`)
                          }
                        >
                          Turn into post
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Right — This week's schedule                                      */}
        {/* ---------------------------------------------------------------- */}
        <Card className="flex flex-col lg:overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-blue-500" />
                This week's schedule
              </CardTitle>
              <span className="text-xs text-gray-400">
                {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
              </span>
            </div>

            {/* Weekly goal progress */}
            <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                <span>
                  Goal: post {WEEKLY_GOAL} times this week
                </span>
                <span className="font-semibold">
                  {scheduledThisWeek.length}/{WEEKLY_GOAL}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="lg:flex-1 lg:overflow-y-auto">
            {scheduledThisWeek.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Calendar className="h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">
                  Nothing scheduled yet — start turning ideas into posts
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard/ideas')}
                >
                  Browse ideas
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledThisWeek.map((post) => {
                  const scheduledDate = parseISO(post.scheduled_at!);
                  return (
                    <div
                      key={post.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-3 hover:border-gray-200 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-gray-600">
                          {format(scheduledDate, 'EEE MMM d')} · {format(scheduledDate, 'h:mm a')}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-blue-200 text-blue-600 bg-blue-50"
                        >
                          {post.status}
                        </Badge>
                      </div>
                      <p className="line-clamp-2 text-sm text-gray-700">{post.content}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View full calendar link */}
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate('/dashboard/content-calendar')}
                className="text-xs text-blue-600 hover:underline"
              >
                View full calendar →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
