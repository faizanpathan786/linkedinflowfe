import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QuickCaptureModal, type Idea, type IdeaTag } from '@/components/posts/QuickCaptureModal';
import { useAuthStore } from '@/store/useAuthStore';
import { ideasAPI } from '@/lib/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Tag config
// ---------------------------------------------------------------------------

const tagConfig: Record<IdeaTag, { label: string; emoji: string; color: string; bg: string }> = {
  win:      { label: 'Win',      emoji: '🏆', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  lesson:   { label: 'Lesson',   emoji: '💡', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200'     },
  opinion:  { label: 'Opinion',  emoji: '🎯', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200'       },
  thought:  { label: 'Thought',  emoji: '⚡', color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200'   },
  update:   { label: 'Update',   emoji: '📢', color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200'       },
  question: { label: 'Question', emoji: '❓', color: 'text-slate-700',   bg: 'bg-slate-50 border-slate-200'     },
};

type FilterTag = IdeaTag | 'all';

interface FilterChip {
  value: FilterTag;
  label: string;
  emoji?: string;
}

const FILTER_CHIPS: FilterChip[] = [
  { value: 'all',      label: 'All' },
  { value: 'win',      label: 'Win',      emoji: '🏆' },
  { value: 'lesson',   label: 'Lesson',   emoji: '💡' },
  { value: 'opinion',  label: 'Opinion',  emoji: '🎯' },
  { value: 'thought',  label: 'Thought',  emoji: '⚡' },
  { value: 'update',   label: 'Update',   emoji: '📢' },
  { value: 'question', label: 'Question', emoji: '❓' },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export function Ideas() {
  const navigate = useNavigate();
  const { user: _user } = useAuthStore();

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<FilterTag>('all');
  const [captureOpen, setCaptureOpen] = useState(false);

  useEffect(() => {
    ideasAPI.getAll()
      .then((res) => {
        if (res.success) {
          setIdeas(res.data.map((r) => ({
            id: r.id,
            text: r.text,
            tag: r.tag as IdeaTag,
            capturedAt: r.captured_at,
          })));
        }
      })
      .catch(() => toast.error('Failed to load ideas.'))
      .finally(() => setIsLoading(false));
  }, []);

  // ---- Derived ----
  const filtered = activeTag === 'all' ? ideas : ideas.filter((i) => i.tag === activeTag);

  // ---- Handlers ----
  const handleSaved = (idea: Idea) => {
    setIdeas((prev) => [idea, ...prev]);
  };

  const deleteIdea = async (id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    try {
      await ideasAPI.delete(id);
      toast.success('Idea deleted.');
    } catch {
      toast.error('Failed to delete idea.');
      // refetch to restore consistent state
      ideasAPI.getAll().then((res) => {
        if (res.success) setIdeas(res.data.map((r) => ({ id: r.id, text: r.text, tag: r.tag as IdeaTag, capturedAt: r.captured_at })));
      }).catch(() => {});
    }
  };

  // ---- Render ----
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">Ideas</h1>
          <Badge variant="secondary" className="text-xs shrink-0">
            {ideas.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/weekly')}>
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden xs:inline">Weekly Workflow</span>
            <span className="xs:hidden">Weekly</span>
          </Button>
          <Button size="sm" onClick={() => setCaptureOpen(true)}>
            <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden xs:inline">Capture idea</span>
            <span className="xs:hidden">Capture</span>
          </Button>
        </div>
      </div>

      {/* Tag filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => setActiveTag(chip.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              activeTag === chip.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {chip.emoji && <span>{chip.emoji}</span>}
            {chip.label}
          </button>
        ))}
      </div>

      {/* Ideas grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.length === 0 && ideas.length > 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3 text-center">
            <p className="text-sm font-semibold text-foreground">No ideas with this tag</p>
            <p className="text-xs text-muted-foreground">
              Try selecting a different filter or capture a new idea.
            </p>
            <Button size="sm" variant="outline" onClick={() => setActiveTag('all')}>
              Show all
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="col-span-full flex justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        {!isLoading && ideas.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl">
              💡
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No ideas captured yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Hit "Capture idea" whenever something interesting happens. Takes 10 seconds.
              </p>
            </div>
            <Button size="sm" onClick={() => setCaptureOpen(true)}>
              <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
              Capture your first idea
            </Button>
          </div>
        )}

        {filtered.map((idea) => {
          const cfg = tagConfig[idea.tag];
          return (
            <div
              key={idea.id}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Tag badge + time */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    cfg.bg,
                    cfg.color
                  )}
                >
                  <span>{cfg.emoji}</span>
                  {cfg.label}
                </span>
                <span className="text-xs text-muted-foreground">{timeAgo(idea.capturedAt)}</span>
              </div>

              {/* Idea text */}
              <p className="text-sm text-foreground leading-relaxed line-clamp-3">{idea.text}</p>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => navigate(`/dashboard/ai-interview?idea=${idea.id}`)}
                >
                  Turn into post
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                  onClick={() => deleteIdea(idea.id)}
                  aria-label="Delete idea"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Capture modal */}
      <QuickCaptureModal
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        onSaved={handleSaved}
      />
    </div>
  );
}
