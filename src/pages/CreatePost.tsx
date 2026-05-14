import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Image as ImageIcon,
  Send,
  Eye,
  X,
  Clock,
  Sparkles,
  Zap,
  CheckCircle,
  AlertCircle,
  Calendar,
  Link as LinkIcon,
  Video,
  FileText,
  ListOrdered,
  BookMarked,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useLinkedInStore } from '@/store/useLinkedInStore';
import { useAuthStore } from '@/store/useAuthStore';
import { postsAPI } from '@/lib/api';
import { format } from 'date-fns';
import { loadQueueSettings, getNextQueueSlot } from '@/lib/queue';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LinkedInPreview } from '@/components/posts/LinkedInPreview';
import { loadTemplates, deleteTemplate, type PostTemplate } from '@/lib/templates';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PostAnalyzer } from '@/components/posts/PostAnalyzer';
import { PageTransition } from '@/components/ui/magic/page-transition';
import { ImportModal } from '@/components/posts/ImportModal';

const postSchema = z.object({
  content: z.string().min(1, 'Content is required').max(3000, 'Content must be under 3000 characters'),
  link_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  video_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  publish_now: z.boolean().default(false),
  schedule: z.boolean().default(false),
  useAI: z.boolean().default(false),
});

type PostFormData = z.infer<typeof postSchema>;

const AI_SUGGESTIONS = [
  '🚀 Excited to share our latest innovation in the LinkedIn automation space! The future of professional networking is here.',
  '💡 Just finished an amazing project combining AI and social media automation. Can\'t wait to see the impact!',
  '🎯 Consistency in LinkedIn posting can increase your reach by up to 300%. Here\'s how we\'re making it easier...',
];

type MediaType = 'text' | 'image' | 'link' | 'video';

const mediaTypes: { type: MediaType; icon: React.ElementType; label: string }[] = [
  { type: 'text', icon: FileText, label: 'Text' },
  { type: 'image', icon: ImageIcon, label: 'Image' },
  { type: 'link', icon: LinkIcon, label: 'Link' },
  { type: 'video', icon: Video, label: 'Video' },
];

export function CreatePost() {
  const [searchParams] = useSearchParams();
  const scheduledDateParam = searchParams.get('scheduled_date');
  const prefillApplied = useRef(false);

  const DRAFT_KEY = 'linkedinflow_draft_post';
  const [draftSaved, setDraftSaved] = useState(false);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string>(
    scheduledDateParam ? `${scheduledDateParam}T12:00` : ''
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('text');
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const { addPost, linkedInStatus, posts } = useLinkedInStore();
  const { user } = useAuthStore();
  const isLinkedInConnected = Boolean(linkedInStatus?.isConnected && !linkedInStatus?.isExpired);
  const liProfile = linkedInStatus?.data?.profile as Record<string, string> | undefined;
  const previewName = liProfile?.firstName
    ? [liProfile.firstName, liProfile.lastName].filter(Boolean).join(' ')
    : user?.name || 'Your Name';
  const previewHeadline = liProfile?.headline || liProfile?.localizedHeadline || 'LinkedIn Member';
  const previewAvatar = liProfile?.pictureUrl || undefined;
  const navigate = useNavigate();

  const queueSettings = useMemo(() => loadQueueSettings(), []);
  const nextQueueSlot = useMemo(
    () => getNextQueueSlot(queueSettings, posts),
    [queueSettings, posts]
  );
  const [useQueue, setUseQueue] = useState(false);

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [templates, setTemplates] = useState<PostTemplate[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);

  const openTemplates = () => {
    setTemplates(loadTemplates());
    setTemplatesOpen(true);
  };

  const applyTemplate = (tpl: PostTemplate) => {
    setValue('content', tpl.content);
    setMediaType(tpl.post_type as MediaType);
    setTemplatesOpen(false);
    toast.success('Template applied.');
  };

  const removeTemplate = (id: string) => {
    deleteTemplate(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
  };


  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue, reset } =
    useForm<PostFormData>({
      resolver: zodResolver(postSchema),
      defaultValues: {
        publish_now: false,
        useAI: false,
        schedule: scheduledDateParam ? true : false,
        content: '',
      },
    });

  const content = watch('content');
  const useAI = watch('useAI');
  const publishNow = watch('publish_now');
  const schedule = watch('schedule');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
    maxFiles: 1,
    onDrop: (files) => {
      const file = files[0];
      if (!file) return;
      clearVideo();
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    },
  });

  const clearVideo = () => {
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    setUploadedVideo(null);
    setVideoObjectUrl(null);
  };

  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
  } = useDropzone({
    accept: { 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] },
    maxFiles: 1,
    maxSize: 200 * 1024 * 1024, // 200 MB
    onDrop: (accepted, rejected) => {
      if (rejected.length > 0) {
        toast.error('File rejected. Use an .mp4, .mov, .avi, .webm or .mkv file under 200 MB.');
        return;
      }
      const file = accepted[0];
      if (!file) return;
      setUploadedImage(null);
      setImagePreview(null);
      if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
      const url = URL.createObjectURL(file);
      setUploadedVideo(file);
      setVideoObjectUrl(url);
    },
  });

  // Check for saved draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.content && parsed.content.length > 0) {
          setShowRestoreBanner(true);
        }
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  // Apply prefilled content from AI interview (runs once, safe with Strict Mode double-invoke)
  useEffect(() => {
    if (prefillApplied.current) return;
    if (searchParams.get('from') === 'interview') {
      const stored = sessionStorage.getItem('linkedinflow_composer_prefill');
      if (stored) {
        prefillApplied.current = true;
        sessionStorage.removeItem('linkedinflow_composer_prefill');
        setValue('content', stored);
      }
    } else {
      const prefill = searchParams.get('prefill');
      if (prefill) {
        prefillApplied.current = true;
        try { setValue('content', decodeURIComponent(prefill)); }
        catch { setValue('content', prefill); }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-save draft
  useEffect(() => {
    if (!content || content.length === 0) return;

    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);

    draftSaveTimer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, mediaType, savedAt: new Date().toISOString() }));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }, 1500);

    return () => {
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    };
  }, [content, mediaType]);

  const restoreDraft = () => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.content) setValue('content', parsed.content);
      if (parsed.mediaType) setMediaType(parsed.mediaType);
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
    setShowRestoreBanner(false);
  };

  const dismissDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowRestoreBanner(false);
  };

  const onSubmit = async (data: PostFormData) => {
    if (data.schedule && !scheduledAt) {
      toast.error('Please pick a date and time to schedule the post.');
      return;
    }
    if (data.schedule && new Date(scheduledAt) <= new Date()) {
      toast.error('Scheduled time must be in the future.');
      return;
    }
    if (mediaType === 'video' && !uploadedVideo && !data.video_url) {
      toast.error('Upload a video file or enter a public video URL.');
      return;
    }
    if (mediaType === 'image' && !uploadedImage) {
      toast.error('Please upload an image file.');
      return;
    }

    try {
      const response = await postsAPI.createPost({
        content: data.content.trim(),
        post_type: mediaType,
        link_url: mediaType === 'link' ? (data.link_url || undefined) : undefined,
        video_url: mediaType === 'video' && !uploadedVideo ? (data.video_url || undefined) : undefined,
        image_file: mediaType === 'image' ? (uploadedImage || undefined) : undefined,
        video_file: mediaType === 'video' && uploadedVideo ? uploadedVideo : undefined,
        publish_now: data.schedule ? false : data.publish_now,
        scheduled_at: data.schedule ? new Date(scheduledAt).toISOString() : undefined,
      });

      addPost(response.post);

      if (data.schedule) {
        toast.success(`Post scheduled for ${new Date(scheduledAt).toLocaleString()}`);
      } else if (data.publish_now) {
        toast.success('Post published to LinkedIn!');
        if (response.post?.linkedin_post_id) {
          setPublishedPostId(response.post.linkedin_post_id);
        }
      } else {
        toast.success('Post saved as draft.');
      }

      reset();
      localStorage.removeItem(DRAFT_KEY);
      setUploadedImage(null);
      setImagePreview(null);
      setScheduledAt('');
      setMediaType('text');
      setUseQueue(false);
      clearVideo();
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to create post';
      toast.error(msg);
    }
  };

  const charCount = content?.length || 0;
  const charWarning = charCount > 2800;
  const charDanger = charCount > 2900;

  const linkUrl = watch('link_url');
  const videoUrl = watch('video_url');

  return (
    <PageTransition>
      <div className="flex flex-col lg:h-full lg:overflow-hidden animate-fade-in gap-3">

        {/* Published banner */}
        {publishedPostId && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium text-green-800">Post published to LinkedIn!</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.linkedin.com/feed/update/${publishedPostId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-[#0a66c2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#004182] transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on LinkedIn
              </a>
              <button
                type="button"
                onClick={() => setPublishedPostId(null)}
                className="text-green-600 hover:text-green-800 text-lg leading-none px-1"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="flex items-center justify-end gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {showRestoreBanner && (
              <div className="flex items-center gap-2 rounded-lg border border-[#dce6f1] bg-[#eef3f8] px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 text-[#0a66c2] shrink-0" />
                <span className="text-[11px] font-medium text-[#0a66c2]">Unsaved draft</span>
                <button type="button" className="text-[11px] font-semibold text-[#0a66c2] hover:underline" onClick={restoreDraft}>Restore</button>
                <button type="button" className="text-[11px] text-[#595959] hover:text-[#191919]" onClick={dismissDraft}>✕</button>
              </div>
            )}
            <div className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold',
              isLinkedInConnected
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            )}>
              {isLinkedInConnected
                ? <><CheckCircle className="h-3 w-3" />LinkedIn connected</>
                : <><AlertCircle className="h-3 w-3" />Not connected</>}
            </div>
            {!isLinkedInConnected && (
              <Button size="sm" onClick={() => navigate('/dashboard/linkedin-vault')}
                className="h-7 text-xs !bg-[#0a66c2] !text-white hover:!bg-[#004182]">
                Connect
              </Button>
            )}
          </div>
        </div>

        {/* Post Analyzer */}
        {import.meta.env.VITE_POST_ANALYZER_ENABLED === 'true' && content && content.length >= 10 && (
          <div className="shrink-0 rounded-xl border border-[#e0dfdc] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <PostAnalyzer
              content={content}
              postType={mediaType}
              onTimeSelected={(hour, _day) => {
                const now = new Date();
                const targetDate = new Date(now);
                targetDate.setHours(hour, 0, 0, 0);
                if (targetDate <= now) targetDate.setDate(targetDate.getDate() + 1);
                setScheduledAt(targetDate.toISOString().slice(0, 16));
                setValue('schedule', true);
                setValue('publish_now', false);
              }}
            />
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-3 lg:flex-1 lg:overflow-hidden">

          {/* ── Left: Compose ── */}
          <div className="lg:overflow-y-auto">
            <div className="rounded-xl border border-[#e0dfdc] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">

              {/* Card header */}
              <div className="flex items-center justify-between border-b border-[#e0dfdc] bg-[#f8fafb] px-4 py-3">
                <p className="text-sm font-bold text-[#191919]">Compose</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setImportOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-[#dce6f1] bg-white px-2.5 py-1 text-[11px] font-medium text-black hover:bg-[#eef3f8] hover:text-[#0a66c2] transition-colors"
                  >
                    Import
                  </button>
                  <button
                    type="button"
                    onClick={openTemplates}
                    className="flex items-center gap-1.5 rounded-lg border border-[#dce6f1] bg-white px-2.5 py-1 text-[11px] font-medium text-black hover:bg-[#eef3f8] hover:text-[#0a66c2] transition-colors"
                  >
                    <BookMarked className="h-3 w-3" />
                    Templates
                  </button>
                  <div className="flex items-center gap-1.5 rounded-lg border border-[#dce6f1] bg-white px-2.5 py-1">
                    <Sparkles className="h-3 w-3 text-[#0a66c2]" />
                    <span className="text-[11px] font-medium text-[#595959]">AI</span>
                    <Switch
                      checked={useAI}
                      onCheckedChange={(v) => setValue('useAI', v)}
                      className="scale-75 -mr-1"
                    />
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">

                {/* AI generate button */}
                {useAI && (
                  <button
                    type="button"
                    onClick={() => {
                      setValue('content', AI_SUGGESTIONS[Math.floor(Math.random() * AI_SUGGESTIONS.length)]);
                      toast.success('AI content generated!');
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#dce6f1] bg-[#eef3f8] py-2 text-xs font-semibold text-[#0a66c2] hover:bg-[#dce6f1] transition-colors"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Generate AI suggestion
                  </button>
                )}

                {/* Textarea */}
                <div className="space-y-2">
                  <Textarea
                    id="content"
                    placeholder="What do you want to share with your network?"
                    className="min-h-[140px] resize-none text-sm border-[#dce6f1] bg-[#f8fafc] focus:border-[#0a66c2] focus:ring-[#0a66c2]/20 placeholder:text-[#a0a7af]"
                    {...register('content')}
                  />
                  <div className="flex items-center justify-between">
                    {errors.content
                      ? <p className="text-xs text-red-600">{errors.content.message}</p>
                      : <div className="flex items-center gap-1.5">
                          {draftSaved && <span className="text-[11px] text-green-600 font-medium">Auto-saved</span>}
                        </div>
                    }
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="w-20 h-1.5 rounded-full bg-[#e8eef5] overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', charDanger ? 'bg-red-500' : charWarning ? 'bg-amber-500' : 'bg-green-500')}
                          style={{ width: `${Math.min(100, (charCount / 3000) * 100)}%` }}
                        />
                      </div>
                      <span className={cn('text-[11px] font-medium tabular-nums', charDanger ? 'text-red-600' : charWarning ? 'text-amber-600' : 'text-[#595959]')}>
                        {charCount}/3000
                      </span>
                    </div>
                  </div>
                </div>

                {/* Media type pills */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#595959]">Post type</p>
                  <div className="flex gap-2">
                    {mediaTypes.map(({ type, icon: Icon, label }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setMediaType(type);
                          if (type !== 'image') { setUploadedImage(null); setImagePreview(null); }
                          if (type !== 'video') { clearVideo(); }
                        }}
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all',
                          mediaType === type
                            ? 'border-[#0a66c2] bg-[#eef3f8] text-black'
                            : 'border-[#dce6f1] bg-[#f8fafc] text-black hover:border-[#0a66c2]/40 hover:bg-[#f0f4f8]'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image upload */}
                {mediaType === 'image' && (
                  !uploadedImage ? (
                    <div
                      {...getRootProps()}
                      className={cn(
                        'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
                        isDragActive ? 'border-[#0a66c2] bg-[#eef3f8]' : 'border-[#dce6f1] bg-[#f8fafc] hover:border-[#0a66c2]/50 hover:bg-[#f0f4f8]'
                      )}
                    >
                      <input {...getInputProps()} />
                      <ImageIcon className="h-7 w-7 text-[#0a66c2] mx-auto mb-2 opacity-60" />
                      <p className="text-sm font-medium text-[#191919]">{isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}</p>
                      <p className="text-xs text-[#595959] mt-0.5">PNG, JPG, GIF up to 10 MB</p>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-[#dce6f1]">
                      <img src={imagePreview!} alt="Preview" className="w-full h-44 object-cover" />
                      <button
                        type="button"
                        onClick={() => { setUploadedImage(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white border border-[#dce6f1] flex items-center justify-center shadow-sm hover:bg-[#f3f2ee]"
                      >
                        <X className="h-3 w-3 text-[#595959]" />
                      </button>
                    </div>
                  )
                )}

                {/* Link URL */}
                {mediaType === 'link' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="link_url" className="text-xs font-semibold text-[#374151]">Link URL</Label>
                    <Input id="link_url" type="url" placeholder="https://example.com/article"
                      {...register('link_url')}
                      className="h-9 !border-[#dce6f1] !bg-[#f8fafc] !text-[#191919] focus:!border-[#0a66c2]"
                    />
                    {errors.link_url && <p className="text-xs text-red-600">{errors.link_url.message}</p>}
                  </div>
                )}

                {/* Video upload */}
                {mediaType === 'video' && (
                  <div className="space-y-3">
                    {!uploadedVideo ? (
                      <>
                        <div
                          {...getVideoRootProps()}
                          className={cn(
                            'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
                            isVideoDragActive ? 'border-[#0a66c2] bg-[#eef3f8]' : 'border-[#dce6f1] bg-[#f8fafc] hover:border-[#0a66c2]/50 hover:bg-[#f0f4f8]'
                          )}
                        >
                          <input {...getVideoInputProps()} />
                          <Video className="h-7 w-7 text-[#0a66c2] mx-auto mb-2 opacity-60" />
                          <p className="text-sm font-medium text-[#191919]">{isVideoDragActive ? 'Drop video here' : 'Drag & drop or click to upload'}</p>
                          <p className="text-xs text-[#595959] mt-0.5">MP4, MOV, AVI, WebM up to 200 MB</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="video_url" className="text-xs font-semibold text-[#374151]">Or enter a public video URL</Label>
                          <Input id="video_url" type="url" placeholder="https://example.com/video.mp4"
                            {...register('video_url')}
                            className="h-9 !border-[#dce6f1] !bg-[#f8fafc] !text-[#191919]"
                          />
                          {errors.video_url && <p className="text-xs text-red-600">{errors.video_url.message}</p>}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="relative rounded-xl overflow-hidden border border-[#dce6f1] bg-[#f8fafc]">
                          <video src={videoObjectUrl!} controls className="w-full max-h-48 object-contain" preload="metadata" />
                          <button type="button" onClick={clearVideo}
                            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white border border-[#dce6f1] flex items-center justify-center shadow-sm hover:bg-[#f3f2ee]">
                            <X className="h-3 w-3 text-[#595959]" />
                          </button>
                        </div>
                        <p className="text-xs text-[#595959] truncate">{uploadedVideo.name} · {(uploadedVideo.size / (1024 * 1024)).toFixed(1)} MB</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Publishing options */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#595959]">Publishing</p>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Publish now */}
                    <label className={cn(
                      'flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all',
                      publishNow && !useQueue ? 'border-[#0a66c2] bg-[#eef3f8]' : 'border-[#dce6f1] bg-[#f8fafc] hover:border-[#0a66c2]/40',
                      !isLinkedInConnected && 'opacity-50 cursor-not-allowed'
                    )}>
                      <input type="radio" checked={publishNow && !schedule && !useQueue}
                        onChange={() => { setValue('publish_now', true); setValue('schedule', false); setUseQueue(false); }}
                        disabled={!isLinkedInConnected} className="mt-0.5 h-3.5 w-3.5 accent-[#0a66c2]" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Send className="h-3 w-3 text-[#0a66c2] shrink-0" />
                          <p className="text-xs font-semibold text-[#191919]">Publish now</p>
                        </div>
                        <p className="text-[10px] text-[#595959]">Post immediately</p>
                      </div>
                    </label>

                    {/* Schedule */}
                    <label className={cn(
                      'flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all',
                      schedule && !useQueue ? 'border-[#0a66c2] bg-[#eef3f8]' : 'border-[#dce6f1] bg-[#f8fafc] hover:border-[#0a66c2]/40'
                    )}>
                      <input type="radio" checked={schedule && !useQueue}
                        onChange={() => { setValue('schedule', true); setValue('publish_now', false); setUseQueue(false); }}
                        className="mt-0.5 h-3.5 w-3.5 accent-[#0a66c2]" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Calendar className="h-3 w-3 text-[#0a66c2] shrink-0" />
                          <p className="text-xs font-semibold text-[#191919]">Schedule</p>
                        </div>
                        <p className="text-[10px] text-[#595959]">Pick date & time</p>
                      </div>
                    </label>

                    {/* Save draft */}
                    <label className={cn(
                      'flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all',
                      !publishNow && !schedule && !useQueue ? 'border-[#0a66c2] bg-[#eef3f8]' : 'border-[#dce6f1] bg-[#f8fafc] hover:border-[#0a66c2]/40'
                    )}>
                      <input type="radio" checked={!publishNow && !schedule && !useQueue}
                        onChange={() => { setValue('publish_now', false); setValue('schedule', false); setUseQueue(false); }}
                        className="mt-0.5 h-3.5 w-3.5 accent-[#0a66c2]" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Clock className="h-3 w-3 text-[#0a66c2] shrink-0" />
                          <p className="text-xs font-semibold text-[#191919]">Save draft</p>
                        </div>
                        <p className="text-[10px] text-[#595959]">Edit & publish later</p>
                      </div>
                    </label>

                    {/* Queue */}
                    {queueSettings.enabled && nextQueueSlot && (
                      <label className={cn(
                        'flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-all',
                        useQueue ? 'border-[#0a66c2] bg-[#eef3f8]' : 'border-[#dce6f1] bg-[#f8fafc] hover:border-[#0a66c2]/40'
                      )}>
                        <input type="radio" checked={useQueue}
                          onChange={() => {
                            if (nextQueueSlot) {
                              const local = new Date(nextQueueSlot.getTime() - nextQueueSlot.getTimezoneOffset() * 60000);
                              setScheduledAt(local.toISOString().slice(0, 16));
                              setValue('schedule', true);
                              setValue('publish_now', false);
                            }
                            setUseQueue(true);
                          }}
                          className="mt-0.5 h-3.5 w-3.5 accent-[#0a66c2]" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <ListOrdered className="h-3 w-3 text-[#0a66c2] shrink-0" />
                            <p className="text-xs font-semibold text-[#191919]">Add to queue</p>
                          </div>
                          <p className="text-[10px] text-[#595959] truncate">{format(nextQueueSlot, "EEE MMM d 'at' h:mm a")}</p>
                        </div>
                      </label>
                    )}
                  </div>

                  {/* Datetime picker */}
                  {schedule && (
                    <div className="space-y-1.5 pt-1">
                      <Label htmlFor="scheduledAt" className="text-xs font-semibold text-[#374151]">Date & time</Label>
                      <Input
                        id="scheduledAt"
                        type="datetime-local"
                        value={scheduledAt}
                        min={(() => {
                          const d = new Date(Date.now() + 60_000);
                          return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
                        })()}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="h-9 !border-[#dce6f1] !bg-[#f8fafc] !text-[#191919] text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 text-sm font-semibold !bg-[#0a66c2] !text-white hover:!bg-[#004182] !border-[#0a66c2]"
                >
                  {isSubmitting ? (
                    <><div className="mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</>
                  ) : useQueue ? (
                    <><ListOrdered className="mr-2 h-4 w-4" />Add to Queue</>
                  ) : schedule ? (
                    <><Calendar className="mr-2 h-4 w-4" />Schedule Post</>
                  ) : publishNow ? (
                    <><Send className="mr-2 h-4 w-4" />Publish Now</>
                  ) : (
                    <><Clock className="mr-2 h-4 w-4" />Save as Draft</>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* ── Right: Preview ── */}
          <div className="lg:overflow-y-auto space-y-3">
            <div className="rounded-xl border border-[#e0dfdc] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[#e0dfdc] bg-[#f8fafb] px-4 py-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#eef3f8] border border-[#dce6f1]">
                  <Eye className="h-3.5 w-3.5 text-[#0a66c2]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#191919]">Preview</p>
                  <p className="text-[10px] text-[#595959]">Live LinkedIn view</p>
                </div>
              </div>
              <div className="p-4">
                {content ? (
                  <LinkedInPreview
                    content={content}
                    linkUrl={mediaType === 'link' ? (linkUrl || undefined) : undefined}
                    postType={mediaType}
                    imagePreviewUrl={mediaType === 'image' ? (imagePreview || undefined) : undefined}
                    videoUrl={mediaType === 'video' ? (videoObjectUrl ?? videoUrl ?? undefined) : undefined}
                    authorName={previewName}
                    authorHeadline={previewHeadline}
                    authorAvatar={previewAvatar}
                  />
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-[#dce6f1] p-8 text-center bg-[#f8fafc]">
                    <Eye className="h-8 w-8 text-[#0a66c2] mx-auto mb-2 opacity-25" />
                    <p className="text-sm font-medium text-[#595959]">Start typing to preview</p>
                    <p className="text-[11px] text-[#a0a7af] mt-0.5">Your post will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Post stats */}
            {content && (
              <div className="rounded-xl border border-[#e0dfdc] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-4 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#595959]">Post stats</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-[#dce6f1] bg-[#f8fafc] p-3">
                    <p className="text-[10px] text-[#595959] mb-0.5">Characters</p>
                    <p className={cn('text-xl font-bold leading-none', charDanger ? 'text-red-600' : charWarning ? 'text-amber-600' : 'text-green-600')}>
                      {charCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#dce6f1] bg-[#f8fafc] p-3">
                    <p className="text-[10px] text-[#595959] mb-0.5">Remaining</p>
                    <p className="text-xl font-bold leading-none text-[#595959]">{3000 - charCount}</p>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-[#e8eef5] overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', charDanger ? 'bg-red-500' : charWarning ? 'bg-amber-500' : 'bg-green-500')}
                    style={{ width: `${Math.min(100, (charCount / 3000) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Templates dialog */}
      <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#191919]">Saved Templates</DialogTitle>
          </DialogHeader>
          {templates.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <BookMarked className="h-8 w-8 text-[#595959] mx-auto opacity-30" />
              <p className="text-sm text-[#595959]">No templates saved yet.</p>
              <p className="text-xs text-[#a0a7af]">Save any post as a template from the Posts page.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {templates.map(tpl => (
                <div key={tpl.id} className="rounded-xl border border-[#dce6f1] bg-[#f8fafc] p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-[#191919] line-clamp-1">{tpl.name}</p>
                    <button type="button" onClick={() => removeTemplate(tpl.id)}
                      className="shrink-0 text-[#595959] hover:text-red-600 transition-colors" aria-label="Delete template">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#595959] line-clamp-3 leading-relaxed">{tpl.content}</p>
                  <Button size="sm" variant="outline" className="w-full h-7 text-xs !border-[#dce6f1] hover:!bg-[#eef3f8]" onClick={() => applyTemplate(tpl)}>
                    Use template
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportDone={() => {}}
      />
    </PageTransition>
  );
}
