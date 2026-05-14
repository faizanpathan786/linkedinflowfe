import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { ideasAPI } from '@/lib/api';

export type IdeaTag = 'win' | 'lesson' | 'opinion' | 'thought' | 'update' | 'question';

export interface Idea {
  id: string;
  text: string;
  tag: IdeaTag;
  capturedAt: string;
}

interface TagOption {
  value: IdeaTag;
  emoji: string;
  label: string;
}

const TAG_OPTIONS: TagOption[] = [
  { value: 'win',      emoji: '🏆', label: 'Win'      },
  { value: 'lesson',   emoji: '💡', label: 'Lesson'   },
  { value: 'opinion',  emoji: '🎯', label: 'Opinion'  },
  { value: 'thought',  emoji: '⚡', label: 'Thought'  },
  { value: 'update',   emoji: '📢', label: 'Update'   },
  { value: 'question', emoji: '❓', label: 'Question' },
];

const DEFAULT_TAG: IdeaTag = 'thought';

export interface QuickCaptureModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (idea: Idea) => void;
}

export function QuickCaptureModal({ open, onOpenChange, onSaved }: QuickCaptureModalProps) {
  const { user: _user } = useAuthStore();
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState<IdeaTag>(DEFAULT_TAG);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      const res = await ideasAPI.create(trimmed, selectedTag);
      const newIdea: Idea = {
        id: res.data.id,
        text: res.data.text,
        tag: res.data.tag as IdeaTag,
        capturedAt: res.data.captured_at,
      };
      onSaved?.(newIdea);
      toast.success('Idea captured.');
      setText('');
      setSelectedTag(DEFAULT_TAG);
      onOpenChange?.(false);
    } catch {
      toast.error('Failed to save idea. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setText('');
    setSelectedTag(DEFAULT_TAG);
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Capture a thought
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-1">
          {/* Textarea */}
          <div className="flex flex-col gap-1.5">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
              placeholder="What happened? What are you thinking about? Keep it rough — you'll polish it later."
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {text.length}/500
            </p>
          </div>

          {/* Tag picker */}
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => setSelectedTag(tag.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  selectedTag === tag.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <span>{tag.emoji}</span>
                {tag.label}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!text.trim() || isSaving}>
              {isSaving ? 'Saving…' : 'Capture it'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
