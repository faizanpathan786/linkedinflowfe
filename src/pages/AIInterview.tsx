import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { ideasAPI, brandVoiceAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Copy, Loader } from 'lucide-react';
import { postsAPI } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Constants ──────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    key: 'q1' as const,
    label: 'What happened?',
    placeholder:
      'We closed our first $10K deal. A customer told us our tool saved them 5 hours a week. I failed at something and learned from it...',
  },
  {
    key: 'q2' as const,
    label: 'Who was it for?',
    placeholder: 'B2B founders. My younger self. Anyone who has struggled with X...',
  },
  {
    key: 'q5' as const,
    label: 'What should the reader do differently after reading this?',
    placeholder: 'Stop doing X. Start asking Y. Rethink how you approach Z...',
  },
] as const;

type StyleOption = 'story' | 'opinion' | 'insight';

const STYLE_OPTIONS: Array<{ value: StyleOption; label: string; description: string }> = [
  { value: 'story', label: 'Story', description: 'A narrative with a beginning, middle, punchline' },
  { value: 'opinion', label: 'Opinion', description: 'A bold take with a clear stance' },
  { value: 'insight', label: 'Insight', description: 'A lesson distilled into actionable points' },
];

// ── Fallback prompt builder (module-level) ────────────────────────────────────

function buildFallbackPrompt(
  answers: { q1: string; q2: string; q5: string },
  style: string,
  brandVoice: { tone?: string; style?: string }
): string {
  const styleGuides: Record<string, string> = {
    story: `Tell it as a narrative arc: setup → conflict or turning point → resolution → lesson. Use short punchy sentences. The hook should drop the reader into the middle of the action.`,
    opinion: `Open with a bold, possibly controversial claim. Back it with 2-3 concrete reasons or examples. End with a clear call-to-think that invites debate. Don't hedge — commit to the stance.`,
    insight: `Distill the experience into the single most non-obvious lesson. Use a numbered or bulleted breakdown only if it genuinely clarifies. Lead with the counterintuitive truth, not the setup.`,
  };

  return `You are a ghostwriter for a founder on LinkedIn. Write 3 distinct post variations based on the inputs below.

STYLE: ${style}
Style guide: ${styleGuides[style] || styleGuides.story}
${brandVoice.tone ? `\nTONE: ${brandVoice.tone}` : ''}
${brandVoice.style ? `VOICE NOTES: ${brandVoice.style}` : ''}

INPUTS:
- What happened: ${answers.q1}
- Who it's for: ${answers.q2 || 'founders and professionals'}
- What the reader should do differently: ${answers.q5 || 'think differently about this topic'}

VARIATION HOOKS — use a different hook type for each:
1. Open with a specific number, stat, or concrete detail ("I lost $12K in 3 days.")
2. Open with a counter-intuitive statement or confession ("Everyone told me to do X. I did the opposite.")
3. Open with a question that creates instant tension ("What would you do if your best customer ghosted you?")

FORMAT FOR EACH VARIATION:
[Hook — 1 sentence, max 15 words]

[Body — 3-5 short paragraphs, each 1-3 sentences. Leave a blank line between each.]

[Closing line — a punchy takeaway or call-to-action, 1 sentence]

HARD RULES:
- Never open with "In today's", "I'm excited to share", "Thrilled to announce", "Game-changer", or "Leverage"
- No corporate jargon or buzzwords
- Write in first person, past tense for the story, present tense for opinions/insights
- Max 280 words per variation
- Sound like a real person writing from experience, not an AI writing a LinkedIn post`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AIInterview() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('idea');

  const [answers, setAnswers] = useState({ q1: '', q2: '', q5: '' });
  const [style, setStyle] = useState<StyleOption>('story');
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<Array<{ type: string; content: string; hook: string }> | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [fallbackPrompt, setFallbackPrompt] = useState<string | null>(null);

  // Pre-fill q1 from a saved idea if ideaId is present
  useEffect(() => {
    if (!ideaId) return;
    ideasAPI.getAll()
      .then((res) => {
        if (res.success) {
          const idea = res.data.find((i) => i.id === ideaId);
          if (idea) setAnswers((a) => ({ ...a, q1: idea.text }));
        }
      })
      .catch(() => {});
  }, [ideaId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setVariations(null);
    setGenerateError(null);
    setFallbackPrompt(null);

    let brandVoice: { tone?: string; style?: string; examples?: string } = {};
    try {
      const bvRes = await brandVoiceAPI.get();
      if (bvRes.success && bvRes.data) brandVoice = bvRes.data;
    } catch {
      // proceed without brand voice
    }

    try {
      const result = await postsAPI.generateFromInterview({ answers, style, brand_voice: brandVoice });
      setVariations(result.variations);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404 || !axiosErr?.response) {
        // Build fallback prompt so user can paste it into ChatGPT
        const prompt = buildFallbackPrompt(answers, style, brandVoice);
        setFallbackPrompt(prompt);
      } else {
        setGenerateError('Generation failed. Try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyVariation = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard.');
  };

  const useVariation = (content: string) => {
    sessionStorage.setItem('linkedinflow_composer_prefill', content);
    navigate('/dashboard/create-post?from=interview');
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:h-full lg:overflow-hidden">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:flex-1 lg:grid-cols-[1fr_400px] gap-6 lg:overflow-hidden">
        {/* ── Left: Interview form ─────────────────────────────────────────── */}
        <Card className="lg:overflow-y-auto">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Post Interview
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Answer 3 questions. Get 3 LinkedIn post variations.
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Questions */}
            {QUESTIONS.map((q, index) => (
              <div key={q.key} className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  {q.label}
                </Label>
                <Textarea
                  placeholder={q.placeholder}
                  rows={2}
                  className="text-sm resize-none"
                  value={answers[q.key]}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                />
              </div>
            ))}

            {/* Style picker */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Post style</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStyle(opt.value)}
                    className={cn(
                      'rounded-lg border p-2.5 text-left transition-colors',
                      style === opt.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    )}
                  >
                    <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                      {opt.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <Button
              className="w-full"
              disabled={!answers.q1.trim() || isGenerating}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate posts
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ── Right: Results ───────────────────────────────────────────────── */}
        <div className="space-y-3 lg:overflow-y-auto">
          {/* Loading */}
          {isGenerating && (
            <div className="rounded-xl border border-border p-10 text-center space-y-3">
              <Loader className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Writing your posts…</p>
            </div>
          )}

          {/* Empty state */}
          {!isGenerating && !variations && !fallbackPrompt && !generateError && (
            <div className="rounded-xl border-2 border-dashed border-border p-10 text-center space-y-3">
              <div className="text-4xl">✍️</div>
              <p className="text-sm font-medium text-foreground">Your posts will appear here</p>
              <p className="text-xs text-muted-foreground">
                Answer at least "What happened?" and click Generate.
              </p>
            </div>
          )}

          {/* Error */}
          {generateError && !isGenerating && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-center">
              <p className="text-sm text-destructive">{generateError}</p>
            </div>
          )}

          {/* Fallback prompt */}
          {fallbackPrompt && !isGenerating && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-amber-800">
                AI generation is being set up. Copy this prompt into ChatGPT:
              </p>
              <pre className="text-[11px] text-amber-900 whitespace-pre-wrap leading-relaxed bg-white/70 rounded-lg p-3 border border-amber-200">
                {fallbackPrompt}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(fallbackPrompt);
                  toast.success('Prompt copied.');
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy prompt
              </Button>
            </div>
          )}

          {/* Variations */}
          {variations && !isGenerating && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-0.5">
                3 variations generated
              </p>
              {variations.map((variation, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {variation.type}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => copyVariation(variation.content)}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Copy variation"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {variation.content}
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => useVariation(variation.content)}
                  >
                    Use this post
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

