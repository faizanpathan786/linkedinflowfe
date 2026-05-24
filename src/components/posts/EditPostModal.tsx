import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import api, { postsAPI, type Post } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import {
  Calendar,
  Clock,
  RefreshCw,
  Save,
  AlertCircle,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  Play,
  Upload,
  RotateCcw,
  X,
} from 'lucide-react';

// ── Schema ────────────────────────────────────────────────────────────────────

const editSchema = z.object({
  content: z.string().min(1, 'Content is required').max(3000, 'Max 3000 characters'),
  link_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  video_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type EditFormData = z.infer<typeof editSchema>;

// ── Datetime helpers ──────────────────────────────────────────────────────────

/** ISO string → "YYYY-MM-DDTHH:MM" in local time (what datetime-local expects) */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** Minimum selectable datetime = 1 minute from now, in local time */
function localMin(): string {
  const d = new Date(Date.now() + 60_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

// ── Diff helper — only include fields that actually changed ───────────────────

type UpdatePayload = Parameters<typeof postsAPI.updatePost>[1];

function buildPayload(
  data: EditFormData,
  post: Post,
  saveMode: 'draft' | 'scheduled',
  scheduledAt: string,
): UpdatePayload {
  const payload: UpdatePayload = {};

  // content
  const trimmed = data.content.trim();
  if (trimmed !== post.content) payload.content = trimmed;

  // link_url
  const newLink = data.link_url?.trim() || null;
  const oldLink = post.link_url || null;
  if (newLink !== oldLink) payload.link_url = newLink;

  // post_type — derived from link_url only for text/link posts; preserve media posts.
  if (post.post_type !== 'image' && post.post_type !== 'video') {
    const newType = newLink ? 'link' : 'text';
    if (newType !== post.post_type) payload.post_type = newType;
  }

  // scheduled_at
  if (saveMode === 'scheduled') {
    const newIso = new Date(scheduledAt).toISOString();
    // Always include when: post was a draft (new schedule) OR the time changed
    if (post.status === 'draft' || newIso !== post.scheduled_at) {
      payload.scheduled_at = newIso;
    }
  } else {
    // Save as draft: clear the schedule if one exists
    if (post.scheduled_at) payload.scheduled_at = null;
  }

  return payload;
}

// ── Post-type badge ───────────────────────────────────────────────────────────

function PostTypeBadge({ type }: { type: Post['post_type'] }) {
  const map = {
    text: { icon: FileText, label: 'Text', cls: 'bg-muted text-muted-foreground border-border' },
    link: { icon: LinkIcon, label: 'Link', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' },
    image: { icon: ImageIcon, label: 'Image', cls: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800' },
    video: { icon: Play, label: 'Video', cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' },
  } as const;
  const { icon: Icon, label, cls } = map[type] ?? map.text;
  return (
    <Badge variant="outline" className={cn('gap-1 text-[11px]', cls)}>
      <Icon className="h-3 w-3" />
      {label} post
    </Badge>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface EditPostModalProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: Post, newImageUrl?: string, newVideoUrl?: string) => void;
}

export function EditPostModal({ post, open, onOpenChange, onSaved }: EditPostModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<'draft' | 'scheduled'>('draft');
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduleErr, setScheduleErr] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);  // new file preview
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null); // fetched blob URL
  const previewUrlRef = useRef<string | null>(null);
  const existingImageUrlRef = useRef<string | null>(null);
  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const videoObjectUrlRef = useRef<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditFormData>({ resolver: zodResolver(editSchema) });

  const content = watch('content') ?? '';
  const linkUrl = watch('link_url') ?? '';

  const { getRootProps: getVideoRootProps, isDragActive: isVideoDragActive } = useDropzone({
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] },
    maxFiles: 1,
    maxSize: 200 * 1024 * 1024,
    noClick: true, // we trigger via button/ref
    onDrop: (accepted, rejected) => {
      if (rejected.length > 0) { toast.error('Use an .mp4, .mov, .avi, .webm or .mkv file under 200 MB.'); return; }
      const file = accepted[0];
      if (!file) return;
      if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
      const url = URL.createObjectURL(file);
      videoObjectUrlRef.current = url;
      setVideoFile(file);
      setVideoObjectUrl(url);
      setValue('video_url', '');
    },
  });

  // Derive the live post_type so the badge updates as the user types
  const livePostType: Post['post_type'] =
    post?.post_type === 'image'
      ? 'image'
      : post?.post_type === 'video'
        ? 'video'
        : linkUrl.trim()
          ? 'link'
          : 'text';

  // Populate form when post changes
  useEffect(() => {
    if (!post) return;
    reset({ content: post.content, link_url: post.link_url ?? '', video_url: post.video_url ?? '' });

    if (post.status === 'scheduled' && post.scheduled_at) {
      setSaveMode('scheduled');
      setScheduledAt(toLocalInput(post.scheduled_at));
    } else {
      setSaveMode('draft');
      setScheduledAt('');
    }
    setScheduleErr('');

    // Reset image state
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (existingImageUrlRef.current) {
      URL.revokeObjectURL(existingImageUrlRef.current);
      existingImageUrlRef.current = null;
    }
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);

    // Fetch existing image with auth headers so the <img> can display it
    if (post.post_type === 'image') {
      if (post.image_url?.startsWith('data:') || post.image_url?.startsWith('http')) {
        setExistingImageUrl(post.image_url);
      } else {
        api.get(`/posts/${post.id}/image`, { responseType: 'blob' })
          .then((res) => {
            const url = URL.createObjectURL(res.data as Blob);
            existingImageUrlRef.current = url;
            setExistingImageUrl(url);
          })
          .catch(() => {}); // silently fail — fallback shows "Image unavailable"
      }
    }

    // Reset video state
    if (videoObjectUrlRef.current) {
      URL.revokeObjectURL(videoObjectUrlRef.current);
      videoObjectUrlRef.current = null;
    }
    setVideoFile(null);
    setVideoObjectUrl(null);
  }, [post, reset]);

  const handleClose = () => { if (!isSaving) onOpenChange(false); };

  const onSubmit = async (data: EditFormData) => {
    if (!post) return;

    // Validate schedule time
    if (saveMode === 'scheduled') {
      if (!scheduledAt) { setScheduleErr('Please pick a date and time.'); return; }
      if (new Date(scheduledAt) <= new Date()) {
        setScheduleErr('Scheduled time must be in the future.'); return;
      }
    }
    setScheduleErr('');

    // Build minimal diff payload
    const payload = buildPayload(data, post, saveMode, scheduledAt);

    // Include video_url change in payload
    const newVideoUrl = (data as any).video_url?.trim() || null;
    const oldVideoUrl = post.video_url || null;
    if (!videoFile && newVideoUrl !== oldVideoUrl) payload.video_url = newVideoUrl;

    if (Object.keys(payload).length === 0 && !imageFile && !videoFile) {
      toast.info('No changes to save.');
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      const result = await postsAPI.updatePost(post.id, {
        ...payload,
        ...(imageFile ? { image_file: imageFile } : {}),
        ...(videoFile ? { video_file: videoFile } : {}),
      });
      // Create fresh blob URLs so the preview shows the new media instantly
      const newImageUrl = imageFile ? URL.createObjectURL(imageFile) : undefined;
      const newVideoUrl = videoFile ? URL.createObjectURL(videoFile) : undefined;
      onSaved(result.post, newImageUrl, newVideoUrl);
      toast.success(
        saveMode === 'scheduled'
          ? `Post rescheduled for ${new Date(scheduledAt).toLocaleString()}`
          : payload.scheduled_at === null
            ? 'Schedule cleared — post saved as draft.'
            : 'Post saved.',
      );
      onOpenChange(false);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || 'Failed to save changes.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (!post) return null;

  const isScheduled = post.status === 'scheduled';
  const isImagePost = post.post_type === 'image';
  const isVideoPost = post.post_type === 'video';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="icon-container-sm">
              {isScheduled ? <Calendar className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            </div>
            Edit {isScheduled ? 'Scheduled' : 'Draft'} Post
          </DialogTitle>
          <DialogDescription>
            Only changed fields are sent. The post will{' '}
            {saveMode === 'scheduled' ? 'publish at the scheduled time' : 'remain as a draft'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-1 space-y-3">

          {/* ── Current schedule banner ── */}
          {isScheduled && post.scheduled_at && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-3 py-2.5 text-sm">
              <Calendar className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300">
                Scheduled for{' '}
                <span className="font-semibold">
                  {new Date(post.scheduled_at).toLocaleString()}
                </span>
              </span>
            </div>
          )}

          {/* ── Content ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="ep-content">
                Content <span className="text-destructive">*</span>
              </Label>
              {/* Live post-type badge */}
              <PostTypeBadge type={livePostType} />
            </div>
            <Textarea
              id="ep-content"
              placeholder="What's happening in your professional world?"
              className="min-h-24 resize-none"
              {...register('content')}
            />
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-xs',
                content.length > 2900 ? 'text-destructive' :
                  content.length > 2800 ? 'text-amber-600 dark:text-amber-400' :
                    'text-muted-foreground',
              )}>
                {content.length} / 3000
              </span>
              {errors.content && (
                <span className="text-xs text-destructive">{errors.content.message}</span>
              )}
            </div>
          </div>

          {/* ── Link URL (only for text/link posts) ── */}
          {!isImagePost && !isVideoPost && (
            <div className="space-y-1.5">
              <Label htmlFor="ep-link">Link URL (optional)</Label>
              <Input
                id="ep-link"
                type="url"
                placeholder="https://example.com/article"
                {...register('link_url')}
              />
              {errors.link_url && (
                <p className="text-xs text-destructive">{errors.link_url.message}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Adding a URL changes the post type to <strong>Link</strong>. Removing it reverts to <strong>Text</strong>.
              </p>
            </div>
          )}

          {/* ── Image editor ── */}
          {isImagePost && (
            <div className="space-y-2">
              <Label>Image</Label>

              {/* Preview */}
              <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30">
                {(imagePreview ?? existingImageUrl) ? (
                  <img
                    src={imagePreview ?? existingImageUrl!}
                    alt="Post image"
                    className="w-full max-h-44 object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs">Loading image…</span>
                  </div>
                )}
                {imagePreview && (
                  <span className="absolute top-2 left-2 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                    New
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => document.getElementById('ep-image-input')?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {imagePreview ? 'Change image' : 'Replace image'}
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground"
                    onClick={() => {
                      if (previewUrlRef.current) {
                        URL.revokeObjectURL(previewUrlRef.current);
                        previewUrlRef.current = null;
                      }
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Undo
                  </Button>
                )}
              </div>

              <input
                id="ep-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
                  const url = URL.createObjectURL(file);
                  previewUrlRef.current = url;
                  setImageFile(file);
                  setImagePreview(url);
                  e.target.value = '';
                }}
              />
              <p className="text-[11px] text-muted-foreground">Supported: JPG, PNG, GIF, WebP</p>
            </div>
          )}

          {/* ── Video editor ── */}
          {post.post_type === 'video' && (
            <div className="space-y-2">
              <Label>Video</Label>

              {/* Current video preview */}
              {(videoObjectUrl || post.video_url) && (
                <div
                  {...getVideoRootProps()}
                  className={cn(
                    'relative rounded-lg overflow-hidden border border-border bg-muted/30 transition-colors',
                    isVideoDragActive && 'border-primary bg-primary/5'
                  )}
                >
                  <video
                    src={videoObjectUrl ?? post.video_url ?? undefined}
                    controls
                    className="w-full max-h-44 object-contain"
                    preload="metadata"
                  />
                  {videoFile && (
                    <span className="absolute top-2 left-2 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                      New
                    </span>
                  )}
                  {isVideoDragActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                      <p className="text-sm font-medium text-primary">Drop video here</p>
                    </div>
                  )}
                </div>
              )}

              {videoFile && (
                <p className="text-xs text-muted-foreground truncate">
                  {videoFile.name} · {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              )}

              {/* Hidden file input */}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/avi,video/webm,video/x-matroska"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
                  const url = URL.createObjectURL(file);
                  videoObjectUrlRef.current = url;
                  setVideoFile(file);
                  setVideoObjectUrl(url);
                  setValue('video_url', '');
                  e.target.value = '';
                }}
              />

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {videoFile ? 'Change file' : 'Replace with file'}
                </Button>
                {videoFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground"
                    onClick={() => {
                      if (videoObjectUrlRef.current) {
                        URL.revokeObjectURL(videoObjectUrlRef.current);
                        videoObjectUrlRef.current = null;
                      }
                      setVideoFile(null);
                      setVideoObjectUrl(null);
                      setValue('video_url', post.video_url ?? '');
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Undo
                  </Button>
                )}
              </div>

              {/* URL field */}
              <div className="space-y-1.5">
                <Label htmlFor="ep-video-url" className="text-xs text-muted-foreground">
                  Or replace with a public video URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="ep-video-url"
                    type="url"
                    placeholder="https://example.com/video.mp4"
                    {...register('video_url')}
                    onChange={(e) => {
                      register('video_url').onChange(e);
                      if (e.target.value && videoFile) {
                        if (videoObjectUrlRef.current) URL.revokeObjectURL(videoObjectUrlRef.current);
                        videoObjectUrlRef.current = null;
                        setVideoFile(null);
                        setVideoObjectUrl(null);
                      }
                    }}
                    className="flex-1"
                  />
                  {watch('video_url') && watch('video_url') !== post.video_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2 shrink-0"
                      onClick={() => setValue('video_url', post.video_url ?? '')}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {errors.video_url && (
                  <p className="text-xs text-destructive">{errors.video_url.message}</p>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground">
                Drag a file onto the preview, click "Replace with file", or enter a URL. MP4, MOV, AVI, WebM up to 200 MB.
              </p>
            </div>
          )}

          {/* ── Save as: Draft / Schedule ── */}
          <div className="space-y-1.5">
            <Label>Save as</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { mode: 'draft', icon: Clock, label: 'Draft' },
                  { mode: 'scheduled', icon: Calendar, label: 'Schedule' },
                ] as const
              ).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setSaveMode(mode); setScheduleErr(''); }}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                    saveMode === mode
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Datetime picker */}
            {saveMode === 'scheduled' && (
              <div className="space-y-1.5 pt-1">
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  min={localMin()}
                  onChange={(e) => { setScheduledAt(e.target.value); setScheduleErr(''); }}
                  className="text-sm"
                />
                {scheduleErr && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {scheduleErr}
                  </div>
                )}
              </div>
            )}

            {/* Clear-schedule explanation */}
            {saveMode === 'draft' && isScheduled && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Saving as Draft will clear the existing schedule and set status back to draft.
              </p>
            )}
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? (
                <><RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving…</>
              ) : (
                <><Save className="mr-1.5 h-3.5 w-3.5" />
                  {saveMode === 'scheduled' ? 'Save & reschedule' : 'Save as draft'}
                </>
              )}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
