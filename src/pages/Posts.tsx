import { useEffect, useRef, useState, type ElementType } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { PageError } from '@/components/ui/page-error';
import { EmptyState } from '@/components/ui/empty-state';
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Calendar,
  Video,
  FileUp,
  Pencil,
  Search,
  X,
  ExternalLink,
} from 'lucide-react';
import { useLinkedInStore } from '@/store/useLinkedInStore';
import { postsAPI, type Post } from '@/lib/api';
import { PublishLogModal } from '@/components/posts/PublishLogModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ImportModal } from '@/components/posts/ImportModal';
import { EditPostModal } from '@/components/posts/EditPostModal';

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'failed';
type ExtPost = Omit<Post, 'status'> & { status: Post['status'] | 'publishing' };

const statusMeta: Record<string, { label: string; icon: ElementType; dot: string; pill: string }> = {
  published: {
    label: 'Published', icon: CheckCircle,
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  draft: {
    label: 'Draft', icon: Clock,
    dot: 'bg-amber-400',
    pill: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  scheduled: {
    label: 'Scheduled', icon: Calendar,
    dot: 'bg-[#0a66c2]',
    pill: 'bg-blue-50 text-[#0a66c2] border-blue-200',
  },
  failed: {
    label: 'Failed', icon: XCircle,
    dot: 'bg-rose-500',
    pill: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  publishing: {
    label: 'Publishing', icon: RefreshCw,
    dot: 'bg-[#0a66c2]',
    pill: 'bg-blue-50 text-[#0a66c2] border-blue-200',
  },
};

const typeIcon: Record<string, ElementType> = {
  text:  FileText,
  image: ImageIcon,
  link:  LinkIcon,
  video: Video,
};

const accentBar: Record<string, string> = {
  draft:      'bg-amber-400',
  scheduled:  'bg-[#0a66c2]',
  publishing: 'bg-[#0a66c2]',
  published:  'bg-emerald-500',
  failed:     'bg-rose-500',
};

function getFailureReason(post: Post): string | null {
  return post.failure_reason ?? post.error_message ?? post.error ?? null;
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onDelete,
  onPublish,
  onEdit,
  onViewLog,
  onRetry,
  isSelected,
  onToggleSelect,
}: {
  post: ExtPost;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onEdit: (post: ExtPost) => void;
  onViewLog: (id: string) => void;
  onRetry: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const [deleting,    setDeleting]    = useState(false);
  const [publishing,  setPublishing]  = useState(false);
  const [retrying,    setRetrying]    = useState(false);
  const [logReason,   setLogReason]   = useState<string | null>(null);

  const meta        = statusMeta[post.status] ?? statusMeta['draft'];
  const TypeIcon    = typeIcon[post.post_type] ?? FileText;
  const isPublishing  = post.status === 'publishing';
  const failureReason = post.status === 'failed' ? getFailureReason(post as Post) : null;

  useEffect(() => {
    if (post.status !== 'failed' || failureReason) return;
    postsAPI.getLogs(post.id)
      .then((data) => {
        const failed = (data.logs ?? [])
          .filter((l: any) => l.status === 'failed' || l.error_code || l.error_message)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        if (failed) {
          const msg = [failed.error_code, failed.error_message].filter(Boolean).join(' — ');
          if (msg) setLogReason(msg);
        }
      })
      .catch(() => {});
  }, [post.id, post.status]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await postsAPI.deletePost(post.id);
      onDelete(post.id);
      toast.success('Post deleted.');
    } catch {
      toast.error('Failed to delete post.');
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await postsAPI.publishPost(post.id);
      onPublish(post.id);
      toast.success('Post published to LinkedIn!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to publish post.');
    } finally {
      setPublishing(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await postsAPI.retryPost(post.id);
      onRetry(post.id);
      toast.success('Retrying post...');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to retry post.');
    } finally {
      setRetrying(false);
    }
  };


  return (
    <div
      className={cn(
        'group relative flex items-start gap-2.5 bg-white rounded-xl border px-4 py-3 overflow-hidden transition-all duration-150',
        isSelected
          ? 'border-[#0a66c2]/30 bg-[#0a66c2]/[0.015] shadow-sm'
          : 'border-[#e8eaed] hover:border-[#d1d5db] hover:shadow-[0_1px_6px_rgba(0,0,0,0.06)]',
      )}
    >
      {/* Left accent bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl', accentBar[post.status] ?? 'bg-amber-400')} />

      {/* Checkbox */}
      {onToggleSelect && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(post.id)}
          className="mt-0.5 shrink-0"
          aria-label="Select post"
        />
      )}

      {/* Type icon */}
      <div className="h-7 w-7 rounded-lg bg-[#f3f4f6] flex items-center justify-center shrink-0 mt-0.5">
        <TypeIcon className="h-3.5 w-3.5 text-[#6b7280]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 mt-0.5">
        <p className="text-[13px] text-[#111827] leading-snug line-clamp-2 pr-2">{post.content}</p>

        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 text-[11px] text-[#9ca3af]">
          <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
          <span>·</span>
          <span className="capitalize">{post.post_type}</span>
          {post.status === 'scheduled' && post.scheduled_at && (
            <>
              <span>·</span>
              <span className="text-[#0a66c2] font-medium">
                Sends {format(new Date(post.scheduled_at), 'MMM d, h:mm a')}
              </span>
            </>
          )}
          {post.status === 'published' && post.published_at && (
            <>
              <span>·</span>
              <span>Published {format(new Date(post.published_at), 'MMM d')}</span>
            </>
          )}
          {post.status === 'published' && post.linkedin_post_id && (
            <>
              <span>·</span>
              <a
                href={`https://www.linkedin.com/feed/update/${post.linkedin_post_id}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0a66c2] hover:underline"
                onClick={e => e.stopPropagation()}
              >
                View on LinkedIn
              </a>
            </>
          )}
          {post.link_url && (
            <>
              <span>·</span>
              <span className="truncate max-w-[140px]">{post.link_url}</span>
            </>
          )}
        </div>

        {post.status === 'failed' && (
          <div className="mt-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700">
            <p className="font-semibold uppercase tracking-wide text-[10px] mb-0.5">Failure reason</p>
            {failureReason || logReason ? (
              <p className="leading-relaxed break-words">{failureReason ?? logReason}</p>
            ) : (
              <p className="leading-relaxed break-words italic opacity-70">Fetching error details…</p>
            )}
          </div>
        )}

        {post.status === 'failed' && (
          <button
            className="mt-1.5 text-[11px] text-[#0a66c2] underline hover:no-underline"
            onClick={() => onViewLog(post.id)}
          >
            View publish log
          </button>
        )}
      </div>

      {/* Right side */}
      <div className="shrink-0 flex flex-col items-end gap-1.5 mt-0.5">

        {/* Status badge */}
        <span className={cn(
          'inline-flex items-center gap-1 text-[10.5px] font-medium px-1.5 py-0.5 rounded-full border',
          meta.pill,
        )}>
          {isPublishing
            ? <RefreshCw className="h-2 w-2 animate-spin" />
            : <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', meta.dot)} />
          }
          {meta.label}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {post.status === 'published' && post.linkedin_post_id && (
            <a href={`https://www.linkedin.com/feed/update/${post.linkedin_post_id}/`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
              <button className="h-6 w-6 flex items-center justify-center rounded-md text-[#0a66c2] hover:bg-[#0a66c2]/10 transition-colors" title="View on LinkedIn">
                <ExternalLink className="h-3 w-3" />
              </button>
            </a>
          )}
          {(post.status === 'draft' || post.status === 'scheduled') && (
            <button className="h-6 w-6 flex items-center justify-center rounded-md text-[#6b7280] hover:text-[#111827] hover:bg-[#f3f4f6] transition-colors" onClick={() => onEdit(post)} disabled={publishing || deleting} title="Edit">
              <Pencil className="h-3 w-3" />
            </button>
          )}
          <button className="h-6 w-6 flex items-center justify-center rounded-md text-[#6b7280] hover:text-rose-600 hover:bg-rose-50 transition-colors" onClick={handleDelete} disabled={deleting || publishing} title="Delete">
            {deleting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </button>
        </div>

        {post.status === 'draft' && (
          <button className="h-6 flex items-center gap-1 px-2 rounded-lg text-[11px] font-medium bg-[#0a66c2] hover:bg-[#0958a8] text-white transition-colors disabled:opacity-60" onClick={handlePublish} disabled={publishing || deleting}>
            {publishing ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Send className="h-2.5 w-2.5" />}
            Publish
          </button>
        )}
        {post.status === 'failed' && (
          <button className="h-6 flex items-center gap-1 px-2 rounded-lg text-[11px] font-medium border border-[#0a66c2]/30 text-[#0a66c2] hover:bg-[#0a66c2]/5 transition-colors disabled:opacity-60" onClick={handleRetry} disabled={retrying || deleting}>
            {retrying ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <RotateCcw className="h-2.5 w-2.5" />}
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// ── Posts page ────────────────────────────────────────────────────────────────

export function Posts() {
  const { posts, setPosts, removePost } = useLinkedInStore();
  const [isFetching,       setIsFetching]       = useState(posts.length === 0);
  const [fetchError,       setFetchError]        = useState<string | null>(null);
  const [importOpen,       setImportOpen]        = useState(false);
  const [editingPost,      setEditingPost]       = useState<Post | null>(null);
  const [searchQuery,      setSearchQuery]       = useState('');
  const [selectedIds,      setSelectedIds]       = useState<Set<string>>(new Set());
  const [isBulkDeleting,   setIsBulkDeleting]   = useState(false);
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [isPausingAll,     setIsPausingAll]     = useState(false);
  const [logPostId,        setLogPostId]         = useState<string | null>(null);
  const [activeTab,        setActiveTab]         = useState<StatusFilter>('draft');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const draftCount      = posts.filter(p => p.status === 'draft').length;
  const scheduledCount  = posts.filter(p => p.status === 'scheduled').length;
  const publishedCount  = posts.filter(p => p.status === 'published').length;
  const failedCount     = posts.filter(p => p.status === 'failed').length;

  const fetchPosts = (silent = false) => {
    if (!silent) setIsFetching(true);
    setFetchError(null);
    postsAPI.getPosts()
      .then(data => setPosts(data.posts ?? []))
      .catch(() => { if (!silent) setFetchError('Could not load posts. Check your connection and try again.'); })
      .finally(() => { if (!silent) setIsFetching(false); });
  };

  useEffect(() => { fetchPosts(posts.length > 0); }, []);

  const postsRef = useRef(posts);
  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => {
    const interval = setInterval(() => {
      const hasActive = postsRef.current.some(
        p => p.status === 'scheduled' || (p.status as string) === 'publishing'
      );
      if (!hasActive) return;
      postsAPI.getPosts().then(data => setPosts(data.posts ?? [])).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchParams.get('import') === '1') {
      setImportOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleDelete      = (id: string) => {
    removePost(id);
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };
  const handlePostUpdated = (updated: Post) => setPosts(posts.map(p => p.id === updated.id ? updated : p));
  const handlePublish     = (id: string) => setPosts(posts.map(p =>
    p.id === id ? { ...p, status: 'published' as const, published_at: new Date().toISOString() } : p
  ));
  const handleRetry       = (id: string) => setPosts(posts.map(p =>
    p.id === id ? { ...p, status: 'publishing' as unknown as Post['status'] } : p
  ));

  const toggleSelect   = (id: string) => setSelectedIds(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });
  const selectAll      = (list: Post[]) => setSelectedIds(new Set(list.map(p => p.id)));
  const clearSelection = ()             => setSelectedIds(new Set());

  const handleTabChange = (tab: StatusFilter) => {
    setActiveTab(tab);
    setSearchQuery('');
    clearSelection();
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(ids.map(id => postsAPI.deletePost(id)));
    const succeeded = ids.filter((_, i) => results[i].status === 'fulfilled');
    succeeded.forEach(id => removePost(id));
    clearSelection();
    setIsBulkDeleting(false);
    succeeded.length === ids.length
      ? toast.success(`Deleted ${succeeded.length} post${succeeded.length > 1 ? 's' : ''}.`)
      : toast.warning(`Deleted ${succeeded.length} of ${ids.length} posts.`);
  };

  const handleBulkPublish = async () => {
    setIsBulkPublishing(true);
    const ids = Array.from(selectedIds).filter(id => posts.find(p => p.id === id)?.status === 'draft');
    if (ids.length === 0) { toast.info('No draft posts selected.'); setIsBulkPublishing(false); return; }
    const results = await Promise.allSettled(ids.map(id => postsAPI.publishPost(id)));
    const succeeded = ids.filter((_, i) => results[i].status === 'fulfilled');
    if (succeeded.length > 0) {
      setPosts(posts.map(p =>
        succeeded.includes(p.id) ? { ...p, status: 'published' as const, published_at: new Date().toISOString() } : p
      ));
    }
    clearSelection();
    setIsBulkPublishing(false);
    succeeded.length === ids.length
      ? toast.success(`Published ${succeeded.length} post${succeeded.length > 1 ? 's' : ''}.`)
      : toast.warning(`Published ${succeeded.length} of ${ids.length} posts.`);
  };


  const handlePauseAll = async () => {
    const scheduledIds = posts.filter(p => p.status === 'scheduled').map(p => p.id);
    if (scheduledIds.length === 0) { toast.info('No scheduled posts to pause.'); return; }
    setIsPausingAll(true);
    // Process in small sequential batches: firing every request at once exceeds the
    // browser's per-host connection limit, so queued requests hit the axios timeout
    // and only a handful succeed. Batching keeps every request within its timeout.
    const BATCH_SIZE = 4;
    const succeeded: string[] = [];
    let failed = 0;
    try {
      for (let i = 0; i < scheduledIds.length; i += BATCH_SIZE) {
        const batch = scheduledIds.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(id => postsAPI.updatePost(id, { scheduled_at: null }))
        );
        results.forEach((r, j) => {
          if (r.status === 'fulfilled') succeeded.push(batch[j]);
          else failed += 1;
        });
      }
      if (succeeded.length > 0) {
        setPosts(postsRef.current.map(p =>
          succeeded.includes(p.id) ? { ...p, status: 'draft' as const, scheduled_at: undefined } : p
        ));
      }
      if (failed === 0) {
        toast.success(`Paused ${succeeded.length} scheduled post${succeeded.length > 1 ? 's' : ''} — moved to drafts.`);
      } else {
        toast.warning(`Paused ${succeeded.length} of ${scheduledIds.length} — ${failed} failed. Tap Pause all again to retry the rest.`);
      }
    } finally {
      setIsPausingAll(false);
    }
  };

  const filtered = (status: StatusFilter) => {
    const base = status === 'all' ? posts : posts.filter(p => p.status === status);
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(p => p.content.toLowerCase().includes(q));
  };

  const tabDefs: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all',       label: 'All',       count: posts.length   },
    { value: 'draft',     label: 'Drafts',    count: draftCount     },
    { value: 'scheduled', label: 'Scheduled', count: scheduledCount },
    { value: 'published', label: 'Published', count: publishedCount },
    { value: 'failed',    label: 'Failed',    count: failedCount    },
  ];

  return (
    <div className="flex flex-col gap-3 h-full animate-fade-in">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
          <button
            onClick={() => {
              setIsFetching(true);
              setFetchError(null);
              postsAPI.getPosts()
                .then(data => { setPosts(data.posts ?? []); toast.success('Refreshed.'); })
                .catch(() => { setFetchError('Refresh failed.'); toast.error('Failed to refresh.'); })
                .finally(() => setIsFetching(false));
            }}
            disabled={isFetching}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e8eaed] bg-white text-[#9ca3af] hover:text-[#374151] hover:bg-[#f8f9fb] transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
          </button>

          {scheduledCount > 0 && (
            <Button variant="outline" size="sm" onClick={handlePauseAll} disabled={isPausingAll}
              className="h-8 text-[13px] rounded-lg border-[#e8eaed] text-[#374151] hover:bg-[#f8f9fb] gap-1.5">
              {isPausingAll ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Pause all</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}
            className="h-8 text-[13px] rounded-lg border-[#e8eaed] text-[#374151] hover:bg-[#f8f9fb] gap-1.5">
            <FileUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button size="sm" onClick={() => navigate('/dashboard/create-post')}
            className="h-8 text-[13px] rounded-lg bg-[#0a66c2] hover:bg-[#0958a8] gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Create post
          </Button>
      </div>

      {/* ── Main card ───────────────────────────────────────────────── */}
      <Card className="bg-white border-[#e8eaed] flex flex-col flex-1 min-h-0 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden">

        {/* Underline tab bar */}
        <div className="flex border-b border-[#e8eaed] overflow-x-auto scrollbar-hide shrink-0 px-2">
          {tabDefs.map(tab => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={cn(
                'relative px-3 py-3.5 text-[13px] font-medium whitespace-nowrap transition-colors shrink-0',
                activeTab === tab.value
                  ? 'text-[#0a66c2]'
                  : 'text-[#6b7280] hover:text-[#374151]',
              )}
            >
              {tab.label} ({tab.count})
              {activeTab === tab.value && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0a66c2] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="px-4 pt-2.5 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9ca3af] pointer-events-none" />
            <Input
              placeholder="Search posts…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-[13px] bg-[#f8f9fb] border-[#e8eaed] rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded text-[#9ca3af] hover:text-[#374151]"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <CardContent className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 pt-1 space-y-1.5">

          {fetchError && <PageError message={fetchError} onRetry={fetchPosts} />}

          {isFetching ? (
            <div className="space-y-2 pt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-4 border border-[#e8eaed] rounded-xl bg-white">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/3" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : (() => {
            const tabPosts = filtered(activeTab);
            const allSel   = tabPosts.length > 0 && tabPosts.every(p => selectedIds.has(p.id));
            return (
              <div className="space-y-1.5 pt-0.5">
                {tabPosts.length === 0 ? (
                  searchQuery ? (
                    <EmptyState icon={MessageSquare} title="No posts match your search" description="Try a different search term or clear the search." />
                  ) : activeTab === 'all' ? (
                    <EmptyState icon={MessageSquare} title="No posts yet" description="Create your first post or import from a spreadsheet to get started." action={{ label: 'Create post', onClick: () => navigate('/dashboard/create-post'), icon: Plus }} />
                  ) : activeTab === 'draft' ? (
                    <EmptyState icon={FileText} title="No drafts" description="Write a post and save it as a draft — it will appear here until you publish it." action={{ label: 'Write a draft', onClick: () => navigate('/dashboard/create-post'), icon: Plus }} />
                  ) : activeTab === 'scheduled' ? (
                    <EmptyState icon={Calendar} title="No scheduled posts" description="Pick a future date and time when creating a post to schedule it." action={{ label: 'Schedule a post', onClick: () => navigate('/dashboard/create-post'), icon: Plus }} />
                  ) : activeTab === 'published' ? (
                    <EmptyState icon={CheckCircle} title="Nothing published yet" description="Once a post is published to LinkedIn it appears here. Publish a draft or create a new post." action={{ label: 'Create post', onClick: () => navigate('/dashboard/create-post'), icon: Plus }} />
                  ) : activeTab === 'failed' ? (
                    <EmptyState icon={CheckCircle} title="All clear" description="No failed posts — everything is running smoothly." />
                  ) : (
                    <EmptyState icon={MessageSquare} title={`No ${activeTab} posts`} description="Nothing here yet." />
                  )
                ) : (
                  <>
                    {/* Select all / bulk bar */}
                    <div className="flex items-center justify-between py-0.5 px-0.5">
                      <button
                        className="text-[12px] text-[#9ca3af] hover:text-[#374151] transition-colors"
                        onClick={() => allSel ? clearSelection() : selectAll(tabPosts)}
                      >
                        {allSel ? 'Deselect all' : `Select all ${tabPosts.length}`}
                      </button>
                      {selectedIds.size > 0 && (
                        <span className="text-[12px] text-[#6b7280] font-medium">
                          {selectedIds.size} selected
                        </span>
                      )}
                    </div>

                    {/* Bulk action bar */}
                    {selectedIds.size > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#e8eaed] bg-[#f8f9fb]">
                        <span className="text-[12px] font-semibold text-[#111827]">
                          {selectedIds.size} selected
                        </span>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1 ml-2" onClick={handleBulkPublish} disabled={isBulkPublishing || isBulkDeleting}>
                          {isBulkPublishing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3" />Publish drafts</>}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1 text-rose-600 hover:bg-rose-50 border-rose-200" onClick={handleBulkDelete} disabled={isBulkDeleting || isBulkPublishing}>
                          {isBulkDeleting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <><Trash2 className="h-3 w-3" />Delete</>}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs ml-auto text-[#6b7280]" onClick={clearSelection}>
                          Cancel
                        </Button>
                      </div>
                    )}

                    {/* Post list */}
                    <div className="space-y-1.5">
                      {tabPosts.map(post => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onDelete={handleDelete}
                          onPublish={handlePublish}
                          onEdit={p => setEditingPost(p as Post)}
                          onViewLog={setLogPostId}
                          onRetry={handleRetry}
                          isSelected={selectedIds.has(post.id)}
                          onToggleSelect={toggleSelect}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <EditPostModal
        post={editingPost}
        open={editingPost !== null}
        onOpenChange={(o) => { if (!o) setEditingPost(null); }}
        onSaved={handlePostUpdated}
      />

      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportDone={() => {
          setIsFetching(true);
          postsAPI.getPosts()
            .then(data => setPosts(data.posts ?? []))
            .catch(() => toast.error('Failed to refresh posts after import.'))
            .finally(() => setIsFetching(false));
        }}
      />

      <PublishLogModal postId={logPostId} onClose={() => setLogPostId(null)} />
    </div>
  );
}
