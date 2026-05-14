import { useEffect, useRef, useState, type ElementType } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  Copy,
  BookmarkPlus,
} from 'lucide-react';
import { useLinkedInStore } from '@/store/useLinkedInStore';
import { postsAPI, type Post } from '@/lib/api';
import { PublishLogModal } from '@/components/posts/PublishLogModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ImportModal } from '@/components/posts/ImportModal';
import { EditPostModal } from '@/components/posts/EditPostModal';
import { saveTemplate } from '@/lib/templates';

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'failed';
type ExtPost = Omit<Post, 'status'> & { status: Post['status'] | 'publishing' };

const statusMeta: Record<string, { label: string; icon: ElementType; dot: string; badge: string; text: string }> = {
  published: {
    label: 'Published', icon: CheckCircle,
    dot: 'bg-green-500', badge: 'badge-success',
    text: 'text-green-600',
  },
  draft: {
    label: 'Draft', icon: Clock,
    dot: 'bg-amber-500', badge: 'badge-warning',
    text: 'text-amber-600',
  },
  scheduled: {
    label: 'Scheduled', icon: Calendar,
    dot: 'bg-[#0a66c2]', badge: 'badge-info',
    text: 'text-[#0a66c2]',
  },
  failed: {
    label: 'Failed', icon: XCircle,
    dot: 'bg-red-500', badge: 'badge-error',
    text: 'text-red-600',
  },
  publishing: {
    label: 'Publishing', icon: RefreshCw,
    dot: 'bg-[#0a66c2]', badge: 'badge-info',
    text: 'text-[#0a66c2]',
  },
};

const typeIcon = {
  text:  FileText,
  image: ImageIcon,
  link:  LinkIcon,
  video: Video,
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
  onDuplicate,
  isSelected,
  onToggleSelect,
}: {
  post: ExtPost;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onEdit: (post: ExtPost) => void;
  onViewLog: (id: string) => void;
  onRetry: (id: string) => void;
  onDuplicate: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const [deleting,   setDeleting]   = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [retrying,   setRetrying]   = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [logReason,  setLogReason]  = useState<string | null>(null);
  const meta        = statusMeta[post.status] ?? statusMeta['draft'];
  const TypeIcon    = typeIcon[post.post_type] ?? FileText;
  const failureReason = post.status === 'failed' ? getFailureReason(post as Post) : null;
  const isPublishing  = post.status === 'publishing';

  // Auto-fetch publish log error when the post itself has no failure reason
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
      const msg = err.response?.data?.message ?? 'Failed to retry post.';
      toast.error(msg);
    } finally {
      setRetrying(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const result = await postsAPI.duplicatePost(post.id);
      onDuplicate(result.post.id);
      toast.success('Post duplicated as draft.');
    } catch {
      toast.error('Failed to duplicate post.');
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <div
      className={cn(
        'post-card group',
        isSelected && 'border-primary/40 bg-primary/[0.02]',
      )}
      data-status={post.status}
    >
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
      <div className="icon-container-sm shrink-0 mt-0.5">
        <TypeIcon className="h-3.5 w-3.5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-foreground line-clamp-2 leading-relaxed">{post.content}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[11px] text-muted-foreground">
          <span className={cn('flex items-center gap-1 font-medium', meta.text)}>
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isPublishing ? 'hidden' : meta.dot)} />
            {isPublishing && <RefreshCw className="h-3 w-3 animate-spin text-[#0a66c2]" />}
            {meta.label}
          </span>
          <span>·</span>
          <span>{format(new Date(post.created_at), 'MMM d, yyyy')}</span>
          <span>·</span>
          <span className="capitalize">{post.post_type}</span>
          {post.status === 'scheduled' && post.scheduled_at && (
            <>
              <span>·</span>
              <span className="text-blue-600 dark:text-blue-400 font-medium">
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
          <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            <p className="font-semibold uppercase tracking-wide text-[10px] mb-0.5">Failure reason</p>
            {failureReason || logReason ? (
              <p className="leading-relaxed break-words">{failureReason ?? logReason}</p>
            ) : (
              <p className="leading-relaxed break-words italic opacity-70">Fetching error details…</p>
            )}
          </div>
        )}

        {post.status === 'failed' && (
          <div className="mt-1.5">
            <button
              className="text-[11px] text-[#0a66c2] underline hover:no-underline"
              onClick={() => onViewLog(post.id)}
            >
              View publish log
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
        {(post.status === 'draft' || post.status === 'scheduled') && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(post)}
            disabled={publishing || deleting}
            aria-label="Edit post"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            navigator.clipboard.writeText(post.content);
            toast.success('Copied to clipboard.');
          }}
          aria-label="Copy content"
          title="Copy content"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            saveTemplate({ content: post.content, post_type: post.post_type });
            toast.success('Saved as template.');
          }}
          aria-label="Save as template"
          title="Save as template"
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
        </Button>

        {post.status === 'draft' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1"
            onClick={handlePublish}
            disabled={publishing || deleting}
            aria-label="Publish post"
          >
            {publishing
              ? <RefreshCw className="h-3 w-3 animate-spin" />
              : <><Send className="h-3 w-3" />Publish</>}
          </Button>
        )}

        {post.status === 'failed' && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1 text-[#0a66c2] border-[#0a66c2]/30 hover:bg-[#0a66c2]/5"
            onClick={handleRetry}
            disabled={retrying || deleting}
            aria-label="Retry post"
          >
            {retrying
              ? <RefreshCw className="h-3 w-3 animate-spin" />
              : <><RotateCcw className="h-3 w-3" />Retry</>}
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={handleDuplicate}
          disabled={duplicating || deleting}
          aria-label="Duplicate post"
        >
          {duplicating
            ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            : <Copy className="h-3.5 w-3.5" />}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={deleting || publishing}
          aria-label="Delete post"
        >
          {deleting
            ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

// ── Posts page ────────────────────────────────────────────────────────────────

export function Posts() {
  const { posts, setPosts, removePost } = useLinkedInStore();
  // Don't block the UI with skeletons if the store already has posts from a previous page load.
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const draftCount      = posts.filter(p => p.status === 'draft').length;
  const scheduledCount  = posts.filter(p => p.status === 'scheduled').length;
  const publishedCount  = posts.filter(p => p.status === 'published').length;
  const failedCount     = posts.filter(p => p.status === 'failed').length;
  const publishingCount = posts.filter(p => (p.status as string) === 'publishing').length;

  const fetchPosts = (silent = false) => {
    if (!silent) setIsFetching(true);
    setFetchError(null);
    postsAPI.getPosts()
      .then(data => setPosts(data.posts ?? []))
      .catch(() => { if (!silent) setFetchError('Could not load posts. Check your connection and try again.'); })
      .finally(() => { if (!silent) setIsFetching(false); });
  };

  // If store already has data, refresh silently in background — no skeletons.
  useEffect(() => { fetchPosts(posts.length > 0); }, []);

  // Silent background poll — runs once, checks a ref so posts changes don't restart the timer.
  const postsRef = useRef(posts);
  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => {
    const interval = setInterval(() => {
      const hasActive = postsRef.current.some(
        p => p.status === 'scheduled' || (p.status as string) === 'publishing'
      );
      if (!hasActive) return;
      postsAPI.getPosts()
        .then(data => setPosts(data.posts ?? []))
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchParams.get('import') === '1') {
      setImportOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleDelete = (id: string) => {
    removePost(id);
    setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const handlePostUpdated = (updated: Post) => {
    setPosts(posts.map(p => p.id === updated.id ? updated : p));
  };

  const handlePublish = (id: string) => {
    setPosts(posts.map(p =>
      p.id === id ? { ...p, status: 'published' as const, published_at: new Date().toISOString() } : p
    ));
  };

  const handleRetry = (id: string) => {
    setPosts(posts.map(p =>
      p.id === id ? { ...p, status: 'publishing' as unknown as Post['status'] } : p
    ));
  };

  const handleDuplicate = (newPostId: string) => {
    postsAPI.getPost(newPostId)
      .then(data => setPosts([data.post, ...posts]))
      .catch(() => {
        postsAPI.getPosts().then(d => setPosts(d.posts ?? [])).catch(() => {});
      });
  };

  const toggleSelect   = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };
  const selectAll      = (list: Post[]) => setSelectedIds(new Set(list.map(p => p.id)));
  const clearSelection = ()             => setSelectedIds(new Set());

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
        succeeded.includes(p.id)
          ? { ...p, status: 'published' as const, published_at: new Date().toISOString() }
          : p
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
    try {
      const results = await Promise.allSettled(
        scheduledIds.map(id => postsAPI.updatePost(id, { scheduled_at: null }))
      );
      const succeeded = scheduledIds.filter((_, i) => results[i].status === 'fulfilled');
      if (succeeded.length > 0) {
        setPosts(posts.map(p =>
          succeeded.includes(p.id) ? { ...p, status: 'draft' as const, scheduled_at: undefined } : p
        ));
        toast.success(`Paused ${succeeded.length} scheduled post${succeeded.length > 1 ? 's' : ''} — moved to drafts.`);
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

  return (
    <div className="space-y-3 animate-fade-in">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsFetching(true);
              setFetchError(null);
              postsAPI.getPosts()
                .then(data => { setPosts(data.posts ?? []); toast.success('Refreshed.'); })
                .catch(() => { setFetchError('Refresh failed.'); toast.error('Failed to refresh.'); })
                .finally(() => setIsFetching(false));
            }}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            <span className="hidden sm:inline ml-1.5">Refresh</span>
          </Button>
          {scheduledCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseAll}
              disabled={isPausingAll}
            >
              {isPausingAll
                ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                : <Clock className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline ml-1.5">Pause all</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <FileUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1.5">Import</span>
          </Button>
          <Button size="sm" onClick={() => navigate('/dashboard/create-post')}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create post
          </Button>
      </div>


      {/* ── Posts list ────────────────────────────────────────────── */}
      <Card className="bg-white border-[#dce6f1]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="icon-container-sm">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            All Posts
            {posts.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{posts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search posts…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Error */}
          {fetchError && <PageError message={fetchError} onRetry={fetchPosts} />}

          {/* Skeleton */}
          {isFetching ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-4 border border-border rounded-xl">
                  <Skeleton className="h-7 w-7 rounded-md shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Tabs
              defaultValue="draft"
              onValueChange={() => { setSearchQuery(''); clearSelection(); }}
            >
              {/* Tab list */}
              <TabsList className="mb-4 flex-wrap h-auto gap-1 bg-muted/50 p-1">
                <TabsTrigger value="all" className="text-xs gap-1.5 h-7 text-black data-[state=active]:text-black">
                  All
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{posts.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="draft" className="text-xs gap-1.5 h-7 text-black data-[state=active]:text-black">
                  Drafts
                  {draftCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {draftCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="text-xs gap-1.5 h-7 text-black data-[state=active]:text-black">
                  Scheduled
                  {scheduledCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {scheduledCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="published" className="text-xs gap-1.5 h-7 text-black data-[state=active]:text-black">
                  Published
                  {publishedCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{publishedCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="failed" className="text-xs gap-1.5 h-7 text-black data-[state=active]:text-black">
                  Failed
                  {failedCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                      {failedCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tab content */}
              {(['all', 'draft', 'scheduled', 'published', 'failed'] as StatusFilter[]).map((tab) => {
                const tabPosts  = filtered(tab);
                const allSel    = tabPosts.length > 0 && tabPosts.every(p => selectedIds.has(p.id));
                return (
                  <TabsContent key={tab} value={tab} className="space-y-2 mt-0">
                    {tabPosts.length === 0 ? (
                      searchQuery ? (
                        <EmptyState
                          icon={MessageSquare}
                          title="No posts match your search"
                          description="Try a different search term or clear the search."
                        />
                      ) : tab === 'all' ? (
                        <EmptyState
                          icon={MessageSquare}
                          title="No posts yet"
                          description="Create your first post or import from a spreadsheet to get started."
                          action={{ label: 'Create post', onClick: () => navigate('/dashboard/create-post'), icon: Plus }}
                        />
                      ) : tab === 'draft' ? (
                        <EmptyState
                          icon={FileText}
                          title="No drafts"
                          description="Write a post and save it as a draft — it will appear here until you publish it."
                          action={{ label: 'Write a draft', onClick: () => navigate('/dashboard/create-post'), icon: Plus }}
                        />
                      ) : tab === 'scheduled' ? (
                        <EmptyState
                          icon={Calendar}
                          title="Queue is empty"
                          description="Schedule a post to go live at the best time. Pick a future date and time when creating a post."
                          action={{ label: 'Schedule a post', onClick: () => navigate('/dashboard/create-post'), icon: Clock }}
                        />
                      ) : tab === 'published' ? (
                        <EmptyState
                          icon={CheckCircle}
                          title="Nothing published yet"
                          description="Once a post is published to LinkedIn it appears here. Publish a draft or create a new post."
                          action={{ label: 'Create post', onClick: () => navigate('/dashboard/create-post'), icon: Plus }}
                        />
                      ) : tab === 'failed' ? (
                        <EmptyState
                          icon={CheckCircle}
                          title="All clear"
                          description="No failed posts — everything is running smoothly."
                        />
                      ) : (
                        <EmptyState
                          icon={MessageSquare}
                          title={`No ${tab} posts`}
                          description="Nothing here yet."
                        />
                      )
                    ) : (
                      <>
                        {/* Select all / bulk bar */}
                        <div className="flex items-center justify-between py-1 px-0.5">
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => allSel ? clearSelection() : selectAll(tabPosts)}
                          >
                            {allSel ? 'Deselect all' : `Select all ${tabPosts.length}`}
                          </button>
                          {selectedIds.size > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {selectedIds.size} selected
                            </span>
                          )}
                        </div>

                        {/* Bulk action bar */}
                        {selectedIds.size > 0 && (
                          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-muted/40">
                            <span className="text-xs font-medium text-foreground">
                              {selectedIds.size} selected
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs gap-1"
                              onClick={handleBulkPublish}
                              disabled={isBulkPublishing || isBulkDeleting}
                            >
                              {isBulkPublishing
                                ? <RefreshCw className="h-3 w-3 animate-spin" />
                                : <><Send className="h-3 w-3" />Publish drafts</>}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2.5 text-xs gap-1 text-destructive hover:bg-destructive/10 border-destructive/30"
                              onClick={handleBulkDelete}
                              disabled={isBulkDeleting || isBulkPublishing}
                            >
                              {isBulkDeleting
                                ? <RefreshCw className="h-3 w-3 animate-spin" />
                                : <><Trash2 className="h-3 w-3" />Delete</>}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2.5 text-xs ml-auto"
                              onClick={clearSelection}
                            >
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
                              onDuplicate={handleDuplicate}
                              isSelected={selectedIds.has(post.id)}
                              onToggleSelect={toggleSelect}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
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
