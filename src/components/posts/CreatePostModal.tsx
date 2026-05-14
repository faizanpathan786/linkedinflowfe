import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LinkedInPreview } from '@/components/posts/LinkedInPreview';
import { postsAPI } from '@/lib/api';
import { useLinkedInStore } from '@/store/useLinkedInStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Clock,
  Calendar,
  Send,
  RefreshCw,
  AlertCircle,
  X,
} from 'lucide-react';

type PostType = 'text' | 'image' | 'link';
type SaveMode  = 'draft' | 'schedule' | 'now';

const POST_TYPES: { id: PostType; label: string; icon: React.ElementType }[] = [
  { id: 'text',  label: 'Text',  icon: FileText  },
  { id: 'image', label: 'Image', icon: ImageIcon },
  { id: 'link',  label: 'Link',  icon: LinkIcon  },
];

/** "YYYY-MM-DDTHH:MM" for datetime-local min (1 min from now) */
function localMin(): string {
  const d = new Date(Date.now() + 60_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

interface CreatePostModalProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const { addPost, linkedInStatus } = useLinkedInStore();
  const { user } = useAuthStore();
  const liProfile = linkedInStatus?.data?.profile as Record<string, string> | undefined;
  const previewName = liProfile?.firstName
    ? [liProfile.firstName, liProfile.lastName].filter(Boolean).join(' ')
    : user?.name || 'Your Name';
  const previewHeadline = liProfile?.headline || liProfile?.localizedHeadline || 'LinkedIn Member';
  const previewAvatar = liProfile?.pictureUrl || undefined;

  const [postType,     setPostType]     = useState<PostType>('text');
  const [content,      setContent]      = useState('');
  const [linkUrl,      setLinkUrl]      = useState('');
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saveMode,     setSaveMode]     = useState<SaveMode>('draft');
  const [scheduledAt,  setScheduledAt]  = useState('');
  const [scheduleErr,  setScheduleErr]  = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPostType('text');
    setContent('');
    setLinkUrl('');
    setImageFile(null);
    setImagePreview('');
    setSaveMode('draft');
    setScheduledAt('');
    setScheduleErr('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onOpenChange(false);
  };

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!content.trim()) { toast.error('Content is required.'); return; }
    if (postType === 'image' && !imageFile) { toast.error('Please upload an image.'); return; }
    if (postType === 'link' && !linkUrl.trim()) { toast.error('Please enter a link URL.'); return; }

    if (saveMode === 'schedule') {
      if (!scheduledAt) { setScheduleErr('Pick a date and time.'); return; }
      if (new Date(scheduledAt) <= new Date()) { setScheduleErr('Must be in the future.'); return; }
    }
    setScheduleErr('');

    setIsSubmitting(true);
    try {
      const result = await postsAPI.createPost({
        content:      content.trim(),
        post_type:    postType,
        link_url:     postType === 'link' ? linkUrl.trim() || undefined : undefined,
        image_file:   postType === 'image' ? imageFile || undefined : undefined,
        publish_now:  saveMode === 'now',
        scheduled_at: saveMode === 'schedule' ? new Date(scheduledAt).toISOString() : undefined,
      });

      addPost(result.post);

      if (saveMode === 'now')      toast.success('Post published to LinkedIn!');
      else if (saveMode === 'schedule') toast.success(`Scheduled for ${new Date(scheduledAt).toLocaleString()}`);
      else                         toast.success('Saved as draft.');

      handleClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to create post.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount    = content.length;
  const charOverLimit = charCount > 3000;
  const previewLinkUrl = postType === 'link' ? linkUrl : undefined;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="p-0 overflow-hidden"
        style={{ maxWidth: 'min(92vw, 860px)', width: '860px' }}
      >
        <div className="flex h-[min(90vh,680px)]">

          {/* ── Left: form ──────────────────────────────────────── */}
          <div className="flex flex-col w-full lg:w-[420px] shrink-0 border-r border-border overflow-y-auto custom-scrollbar">

            <DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <div className="icon-container-sm">
                  <Send className="h-3.5 w-3.5" />
                </div>
                New Post
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 px-5 py-4 space-y-4">

              {/* Post type selector */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">Type</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {POST_TYPES.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setPostType(id); setImageFile(null); setImagePreview(''); setLinkUrl(''); }}
                      className={cn(
                        'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                        postType === id
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <Label htmlFor="cp-content" className="text-xs font-medium">
                  Content <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="cp-content"
                  placeholder="What's happening in your professional world?&#10;&#10;Use #hashtags and @mentions to boost reach."
                  className="min-h-[140px] resize-none text-sm"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
                <div className="flex items-center justify-end">
                  <span className={cn(
                    'text-[11px]',
                    charOverLimit       ? 'text-destructive font-medium' :
                    charCount > 2800    ? 'text-amber-600 dark:text-amber-400' :
                    'text-muted-foreground',
                  )}>
                    {charCount} / 3000
                  </span>
                </div>
              </div>

              {/* Link URL */}
              {postType === 'link' && (
                <div className="space-y-1.5">
                  <Label htmlFor="cp-link" className="text-xs font-medium">Link URL</Label>
                  <Input
                    id="cp-link"
                    type="url"
                    placeholder="https://example.com/article"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    className="text-sm"
                  />
                </div>
              )}

              {/* Image upload */}
              {postType === 'image' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Image</Label>
                  {imagePreview ? (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img src={imagePreview} alt="Preview" className="w-full max-h-36 object-cover" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(''); }}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-lg border-2 border-dashed border-border bg-muted/30 py-5 text-center hover:border-primary/50 hover:bg-primary/3 transition-all duration-150"
                    >
                      <ImageIcon className="mx-auto h-6 w-6 text-muted-foreground/60 mb-1.5" />
                      <p className="text-xs text-muted-foreground">Click to select an image</p>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleImageSelect(f);
                    }}
                  />
                </div>
              )}

              {/* Publish mode */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Publish</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { id: 'draft',    label: 'Draft',    icon: Clock    },
                    { id: 'schedule', label: 'Schedule', icon: Calendar },
                    { id: 'now',      label: 'Publish',  icon: Send     },
                  ] as { id: SaveMode; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { setSaveMode(id); setScheduleErr(''); }}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-all duration-150',
                        saveMode === id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {saveMode === 'schedule' && (
                  <div className="space-y-1">
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      min={localMin()}
                      onChange={e => { setScheduledAt(e.target.value); setScheduleErr(''); }}
                      className="text-sm"
                    />
                    {scheduleErr && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3 shrink-0" />{scheduleErr}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="px-5 py-4 border-t border-border shrink-0">
              <Button
                className="w-full"
                size="sm"
                disabled={isSubmitting || !content.trim() || charOverLimit || (postType === 'image' && !imageFile) || (postType === 'link' && !linkUrl.trim())}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <><RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    {saveMode === 'now' ? 'Publishing…' : saveMode === 'schedule' ? 'Scheduling…' : 'Saving…'}
                  </>
                ) : saveMode === 'now'      ? <><Send className="mr-1.5 h-3.5 w-3.5" />Publish now</>
                  : saveMode === 'schedule' ? <><Calendar className="mr-1.5 h-3.5 w-3.5" />Schedule post</>
                  :                           <><Clock className="mr-1.5 h-3.5 w-3.5" />Save as draft</>
                }
              </Button>
            </div>
          </div>

          {/* ── Right: live preview ─────────────────────────────── */}
          <div className="hidden lg:flex flex-1 flex-col bg-muted/30 overflow-y-auto custom-scrollbar">
            <div className="p-5 pb-2 shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">LinkedIn Preview</p>
            </div>
            <div className="px-5 pb-5">
              <LinkedInPreview
                content={content || 'Your post content will appear here…'}
                linkUrl={previewLinkUrl}
                postType={postType}
                imagePreviewUrl={imagePreview || undefined}
                authorName={previewName}
                authorHeadline={previewHeadline}
                authorAvatar={previewAvatar}
              />
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
