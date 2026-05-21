import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lightbulb, Trash2, Sparkles, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { QuickCaptureModal, type Idea, type IdeaTag } from '@/components/posts/QuickCaptureModal';
import { ideasAPI } from '@/lib/api';
import { useLinkedInStore } from '@/store/useLinkedInStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Tag config ────────────────────────────────────────────────────────────────

const tagConfig: Record<IdeaTag, { label: string; emoji: string; pill: string; bar: string }> = {
  win:      { label: 'Win',      emoji: '🏆', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-400' },
  lesson:   { label: 'Lesson',   emoji: '💡', pill: 'bg-amber-50 text-amber-700 border-amber-200',       bar: 'bg-amber-400'   },
  opinion:  { label: 'Opinion',  emoji: '🎯', pill: 'bg-blue-50 text-blue-700 border-blue-200',          bar: 'bg-blue-400'    },
  thought:  { label: 'Thought',  emoji: '⚡', pill: 'bg-blue-50 text-blue-700 border-blue-200',          bar: 'bg-blue-500'    },
  update:   { label: 'Update',   emoji: '📢', pill: 'bg-rose-50 text-rose-700 border-rose-200',          bar: 'bg-rose-400'    },
  question: { label: 'Question', emoji: '❓', pill: 'bg-slate-50 text-slate-700 border-slate-200',       bar: 'bg-slate-400'   },
};

type FilterTag = IdeaTag | 'all';

// ── Idea card ─────────────────────────────────────────────────────────────────

function IdeaCard({ idea, onDelete }: { idea: Idea; onDelete: (id: string) => void }) {
  const navigate = useNavigate();
  const cfg = tagConfig[idea.tag];

  return (
    <div className="group relative flex flex-col bg-white rounded-xl border border-[#e8eaed] overflow-hidden transition-all duration-150 hover:border-[#d1d5db] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Left accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-[3px]', cfg.bar)} />

      <div className="px-4 py-3.5 pl-5 flex flex-col gap-2.5 flex-1">
        {/* Top row: tag + time */}
        <div className="flex items-center justify-between gap-2">
          <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border', cfg.pill)}>
            <span className="text-[11px]">{cfg.emoji}</span>
            {cfg.label}
          </span>
          <span className="text-[11px] text-[#9ca3af] shrink-0">{timeAgo(idea.capturedAt)}</span>
        </div>

        {/* Idea text */}
        <p className="text-[13px] text-[#111827] leading-relaxed line-clamp-3 flex-1">{idea.text}</p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-0.5 border-t border-[#f3f4f6]">
          <button
            onClick={() => navigate(`/dashboard/ai-interview?idea=${idea.id}`)}
            className="flex items-center gap-1 text-[12px] font-medium text-[#0a66c2] hover:text-[#0958a8] transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Turn into post
          </button>
          <button
            onClick={() => onDelete(idea.id)}
            className="h-6 w-6 flex items-center justify-center rounded-md text-[#9ca3af] hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Delete idea"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Ideas() {
  const navigate = useNavigate();
  const { ideas: storeIdeas, setIdeas: setStoreIdeas, addIdea, removeIdea } = useLinkedInStore();

  // Map store IdeaRecord → local Idea shape
  const ideas: Idea[] = storeIdeas.map(r => ({
    id: r.id, text: r.text, tag: r.tag as IdeaTag, capturedAt: r.captured_at,
  }));

  const [activeTag,   setActiveTag]   = useState<FilterTag>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [captureOpen, setCaptureOpen] = useState(false);

  const tagCounts = (Object.keys(tagConfig) as IdeaTag[]).reduce<Record<IdeaTag, number>>(
    (acc, t) => { acc[t] = ideas.filter(i => i.tag === t).length; return acc; },
    {} as Record<IdeaTag, number>,
  );

  const filtered = ideas
    .filter(i => activeTag === 'all' || i.tag === activeTag)
    .filter(i => !searchQuery.trim() || i.text.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSaved = (idea: Idea) => addIdea({ id: idea.id, user_id: '', text: idea.text, tag: idea.tag, captured_at: idea.capturedAt });

  const deleteIdea = async (id: string) => {
    removeIdea(id);
    try {
      await ideasAPI.delete(id);
      toast.success('Idea deleted.');
    } catch {
      toast.error('Failed to delete idea.');
      ideasAPI.getAll().then(res => {
        if (res.success) setStoreIdeas(res.data);
      }).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full animate-fade-in">

      {/* ── Action bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/ai-interview')}
          className="h-8 text-[13px] rounded-lg border-[#e8eaed] text-[#374151] hover:bg-[#f8f9fb] gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">AI Interview</span>
        </Button>
        <Button
          size="sm"
          onClick={() => setCaptureOpen(true)}
          className="h-8 text-[13px] rounded-lg bg-amber-500 hover:bg-amber-600 gap-1.5 text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Capture idea
        </Button>
      </div>

      {/* ── Main card ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.05)] flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* Filter + search bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8eaed] shrink-0 overflow-x-auto scrollbar-hide">

          {/* Tag filter chips */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTag('all')}
              className={cn(
                'h-7 px-3 rounded-full text-[12px] font-medium border transition-colors whitespace-nowrap shrink-0',
                activeTag === 'all'
                  ? 'bg-[#0a66c2] text-white border-[#0a66c2]'
                  : 'bg-white text-[#6b7280] border-[#e8eaed] hover:border-[#c8cdd5] hover:text-[#374151]',
              )}
            >
              All ({ideas.length})
            </button>
            {(Object.entries(tagConfig) as [IdeaTag, typeof tagConfig[IdeaTag]][]).map(([tag, cfg]) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={cn(
                  'h-7 px-3 rounded-full text-[12px] font-medium border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1',
                  activeTag === tag
                    ? cn(cfg.pill, 'shadow-sm')
                    : 'bg-white text-[#6b7280] border-[#e8eaed] hover:border-[#c8cdd5] hover:text-[#374151]',
                )}
              >
                <span>{cfg.emoji}</span>
                {cfg.label}
                {tagCounts[tag] > 0 && (
                  <span className={cn('text-[10px] font-semibold', activeTag === tag ? '' : 'text-[#9ca3af]')}>
                    {tagCounts[tag]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative ml-auto shrink-0 w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#9ca3af] pointer-events-none" />
            <input
              type="text"
              placeholder="Search ideas…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-7 pl-7 pr-6 rounded-lg border border-[#e8eaed] bg-[#f8f9fb] text-[12px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#0a66c2] focus:border-[#0a66c2] transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">

          {/* Empty — no ideas at all */}
          {ideas.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4 text-center">
              <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl">
                💡
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#111827]">No ideas yet</p>
                <p className="text-[13px] text-[#9ca3af] mt-1">
                  Hit "Capture idea" whenever inspiration strikes. It takes 10 seconds.
                </p>
              </div>
              <button
                onClick={() => setCaptureOpen(true)}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-medium transition-colors"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                Capture your first idea
              </button>
            </div>
          )}

          {/* Empty — filtered */}
          {ideas.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[240px] gap-3 text-center">
              <p className="text-[14px] font-semibold text-[#111827]">
                {searchQuery ? 'No ideas match your search' : 'No ideas with this tag'}
              </p>
              <p className="text-[13px] text-[#9ca3af]">
                {searchQuery ? 'Try a different search term.' : 'Try a different filter or capture a new idea.'}
              </p>
              <button
                onClick={() => { setActiveTag('all'); setSearchQuery(''); }}
                className="h-7 px-3 rounded-lg border border-[#e8eaed] text-[12px] font-medium text-[#374151] hover:bg-[#f8f9fb] transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Ideas grid */}
          {filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(idea => (
                <IdeaCard key={idea.id} idea={idea} onDelete={deleteIdea} />
              ))}
            </div>
          )}
        </div>
      </div>

      <QuickCaptureModal
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        onSaved={handleSaved}
      />
    </div>
  );
}
