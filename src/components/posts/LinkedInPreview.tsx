import { useState } from 'react';
import { Globe, ThumbsUp, MessageSquare, Repeat2, Send, MoreHorizontal, Dot, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkedInPreviewProps {
  content: string;
  linkUrl?: string;
  postType?: 'text' | 'image' | 'link' | 'video';
  imagePreviewUrl?: string;
  videoUrl?: string;
  authorName?: string;
  authorHeadline?: string;
  authorAvatar?: string;
}

/** Colorize #hashtags and @mentions in post content */
function formatContent(text: string) {
  const parts = text.split(/(#\w+|@\w+)/g);
  return parts.map((part, i) => {
    if (/^#\w+/.test(part) || /^@\w+/.test(part)) {
      return (
        <span key={i} className="text-[#0a66c2] font-medium hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
}

/** Extract domain from a URL */
function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function LinkedInPreview({
  content,
  linkUrl,
  postType,
  imagePreviewUrl,
  videoUrl,
  authorName = 'Your Name',
  authorHeadline = 'LinkedIn Member',
  authorAvatar,
}: LinkedInPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  const TRUNCATE_AT = 220;
  const isTruncatable = content.length > TRUNCATE_AT;
  const displayContent = !expanded && isTruncatable
    ? content.slice(0, TRUNCATE_AT).trimEnd() + '…'
    : content;

  return (
    // Fixed light card — does NOT inherit app dark/light theme
    <div className="w-full rounded-xl border border-[#e0e0e0] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_2px_12px_rgba(0,0,0,0.1)] overflow-hidden font-[system-ui,-apple-system,'Segoe_UI',sans-serif]">

      {/* Author row */}
      <div className="flex items-start gap-3 px-4 pt-3 pb-2">
        {/* Avatar */}
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-12 h-12 rounded-full shrink-0 object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const fallback = img.nextElementSibling as HTMLElement | null;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0a66c2] to-[#0d8ecf] flex items-center justify-center text-white font-bold text-lg shrink-0 select-none"
          style={{ display: authorAvatar ? 'none' : 'flex' }}
        >
          {authorName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[#000000e6] font-semibold text-sm leading-tight hover:underline cursor-pointer">
              {authorName}
            </span>
            <span className="text-[#00000099] text-xs">• 1st</span>
          </div>
          <p className="text-[#00000099] text-xs leading-snug line-clamp-2 mt-0.5">{authorHeadline}</p>
          <div className="flex items-center gap-1 mt-0.5 text-[#00000099] text-xs">
            <span>Just now</span>
            <Dot className="h-2 w-2" />
            <Globe className="h-3 w-3" />
          </div>
        </div>

        <button className="text-[#00000066] hover:text-[#000000cc] hover:bg-[#0000000d] rounded-full p-1.5 transition-colors shrink-0">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-2">
        <p className="text-[#000000e6] text-sm leading-relaxed whitespace-pre-wrap break-words">
          {formatContent(displayContent)}
          {isTruncatable && !expanded && (
            <>
              {' '}
              <button
                className="text-[#000000cc] font-semibold hover:underline focus:outline-none"
                onClick={() => setExpanded(true)}
              >
                see more
              </button>
            </>
          )}
        </p>
      </div>

      {/* Image attachment */}
      {postType === 'image' && imagePreviewUrl && (
        <div className="mt-1 aspect-video bg-[#f3f2ef] overflow-hidden">
          <img src={imagePreviewUrl} alt="Post image" className="w-full h-full object-cover" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              const errorDiv = document.createElement('div');
              errorDiv.className = 'w-full h-full flex items-center justify-center bg-[#f3f2ef] text-[#00000066] text-sm';
              errorDiv.textContent = 'Image failed to load';
              parent.appendChild(errorDiv);
            }
          }} />
        </div>
      )}

      {/* Image placeholder when no URL yet */}
      {postType === 'image' && !imagePreviewUrl && (
        <div className="mt-1 aspect-video bg-[#f3f2ef] flex items-center justify-center text-[#00000066] text-sm">
          📷 Image attachment (URL not found)
        </div>
      )}

      {/* Video attachment */}
      {postType === 'video' && (
        <div className="mt-1 aspect-video bg-[#1b1b1b] overflow-hidden relative">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
              preload="metadata"
              onError={() => {
                const parent = (event?.target as HTMLVideoElement)?.parentElement;
                if (parent) {
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60 bg-[#1b1b1b]';
                  errorDiv.innerHTML = '<span class="text-xs">Video failed to load</span>';
                  parent.appendChild(errorDiv);
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
              <div className="h-12 w-12 rounded-full border-2 border-white/30 flex items-center justify-center">
                <Play className="h-5 w-5 fill-white/60 text-white/60 ml-0.5" />
              </div>
              <span className="text-xs">🎬 Video attachment (URL not found)</span>
            </div>
          )}
        </div>
      )}

      {/* Link preview card */}
      {(postType === 'link' || linkUrl) && linkUrl && (
        <div className="mt-1 border border-[#e0e0e0] mx-0 overflow-hidden">
          <div className="aspect-[1200/627] bg-gradient-to-br from-[#e8f0fe] to-[#d2e3fc] flex items-center justify-center">
            <Globe className="h-10 w-10 text-[#0a66c2] opacity-40" />
          </div>
          <div className="bg-[#f3f2ef] px-3 py-2">
            <p className="text-[#000000e6] text-sm font-semibold leading-snug line-clamp-1">
              {getDomain(linkUrl)}
            </p>
            <p className="text-[#00000099] text-xs mt-0.5">{getDomain(linkUrl)}</p>
          </div>
        </div>
      )}

      {/* Reaction counts */}
      {content.length > 0 && (
        <div className="flex items-center justify-between px-4 py-1.5 text-[#00000066] text-xs border-b border-[#e0e0e0]/60">
          <div className="flex items-center gap-1">
            <span className="flex -space-x-0.5">
              <span className="w-4 h-4 rounded-full bg-[#378fe9] flex items-center justify-center text-white text-[8px]">👍</span>
              <span className="w-4 h-4 rounded-full bg-[#df704d] flex items-center justify-center text-white text-[8px]">❤️</span>
            </span>
            <span>Be the first to react</span>
          </div>
          <span>0 comments</span>
        </div>
      )}

      {/* Engagement bar */}
      <div className="flex items-center px-2 py-0.5">
        {[
          { icon: ThumbsUp,      label: 'Like',    color: 'hover:text-[#0a66c2] hover:bg-[#0a66c2]/10' },
          { icon: MessageSquare, label: 'Comment', color: 'hover:text-[#0a66c2] hover:bg-[#0a66c2]/10' },
          { icon: Repeat2,       label: 'Repost',  color: 'hover:text-[#0a66c2] hover:bg-[#0a66c2]/10' },
          { icon: Send,          label: 'Send',    color: 'hover:text-[#0a66c2] hover:bg-[#0a66c2]/10' },
        ].map(({ icon: Icon, label, color }) => (
          <button
            key={label}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg',
              'text-[#00000099] text-xs font-semibold transition-colors duration-150',
              color,
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
