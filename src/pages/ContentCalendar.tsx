import React, { useState, useMemo, useEffect, useRef, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isPast,
  parseISO,
  startOfDay,
  isThisWeek,
  isThisMonth,
  addDays,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  X,
  Pencil,
  ExternalLink,
  LayoutList,
  Trello,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ChevronDown,
  Send,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLinkedInStore } from '@/store/useLinkedInStore';
import { useAuthStore } from '@/store/useAuthStore';
import { postsAPI, type Post } from '@/lib/api';
import { designSystem } from '@/lib/design-system';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LinkedInPreview } from '@/components/posts/LinkedInPreview';
import { EditPostModal } from '@/components/posts/EditPostModal';
import { PageTransition } from '@/components/ui/magic/page-transition';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'month' | 'week' | 'list' | 'board';

// ── Status colours ────────────────────────────────────────────────────────────

const chipStyle: Record<Post['status'], string> = {
  draft:     'bg-amber-100  text-amber-800  border-amber-200',
  scheduled: 'bg-blue-100   text-blue-800   border-blue-200',
  published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  failed:    'bg-red-100    text-red-800    border-red-200',
};

const columnStyle: Record<Post['status'], { header: string; body: string; accent: string; dot: string }> = {
  draft:     { header: 'bg-amber-50 border-amber-200',  body: 'bg-[#fdfaf5]', accent: 'bg-amber-500',   dot: 'bg-amber-400' },
  scheduled: { header: 'bg-blue-50  border-blue-200',   body: 'bg-[#f5f8fe]', accent: 'bg-blue-500',    dot: 'bg-blue-400' },
  published: { header: 'bg-emerald-50 border-emerald-200', body: 'bg-[#f4fdf7]', accent: 'bg-emerald-500', dot: 'bg-emerald-400' },
  failed:    { header: 'bg-red-50   border-red-200',    body: 'bg-[#fef5f5]', accent: 'bg-red-500',     dot: 'bg-red-400' },
};

const dotStyle: Record<Post['status'], string> = {
  draft:     designSystem.colors.warning,
  scheduled: designSystem.colors.info,
  published: designSystem.colors.success,
  failed:    designSystem.colors.danger,
};

const statusLabel: Record<Post['status'], string> = {
  draft:     'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  failed:    'Failed',
};

const statusIcon: Record<Post['status'], React.ElementType> = {
  draft:     Clock,
  scheduled: Calendar,
  published: CheckCircle,
  failed:    XCircle,
};

// ── Helper: which calendar date does a post belong to? ───────────────────────

function postDate(post: Post): Date | null {
  if (post.scheduled_at) return parseISO(post.scheduled_at);
  if (post.published_at) return parseISO(post.published_at);
  return null;
}

function resolveImagePreview(post: Post): string | undefined {
  const postAny = post as Post & {
    imageBase64?: string;
    imageUrl?: string;
    image?: string;
  };

  const raw =
    post.image_url ??
    postAny.imageBase64 ??
    postAny.imageUrl ??
    postAny.image;

  if (!raw) return undefined;
  const candidate = String(raw);
  if (candidate.startsWith('data:')) return candidate;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  if (candidate.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    return `${apiBase}${candidate}`;
  }

  // If backend returns raw base64, convert it to a data URL for preview rendering.
  const imageType = post.image_type ?? 'image/jpeg';
  return `data:${imageType};base64,${candidate}`;
}

function resolveVideoPreview(post: Post): string | undefined {
  const postAny = post as Post & { videoUrl?: string; video?: string };
  const candidate = post.video_url ?? postAny.videoUrl ?? postAny.video;
  if (!candidate) return undefined;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  if (candidate.startsWith('/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    return `${apiBase}${candidate}`;
  }
  return candidate;
}

function resolvePreviewType(post: Post): Post['post_type'] {
  if (post.has_video) return 'video';
  if (post.has_image) return 'image';
  if (resolveVideoPreview(post)) return 'video';
  if (resolveImagePreview(post)) return 'image';
  if (post.link_url) return 'link';
  return post.post_type;
}

// Tracks whether a DnD drag was activated during the current pointer sequence.
// Module-level so PostChip and KanbanCard can read it without prop drilling.
const dragActivated = { current: false };

// Disables all dragging while the post preview modal is open.
const DragDisabledCtx = createContext(false);

// ── Draggable post chip (Month view) ─────────────────────────────────────────

function PostChip({
  post,
  onClick,
  overlay = false,
}: {
  post: Post;
  onClick?: () => void;
  overlay?: boolean;
}) {
  const dragDisabled = useContext(DragDisabledCtx);
  const isDraggable = !dragDisabled && (post.status === 'draft' || post.status === 'scheduled');
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: post.id,
    disabled: !isDraggable,
  });

  return (
    <div
      ref={setNodeRef}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
      onPointerUp={(e) => {
        if (!dragActivated.current) {
          e.stopPropagation();
          onClick?.();
        }
      }}
      onClick={(e) => e.stopPropagation()}
      title={post.content}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium leading-tight cursor-pointer select-none',
        'transition-all duration-150',
        chipStyle[post.status],
        isDragging && !overlay && 'opacity-30',
        overlay && 'shadow-xl scale-105 rotate-1',
        isDraggable && 'hover:shadow-sm active:scale-[0.97]',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotStyle[post.status])} />
      <span className="truncate max-w-[100px]">{post.content}</span>
    </div>
  );
}

// ── Droppable calendar cell (Month view) ──────────────────────────────────────

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE_CHIPS = 3;

function CalendarCell({
  date,
  posts,
  currentMonth,
  onPostClick,
  onDayClick,
}: {
  date: Date;
  posts: Post[];
  currentMonth: Date;
  onPostClick: (post: Post) => void;
  onDayClick?: (dateStr: string) => void;
}) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });
  const inMonth = isSameMonth(date, currentMonth);
  const today = isToday(date);
  const past = isPast(startOfDay(date)) && !today;
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const visible = posts.slice(0, MAX_VISIBLE_CHIPS);
  const overflow = posts.length - MAX_VISIBLE_CHIPS;

  return (
    <div
      ref={setNodeRef}
      onClick={() => { if (!past && inMonth && onDayClick) onDayClick(dateStr); }}
      className={cn(
        'group relative min-h-[130px] rounded-xl border p-2.5 transition-all duration-150 flex flex-col',
        inMonth
          ? isWeekend ? 'bg-gray-50/70 border-gray-200' : 'bg-white border-gray-200'
          : 'bg-gray-50/30 border-gray-100',
        past && inMonth && 'opacity-75',
        past && 'cursor-default',
        !past && inMonth && 'hover:border-[#0a66c2]/50 hover:shadow-md cursor-pointer',
        today && 'border-[#0a66c2] bg-[#f0f6ff] shadow-[0_0_0_2px_rgba(10,102,194,0.12)]',
        !past && isOver && 'border-[#0a66c2] bg-blue-50/60 scale-[1.01] shadow-md',
      )}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold',
          today ? 'bg-[#0a66c2] text-white' : inMonth ? 'text-gray-700' : 'text-gray-300',
        )}>
          {format(date, 'd')}
        </span>
        {/* "+" icon on hover for future days */}
        {!past && inMonth && !today && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus className="h-3 w-3 text-[#0a66c2]" />
          </span>
        )}
      </div>

      {/* Post chips */}
      <div className="flex flex-col gap-1 flex-1">
        {visible.map(post => (
          <PostChip key={post.id} post={post} onClick={() => onPostClick(post)} />
        ))}
        {overflow > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onPostClick(posts[MAX_VISIBLE_CHIPS]); }}
            className="text-left text-[10px] font-semibold text-[#0a66c2] hover:underline pl-0.5"
          >
            +{overflow} more
          </button>
        )}
      </div>

      {/* Drop indicator */}
      {!past && isOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl">
          <div className="rounded-full bg-[#0a66c2]/10 px-3 py-1 text-[11px] font-semibold text-[#0a66c2] border border-[#0a66c2]/30 backdrop-blur-sm">
            Drop here
          </div>
        </div>
      )}
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────

function ListView({
  posts,
  onPostClick,
}: {
  posts: Post[];
  onPostClick: (post: Post) => void;
}) {
  // Group: upcoming / this week / this month / earlier / unscheduled
  const grouped = useMemo(() => {
    const sorted = [...posts].sort((a, b) => {
      const da = postDate(a)?.getTime() ?? 0;
      const db = postDate(b)?.getTime() ?? 0;
      return db - da; // newest first
    });

    const groups: { label: string; posts: Post[] }[] = [
      { label: 'Scheduled', posts: [] },
      { label: 'This week', posts: [] },
      { label: 'This month', posts: [] },
      { label: 'Published', posts: [] },
      { label: 'Drafts (unscheduled)', posts: [] },
      { label: 'Failed', posts: [] },
    ];

    sorted.forEach(p => {
      const d = postDate(p);
      if (p.status === 'failed') { groups[5].posts.push(p); return; }
      if (p.status === 'draft' && !p.scheduled_at) { groups[4].posts.push(p); return; }
      if (p.status === 'scheduled') { groups[0].posts.push(p); return; }
      if (p.status === 'published') {
        if (d && isThisWeek(d)) { groups[1].posts.push(p); return; }
        if (d && isThisMonth(d)) { groups[2].posts.push(p); return; }
        groups[3].posts.push(p); return;
      }
    });

    return groups.filter(g => g.posts.length > 0);
  }, [posts]);

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="icon-container"><FileText className="h-5 w-5" /></div>
        <p className="text-sm font-medium text-foreground">No posts yet</p>
        <p className="text-xs text-muted-foreground">Create your first post to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {grouped.map((group, gi) => (
        <div key={group.label}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{group.label}</h3>
          <div className="space-y-2">
            {group.posts.map((post, pi) => {
              const d = postDate(post);
              const StatusIcon = statusIcon[post.status];
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.04 + pi * 0.025, duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
                  onClick={() => onPostClick(post)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-sm hover:-translate-y-px transition-all duration-150 cursor-pointer group"
                >
                  {/* Status dot */}
                  <div className={cn('mt-0.5 h-2 w-2 rounded-full shrink-0 ring-2 ring-background', dotStyle[post.status])} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2 leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="outline" className={cn('text-[10px] py-0 h-4 gap-1', chipStyle[post.status])}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {statusLabel[post.status]}
                      </Badge>
                      {d && (
                        <span className="text-[11px] text-muted-foreground">
                          {format(d, post.status === 'scheduled' ? 'MMM d, h:mm a' : 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-0.5 transition-colors" />
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Board (kanban) view ───────────────────────────────────────────────────────

function BoardColumn({
  status,
  posts,
  onPostClick,
}: {
  status: Post['status'];
  posts: Post[];
  onPostClick: (post: Post) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `board-${status}` });
  const StatusIcon = statusIcon[status];
  const col = columnStyle[status];

  return (
    <div className="flex flex-col flex-1 min-w-[220px] rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Column header */}
      <div className={cn('flex items-center gap-2.5 px-4 py-3 border-b', col.header)}>
        <div className={cn('h-2 w-2 rounded-full shrink-0', col.dot)} />
        <span className="text-[13px] font-semibold text-gray-800">{statusLabel[status]}</span>
        <span className={cn(
          'ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white',
          col.accent,
        )}>
          {posts.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-3 space-y-2.5 transition-colors duration-150 min-h-[200px] sm:min-h-[460px]',
          col.body,
          isOver && 'brightness-95',
        )}
      >
        {posts.map((post) => {
          const isDraggable = post.status === 'draft' || post.status === 'scheduled';
          return (
            <KanbanCard
              key={post.id}
              post={post}
              isDraggable={isDraggable}
              date={postDate(post)}
              onClick={() => onPostClick(post)}
            />
          );
        })}
        {posts.length === 0 && (
          status === 'failed' ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-[12px] font-semibold text-emerald-700">All clear</p>
              <p className="text-[11px] text-gray-400 leading-snug">No failed posts yet.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <StatusIcon className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-[11px] text-gray-400">No {statusLabel[status].toLowerCase()} posts</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function KanbanCard({
  post,
  isDraggable,
  date,
  onClick,
}: {
  post: Post;
  isDraggable: boolean;
  date: Date | null;
  onClick: () => void;
}) {
  const dragDisabled = useContext(DragDisabledCtx);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: post.id,
    disabled: !isDraggable || dragDisabled,
  });
  const StatusIcon = statusIcon[post.status];

  return (
    <div
      ref={setNodeRef}
      {...(isDraggable ? { ...attributes, ...listeners } : {})}
      onPointerUp={(e) => {
        if (!dragActivated.current) { e.stopPropagation(); onClick(); }
      }}
      className={cn(
        'group rounded-xl border border-gray-200 bg-white p-3.5 cursor-pointer',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-150',
        isDragging && 'opacity-30 rotate-2 scale-105',
        isDraggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      {/* Post type + date row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', chipStyle[post.status])}>
          <StatusIcon className="h-2.5 w-2.5" />
          {statusLabel[post.status]}
        </span>
        {date && (
          <span className="text-[10px] text-gray-400 shrink-0">
            {format(date, 'MMM d')}
          </span>
        )}
      </div>

      {/* Content */}
      <p className="text-[12.5px] text-gray-700 leading-relaxed line-clamp-3">{post.content}</p>

      {/* Footer */}
      <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{post.post_type}</span>
        {date && (
          <span className="text-[10px] text-gray-400">{format(date, 'h:mm a')}</span>
        )}
      </div>
    </div>
  );
}

function BoardView({
  posts,
  onPostClick,
}: {
  posts: Post[];
  onPostClick: (post: Post) => void;
}) {
  const columns: Post['status'][] = ['draft', 'scheduled', 'published', 'failed'];

  return (
    <div className="flex gap-4 min-w-[720px]">
      {columns.map(status => (
        <BoardColumn
          key={status}
          status={status}
          posts={posts.filter(p => p.status === status)}
          onPostClick={onPostClick}
        />
      ))}
    </div>
  );
}

// ── Draft Queue ───────────────────────────────────────────────────────────────

const DRAFT_PAGE_SIZE = 6;

function DraggableDraftCard({
  post,
  onEdit,
  onSchedule,
  onPreview,
}: {
  post: Post;
  onEdit: (post: Post) => void;
  onSchedule: (post: Post) => void;
  onPreview: (post: Post) => void;
}) {
  const dragDisabled = useContext(DragDisabledCtx);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: post.id, disabled: dragDisabled });

  return (
    <div
      ref={setNodeRef}
      {...(dragDisabled ? {} : attributes)}
      {...(dragDisabled ? {} : listeners)}
      className={cn(
        'group flex flex-col gap-2.5 rounded-xl border border-white bg-white p-3.5 shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing select-none',
        isDragging ? 'opacity-30 scale-95 shadow-none' : 'hover:shadow-md hover:-translate-y-0.5',
      )}
      onClick={(e) => { if (!isDragging) { e.stopPropagation(); onPreview(post); } }}
    >
      {/* Meta row */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 capitalize">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          {post.post_type}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">{format(parseISO(post.created_at), 'MMM d')}</span>
          <GripVertical className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
        </div>
      </div>

      {/* Content preview */}
      <p className="text-[12.5px] text-gray-700 leading-relaxed line-clamp-3 flex-1">
        {post.content}
      </p>

      {/* Actions */}
      <div
        className="flex items-center gap-2 pt-1 border-t border-gray-100"
        onPointerDown={e => e.stopPropagation()}
      >
        <Button
          size="sm"
          className="h-7 flex-1 text-[11px] bg-[#0a66c2] hover:bg-[#004182] text-white gap-1"
          onClick={(e) => { e.stopPropagation(); onSchedule(post); }}
        >
          <Send className="h-3 w-3" />
          Schedule
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-[11px]"
          onClick={(e) => { e.stopPropagation(); onEdit(post); }}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function DraftQueue({
  drafts,
  onEdit,
  onSchedule,
  onPreview,
}: {
  drafts: Post[];
  onEdit: (post: Post) => void;
  onSchedule: (post: Post) => void;
  onPreview: (post: Post) => void;
}) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? drafts : drafts.slice(0, DRAFT_PAGE_SIZE);
  const hidden = drafts.length - DRAFT_PAGE_SIZE;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 shadow-sm overflow-hidden">
      {/* Toggle button — always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 sm:px-5 hover:bg-amber-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 border border-amber-200">
            <FileText className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Draft Queue</span>
          <span className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5">
            {drafts.length}
          </span>
          {!open && (
            <span className="hidden sm:inline text-[11px] text-amber-600 font-normal">
              — click to expand and drag onto the calendar
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </motion.div>
      </button>

      {/* Sliding body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="draft-queue-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-amber-200/70 p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visible.map((post) => (
                  <DraggableDraftCard
                    key={post.id}
                    post={post}
                    onEdit={onEdit}
                    onSchedule={onSchedule}
                    onPreview={onPreview}
                  />
                ))}
              </div>

              {!showAll && hidden > 0 && (
                <button
                  onClick={() => setShowAll(true)}
                  className="mt-3 w-full rounded-xl border border-amber-200 bg-white/70 py-2 text-[12px] font-medium text-amber-700 hover:bg-white transition-colors"
                >
                  Show {hidden} more draft{hidden !== 1 ? 's' : ''} →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Week view ─────────────────────────────────────────────────────────────────

const WEEK_START_H = 6;   // 6 AM
const WEEK_END_H   = 22;  // 10 PM
const HOUR_PX      = 64;  // px per hour row

const WEEK_COLORS: Record<Post['status'], { bg: string; border: string; text: string }> = {
  scheduled: { bg: '#eff6ff', border: '#0a66c2', text: '#0a66c2'  },
  published: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d'  },
  draft:     { bg: '#fffbeb', border: '#f59e0b', text: '#92400e'  },
  failed:    { bg: '#fef2f2', border: '#ef4444', text: '#991b1b'  },
};

function WeekView({
  weekStart,
  postsByDate,
  onPostClick,
}: {
  weekStart: Date;
  postsByDate: Map<string, Post[]>;
  onPostClick: (post: Post) => void;
}) {
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const hours = useMemo(
    () => Array.from({ length: WEEK_END_H - WEEK_START_H }, (_, i) => WEEK_START_H + i),
    [],
  );
  const totalH = (WEEK_END_H - WEEK_START_H) * HOUR_PX;

  const now        = new Date();
  const currentH   = now.getHours() + now.getMinutes() / 60;
  const todayStr   = format(now, 'yyyy-MM-dd');
  const nowTop     = (currentH - WEEK_START_H) * HOUR_PX;
  const showNowLine = currentH >= WEEK_START_H && currentH < WEEK_END_H;

  const scrollRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      const offset = Math.max(0, nowTop - 120);
      scrollRef.current.scrollTop = offset;
    }
  }, [nowTop]);

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Day-of-week header row */}
      <div className="grid border-b border-gray-100 bg-white sticky top-0 z-10" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
        <div className="border-r border-gray-100" />
        {weekDays.map(day => {
          const isT   = isToday(day);
          const dayStr = format(day, 'yyyy-MM-dd');
          const count  = (postsByDate.get(dayStr) ?? []).length;
          return (
            <div
              key={dayStr}
              className={cn(
                'py-3 text-center border-l border-gray-100 select-none',
                isT && 'bg-[#eff6ff]',
              )}
            >
              <p className={cn('text-[10px] font-semibold uppercase tracking-widest', isT ? 'text-[#0a66c2]' : 'text-gray-400')}>
                {format(day, 'EEE')}
              </p>
              <div className={cn(
                'mx-auto mt-1 h-8 w-8 flex items-center justify-center rounded-full text-[14px] font-bold',
                isT ? 'bg-[#0a66c2] text-white' : 'text-gray-800',
              )}>
                {format(day, 'd')}
              </div>
              {count > 0 && (
                <div className="mt-1 flex justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0a66c2]/40" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '580px' }}>
        <div className="relative grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)', height: totalH }}>

          {/* Hour labels + horizontal grid lines */}
          {hours.map(h => {
            const top = (h - WEEK_START_H) * HOUR_PX;
            const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
            return (
              <React.Fragment key={h}>
                {/* Time label */}
                <div
                  className="absolute left-0 w-14 flex items-start justify-end pr-2 pt-0.5 select-none pointer-events-none"
                  style={{ top }}
                >
                  <span className="text-[10px] text-gray-400 font-medium leading-none">{label}</span>
                </div>
                {/* Horizontal rule across all columns */}
                <div
                  className="absolute pointer-events-none border-t border-gray-100"
                  style={{ top, left: 56, right: 0 }}
                />
              </React.Fragment>
            );
          })}

          {/* Day columns */}
          {weekDays.map((day, colIdx) => {
            const dayStr  = format(day, 'yyyy-MM-dd');
            const isT     = dayStr === todayStr;
            const dayPosts = (postsByDate.get(dayStr) ?? []).filter(p =>
              p.scheduled_at || p.published_at
            );

            return (
              <div
                key={dayStr}
                className={cn(
                  'absolute top-0 bottom-0 border-l border-gray-100',
                  isT && 'bg-[#eff6ff]/30',
                )}
                style={{ left: `calc(56px + ${colIdx} * ((100% - 56px) / 7))`, width: 'calc((100% - 56px) / 7)' }}
              >
                {/* Current time line */}
                {isT && showNowLine && (
                  <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top: nowTop }}>
                    <div className="h-2.5 w-2.5 rounded-full bg-[#0a66c2] shrink-0 -ml-1.5 shadow-sm" />
                    <div className="flex-1 h-[2px] bg-[#0a66c2]" />
                  </div>
                )}

                {/* Post event blocks */}
                {dayPosts.map(post => {
                  const t      = new Date(post.scheduled_at ?? post.published_at!);
                  const postH  = t.getHours() + t.getMinutes() / 60;
                  if (postH < WEEK_START_H || postH >= WEEK_END_H) return null;
                  const top    = (postH - WEEK_START_H) * HOUR_PX + 2;
                  const height = HOUR_PX - 6;
                  const color  = WEEK_COLORS[post.status];
                  const preview = post.content.replace(/\n+/g, ' ').trim();

                  return (
                    <div
                      key={post.id}
                      className="absolute left-1 right-1 rounded-lg px-2 py-1.5 cursor-pointer hover:brightness-95 transition-all z-10 overflow-hidden"
                      style={{
                        top,
                        height,
                        backgroundColor: color.bg,
                        borderLeft: `3px solid ${color.border}`,
                      }}
                      onClick={() => onPostClick(post)}
                      title={post.content}
                    >
                      <p className="text-[10px] font-bold leading-none mb-0.5" style={{ color: color.border }}>
                        {format(t, 'h:mm a')}
                      </p>
                      <p
                        className="text-[11px] font-medium leading-snug"
                        style={{
                          color: color.text,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        } as React.CSSProperties}
                      >
                        {preview}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── View mode tab ─────────────────────────────────────────────────────────────

const views: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: 'month', label: 'Month', icon: CalendarDays },
  { id: 'week',  label: 'Week',  icon: Calendar     },
  { id: 'list',  label: 'List',  icon: LayoutList   },
  { id: 'board', label: 'Board', icon: Trello       },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export function ContentCalendar() {
  const { posts, setPosts, linkedInStatus } = useLinkedInStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const liProfile = linkedInStatus?.data?.profile as Record<string, string> | undefined;
  const previewName = liProfile?.firstName
    ? [liProfile.firstName, liProfile.lastName].filter(Boolean).join(' ')
    : user?.name || 'Your Name';
  const previewHeadline = liProfile?.headline || liProfile?.localizedHeadline || 'LinkedIn Member';
  const previewAvatar = liProfile?.pictureUrl || undefined;

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isFetchingImage, setIsFetchingImage] = useState(false);

  // Blob URL cache — keyed by post ID. Pre-fetched in the background so clicks are instant.
  const imageBlobCache = useRef<Map<string, string>>(new Map());

  // Revoke all cached blobs when the component unmounts.
  useEffect(() => {
    const cache = imageBlobCache.current;
    return () => { cache.forEach(url => URL.revokeObjectURL(url)); cache.clear(); };
  }, []);

  // Eagerly fetch images for all posts that have one, using limited concurrency.
  useEffect(() => {
    const postsWithImages = posts.filter(p => p.has_image && p.image_url?.startsWith('/'));
    if (postsWithImages.length === 0) return;

    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    let idx = 0;
    let cancelled = false;

    const fetchNext = async () => {
      while (idx < postsWithImages.length && !cancelled) {
        const post = postsWithImages[idx++];
        if (imageBlobCache.current.has(post.id)) continue;
        try {
          const res = await fetch(`${apiBase}${post.image_url}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: 'include',
          });
          if (!cancelled && res.ok) {
            const blob = await res.blob();
            if (!cancelled && blob.size > 0) {
              imageBlobCache.current.set(post.id, URL.createObjectURL(blob));
            }
          }
        } catch { /* silent */ }
      }
    };

    // 3 parallel workers
    fetchNext(); fetchNext(); fetchNext();
    return () => { cancelled = true; };
  }, [posts]);

  const openPostPreview = async (post: Post) => {
    setSelectedPost(post);
    setPreviewImageUrl(null);
    setIsFetchingImage(false);

    if (!post.has_image && !post.image_url) return;

    const raw = post.image_url ?? '';

    if (raw.startsWith('data:') || /^https?:\/\//i.test(raw)) {
      setPreviewImageUrl(raw);
      return;
    }

    if (raw.startsWith('/')) {
      // Serve from cache if already pre-fetched — instant
      const cached = imageBlobCache.current.get(post.id);
      if (cached) { setPreviewImageUrl(cached); return; }

      // Not cached yet (e.g. prefetch still in flight) — fetch on demand
      setIsFetchingImage(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
      try {
        const res = await fetch(`${apiBase}${raw}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          imageBlobCache.current.set(post.id, blobUrl);
          setPreviewImageUrl(blobUrl);
        }
      } catch { /* silent */ }
      finally { setIsFetchingImage(false); }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: selectedPost ? 999999 : 8 } }),
  );

  // Cancel any active DnD drag when the preview modal opens.
  // PointerSensor listens for 'pointercancel' to abort in-progress drags.
  useEffect(() => {
    if (selectedPost) {
      document.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
      dragActivated.current = false;
      setActiveId(null);
    }
  }, [selectedPost]);

  // Fetch posts on mount
  useEffect(() => {
    postsAPI.getPosts()
      .then((data) => setPosts(data.posts ?? []))
      .catch((err) => console.error('Failed to fetch posts:', err));
  }, [setPosts]);

  // Build calendar days (full weeks)
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const postsByDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    posts.forEach(post => {
      const d = postDate(post);
      if (!d) return;
      const key = format(d, 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(post);
      map.set(key, arr);
    });
    return map;
  }, [posts]);

  const unscheduledDrafts = useMemo(
    () => posts.filter(p => p.status === 'draft' && !p.scheduled_at),
    [posts],
  );

  const activePost = activeId ? posts.find(p => p.id === activeId) : null;

  // ── Drag handlers ────────────────────────────────────────────────────────────

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
    dragActivated.current = true;
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    // Defer reset by one tick — DnD's native listeners fire before React's synthetic onPointerUp,
    // so if we clear immediately the chip's onPointerUp would see false and open the preview.
    setTimeout(() => { dragActivated.current = false; }, 0);
    if (!over || active.id === over.id) return;

    const post = posts.find(p => p.id === active.id);
    if (!post || (post.status !== 'draft' && post.status !== 'scheduled')) return;

    // Board drop: over.id = "board-<status>" — support moving between draft/scheduled workflow states
    if (String(over.id).startsWith('board-')) {
      const targetStatus = String(over.id).replace('board-', '') as Post['status'];
      if (targetStatus !== 'draft' && targetStatus !== 'scheduled') {
        toast.info('Only draft and scheduled columns are editable.');
        return;
      }

      // Moving to draft clears schedule; moving to scheduled keeps existing schedule or assigns a default.
      const nextScheduledAt =
        targetStatus === 'draft'
          ? null
          : (post.scheduled_at ?? (() => {
              const d = new Date();
              d.setHours(12, 0, 0, 0);
              return d.toISOString();
            })());

      const previous = [...posts];
      setPosts(posts.map(p =>
        p.id === post.id
          ? { ...p, status: targetStatus, scheduled_at: nextScheduledAt ?? undefined }
          : p,
      ));

      try {
        const result = await postsAPI.updatePost(post.id, { scheduled_at: nextScheduledAt });
        setPosts(posts.map(p => p.id === result.post.id ? result.post : p));
        toast.success(targetStatus === 'draft' ? 'Moved to draft.' : 'Moved to scheduled.');
      } catch {
        setPosts(previous);
        toast.error('Failed to move post.');
      }
      return;
    }

    const targetDateStr = over.id as string;
    const targetDate = parseISO(targetDateStr);

    if (isPast(startOfDay(targetDate)) && !isToday(targetDate)) {
      toast.warning('Cannot schedule a post in the past.');
      return;
    }

    // Pick a time that is guaranteed to be in the future.
    // For today: next round hour + 1 h from now. For future dates: noon or keep existing time.
    const safeTime = (base: Date): Date => {
      if (isToday(base)) {
        const t = new Date();
        t.setHours(t.getHours() + 1, 0, 0, 0);
        return t;
      }
      return base;
    };

    let newIso: string;
    if (post.scheduled_at) {
      const existing = parseISO(post.scheduled_at);
      targetDate.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
      const candidate = safeTime(targetDate);
      newIso = candidate.toISOString();
    } else {
      targetDate.setHours(12, 0, 0, 0);
      const candidate = safeTime(targetDate);
      newIso = candidate.toISOString();
    }

    const previous = [...posts];
    setPosts(posts.map(p =>
      p.id === post.id
        ? { ...p, scheduled_at: newIso, status: 'scheduled' as const }
        : p,
    ));

    try {
      const result = await postsAPI.updatePost(post.id, { scheduled_at: newIso, status: 'scheduled' });
      setPosts(posts.map(p => p.id === result.post.id ? result.post : p));
      toast.success(`Scheduled for ${format(targetDate, 'MMM d, yyyy')}`);
    } catch {
      setPosts(previous);
      toast.error('Failed to reschedule post.');
    }
  };

  const handlePostUpdated = (updated: Post) => {
    setPosts(posts.map(p => p.id === updated.id ? updated : p));
    setSelectedPost(updated);
  };

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    if (viewMode === 'week')  setCurrentWeekStart(d => addDays(d, -7));
  };
  const handleNext = () => {
    if (viewMode === 'month') setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    if (viewMode === 'week')  setCurrentWeekStart(d => addDays(d, 7));
  };
  const handleToday = () => {
    setCurrentMonth(new Date());
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  return (
    <PageTransition>
      <DragDisabledCtx.Provider value={selectedPost !== null}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-3 animate-fade-in h-full">

          {/* Draft Queue */}
          {viewMode === 'month' && unscheduledDrafts.length > 0 && (
            <DraftQueue
              drafts={unscheduledDrafts}
              onEdit={(post) => setEditingPost(post)}
              onSchedule={(post) => navigate(`/dashboard/create-post?prefill=${post.id}`)}
              onPreview={openPostPreview}
            />
          )}

          {/* Main card */}
          <div className={cn(
            'bg-white rounded-xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.05)] flex flex-col flex-1 min-h-0',
            viewMode !== 'board' && 'overflow-hidden',
          )}>

            {/* Unified header bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8eaed] shrink-0 flex-wrap">

              {/* Date navigation (month + week only) */}
              {(viewMode === 'month' || viewMode === 'week') && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handlePrev}
                    className="h-7 w-7 flex items-center justify-center rounded-lg border border-[#e8eaed] text-[#6b7280] hover:bg-[#f8f9fb] hover:text-[#111827] transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[13px] font-bold text-[#111827] min-w-[140px] text-center select-none">
                    {viewMode === 'week'
                      ? `${format(currentWeekStart, 'MMM d')} – ${format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}`
                      : format(currentMonth, 'MMMM yyyy')
                    }
                  </span>
                  <button
                    onClick={handleNext}
                    className="h-7 w-7 flex items-center justify-center rounded-lg border border-[#e8eaed] text-[#6b7280] hover:bg-[#f8f9fb] hover:text-[#111827] transition-colors"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleToday}
                    className="ml-1 h-7 px-2.5 flex items-center rounded-lg border border-[#e8eaed] text-[12px] font-medium text-[#6b7280] hover:bg-[#f8f9fb] hover:text-[#111827] transition-colors"
                  >
                    Today
                  </button>
                </div>
              )}

              {/* View switcher */}
              <div className="flex items-center gap-0.5 rounded-lg border border-[#e8eaed] bg-[#f8f9fb] p-0.5 ml-auto">
                {views.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setViewMode(v.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all duration-150',
                      viewMode === v.id
                        ? 'bg-white text-[#111827] shadow-sm'
                        : 'text-[#6b7280] hover:text-[#374151]',
                    )}
                  >
                    <v.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{v.label}</span>
                  </button>
                ))}
              </div>

              {/* New post */}
              <Button
                size="sm"
                onClick={() => navigate('/dashboard/create-post')}
                className="h-8 text-[13px] rounded-lg bg-[#0a66c2] hover:bg-[#0958a8] gap-1.5 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New post</span>
              </Button>
            </div>

            {/* Month view */}
            {viewMode === 'month' && (
              <div className="flex flex-col flex-1 min-h-0 overflow-auto">
                <div className="grid grid-cols-7 border-b border-[#f3f4f6] shrink-0">
                  {DAYS_OF_WEEK.map((d, i) => (
                    <div
                      key={d}
                      className={cn(
                        'py-2 text-center text-[11px] font-semibold uppercase tracking-widest',
                        i === 0 || i === 6 ? 'text-[#c0c4cc]' : 'text-[#9ca3af]',
                        i > 0 && 'border-l border-[#f3f4f6]',
                      )}
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="p-3 overflow-x-auto">
                  <div className="min-w-[560px] grid grid-cols-7 gap-2">
                    {calendarDays.map(day => (
                      <CalendarCell
                        key={day.toISOString()}
                        date={day}
                        posts={postsByDate.get(format(day, 'yyyy-MM-dd')) ?? []}
                        currentMonth={currentMonth}
                        onPostClick={openPostPreview}
                        onDayClick={(ds) => navigate(`/dashboard/create-post?scheduled_date=${ds}`)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Week view */}
            {viewMode === 'week' && (
              <WeekView
                weekStart={currentWeekStart}
                postsByDate={postsByDate}
                onPostClick={openPostPreview}
              />
            )}

            {/* List view */}
            {viewMode === 'list' && (
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0">
                <ListView posts={posts} onPostClick={openPostPreview} />
              </div>
            )}

            {/* Board view */}
            {viewMode === 'board' && (
              <div className="overflow-x-auto p-4">
                <BoardView posts={posts} onPostClick={openPostPreview} />
              </div>
            )}
          </div>
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {selectedPost && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setSelectedPost(null); setPreviewImageUrl(null); setIsFetchingImage(false); }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
                className="w-full max-w-2xl rounded-2xl border border-[#e8eaed] bg-white shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[#e8eaed] px-5 py-3.5 shrink-0">
                  <h3 className="text-[15px] font-bold text-[#111827]">Post Preview</h3>
                  <button className="h-7 w-7 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-[#374151] hover:bg-[#f3f4f6] transition-colors" onClick={() => { setSelectedPost(null); setPreviewImageUrl(null); setIsFetchingImage(false); }}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4 bg-[#f8f9fb] shrink-0">
                  <LinkedInPreview
                    content={selectedPost.content}
                    linkUrl={selectedPost.link_url}
                    postType={resolvePreviewType(selectedPost)}
                    imagePreviewUrl={previewImageUrl ?? (isFetchingImage ? undefined : resolveImagePreview(selectedPost))}
                    videoUrl={resolveVideoPreview(selectedPost)}
                    authorName={previewName}
                    authorHeadline={previewHeadline}
                    authorAvatar={previewAvatar}
                  />
                </div>
                <div className="border-t border-[#e8eaed] px-5 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border', chipStyle[selectedPost.status])}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', dotStyle[selectedPost.status])} />
                      {statusLabel[selectedPost.status]}
                    </span>
                    {selectedPost.scheduled_at && (
                      <span className="text-[12px] text-[#6b7280]">
                        {format(parseISO(selectedPost.scheduled_at), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(selectedPost.status === 'draft' || selectedPost.status === 'scheduled') && (
                      <Button size="sm" variant="outline" className="h-7 text-[12px] rounded-lg border-[#e8eaed]" onClick={() => setEditingPost(selectedPost)}>
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    )}
                    <Button size="sm" className="h-7 text-[12px] rounded-lg bg-[#0a66c2] hover:bg-[#0958a8]" onClick={() => { setSelectedPost(null); navigate('/dashboard/posts'); }}>
                      <ExternalLink className="mr-1 h-3 w-3" />
                      All posts
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Drag overlay */}
        <DragOverlay dropAnimation={null}>
          {activePost && (
            activePost.status === 'draft' && !activePost.scheduled_at ? (
              <div className="w-[200px] rounded-xl border border-amber-200 bg-white p-3 shadow-2xl rotate-2 opacity-95">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 capitalize mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {activePost.post_type}
                </span>
                <p className="text-[11px] text-gray-700 line-clamp-2 leading-relaxed">{activePost.content}</p>
              </div>
            ) : (
              <PostChip post={activePost} overlay />
            )
          )}
        </DragOverlay>

        {/* Edit modal */}
        <EditPostModal
          post={editingPost}
          open={editingPost !== null}
          onOpenChange={(o) => { if (!o) setEditingPost(null); }}
          onSaved={handlePostUpdated}
        />
      </DndContext>
      </DragDisabledCtx.Provider>
    </PageTransition>
  );
}
