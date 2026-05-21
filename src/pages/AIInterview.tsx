import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { postsAPI } from '@/lib/api';
import { Sparkles, Copy, Loader2, ArrowRight, PenLine, Mic2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/useDataStore';
import { useLinkedInStore } from '@/store/useLinkedInStore';

// ── Constants ─────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    key: 'q1' as const,
    label: 'What happened?',
    placeholder: 'We closed our first $10K deal. A customer told us our tool saved them 5 hours a week. I failed at something and learned from it…',
  },
  {
    key: 'q2' as const,
    label: 'Who was it for?',
    placeholder: 'B2B founders. My younger self. Anyone who has struggled with X…',
  },
  {
    key: 'q5' as const,
    label: 'What should the reader do differently?',
    placeholder: 'Stop doing X. Start asking Y. Rethink how you approach Z…',
  },
] as const;

type StyleOption = 'story' | 'opinion' | 'insight';

const STYLE_OPTIONS: Array<{ value: StyleOption; label: string; description: string; emoji: string }> = [
  { value: 'story',   label: 'Story',   emoji: '📖', description: 'Narrative arc with a punchline' },
  { value: 'opinion', label: 'Opinion', emoji: '🎯', description: 'Bold take with a clear stance'  },
  { value: 'insight', label: 'Insight', emoji: '💡', description: 'Lesson distilled to action'     },
];

// ── Fallback prompt builder ───────────────────────────────────────────────────

function buildFallbackPrompt(
  answers: { q1: string; q2: string; q5: string },
  style: string,
  brandVoice: { tone?: string; style?: string },
): string {
  const styleGuides: Record<string, string> = {
    story:   `Tell it as a narrative arc: setup → conflict or turning point → resolution → lesson. Use short punchy sentences. The hook should drop the reader into the middle of the action.`,
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
  const [searchParams] = useSearchParams();
  const ideaId = searchParams.get('idea');

  const {
    aiAnswers: answers, aiStyle: style, aiVariations: variations,
    setAIAnswers: setAnswers, setAIStyle: setStyle, setAIVariations: setVariations,
    brandVoice: storedBrandVoice,
  } = useDataStore();
  const { ideas } = useLinkedInStore();

  const [isGenerating,   setIsGenerating]   = useState(false);
  const [generateError,  setGenerateError]  = useState<string | null>(null);
  const [fallbackPrompt, setFallbackPrompt] = useState<string | null>(null);
  const [useBrandVoice,  setUseBrandVoice]  = useState(true);

  // Pre-fill q1 from idea in store — instant, no API call
  useEffect(() => {
    if (!ideaId) return;
    const idea = ideas.find((i) => i.id === ideaId);
    if (idea) setAnswers({ ...answers, q1: idea.text });
  }, [ideaId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setVariations(null);
    setGenerateError(null);
    setFallbackPrompt(null);

    const brandVoice = useBrandVoice ? (storedBrandVoice ?? {}) : {};

    try {
      const result = await postsAPI.generateFromInterview({ answers, style, brand_voice: brandVoice });
      setVariations(result.variations);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404 || !axiosErr?.response) {
        setFallbackPrompt(buildFallbackPrompt(answers, style, brandVoice));
      } else {
        setGenerateError('Generation failed. Please try again.');
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

  const canGenerate = answers.q1.trim().length > 0 && !isGenerating;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 h-full animate-fade-in">

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-3 flex-1 min-h-0">

        {/* ── Left: Interview form ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">

          {/* Card header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#e8eaed] shrink-0">
            <div className="h-8 w-8 rounded-lg bg-[#0a66c2]/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-[#0a66c2]" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#111827]">AI Interview</p>
              <p className="text-[12px] text-[#9ca3af]">Answer 3 questions · Get 3 post variations</p>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 px-5 py-4 space-y-3 overflow-hidden">

            {/* Questions */}
            {QUESTIONS.map((q, idx) => (
              <div key={q.key} className="space-y-1.5">
                <label className="flex items-center gap-2 text-[13px] font-semibold text-[#111827]">
                  <span className="h-5 w-5 rounded-full bg-[#0a66c2] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  {q.label}
                </label>
                <textarea
                  placeholder={q.placeholder}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[#e8eaed] bg-[#f8f9fb] px-3 py-2.5 text-[13px] text-[#111827] placeholder:text-[#c0c4cc] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0a66c2] focus:border-[#0a66c2] transition-colors"
                  value={answers[q.key]}
                  onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
                />
              </div>
            ))}

            {/* Style picker */}
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-[#111827]">Post style</p>
              <div className="grid grid-cols-3 gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStyle(opt.value)}
                    className={cn(
                      'rounded-lg border p-2.5 text-left transition-all duration-150',
                      style === opt.value
                        ? 'border-[#0a66c2] bg-[#eff6ff]'
                        : 'border-[#e8eaed] bg-white hover:border-[#c8cdd5] hover:bg-[#f8f9fb]',
                    )}
                  >
                    <span className="text-base leading-none">{opt.emoji}</span>
                    <p className={cn('text-[12px] font-semibold mt-1.5', style === opt.value ? 'text-[#0a66c2]' : 'text-[#111827]')}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-[#9ca3af] mt-0.5 leading-snug">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand voice toggle */}
            <div className={cn(
              'flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors',
              useBrandVoice ? 'border-[#0a66c2]/30 bg-[#eff6ff]' : 'border-[#e8eaed] bg-[#f8f9fb]',
            )}>
              <div className="flex items-center gap-2 min-w-0">
                <Mic2 className={cn('h-3.5 w-3.5 shrink-0', useBrandVoice ? 'text-[#0a66c2]' : 'text-[#9ca3af]')} />
                <div className="min-w-0">
                  <p className={cn('text-[12px] font-semibold', useBrandVoice ? 'text-[#0a66c2]' : 'text-[#6b7280]')}>
                    Brand Voice
                  </p>
                  <p className="text-[11px] text-[#9ca3af] truncate">
                    {useBrandVoice
                      ? storedBrandVoice?.tone ? `Tone: ${storedBrandVoice.tone}` : 'Using your saved voice'
                      : 'Off — generating without your voice'}
                  </p>
                </div>
              </div>
              <Switch
                checked={useBrandVoice}
                onCheckedChange={setUseBrandVoice}
              />
            </div>

            {/* Generate button */}
            <button
              disabled={!canGenerate}
              onClick={handleGenerate}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-[#0a66c2] hover:bg-[#0958a8] text-white text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Generating…</>
              ) : (
                <><Sparkles className="h-4 w-4" />Generate posts</>
              )}
            </button>
          </div>
        </div>

        {/* ── Right: Results ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">

          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e8eaed] shrink-0">
            <div>
              <p className="text-[14px] font-semibold text-[#111827]">Generated posts</p>
              <p className="text-[12px] text-[#9ca3af]">
                {variations ? '3 variations — pick your favourite' : 'Results will appear here'}
              </p>
            </div>
            {variations && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                3 ready
              </span>
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* Generating skeleton */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center h-full min-h-[260px] gap-4">
                <div className="h-10 w-10 rounded-full bg-[#0a66c2]/10 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-[#0a66c2] animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-medium text-[#111827]">Writing your posts…</p>
                  <p className="text-[12px] text-[#9ca3af] mt-0.5">This usually takes 10–15 seconds</p>
                </div>
                <div className="space-y-2 w-full max-w-[280px]">
                  {[100, 85, 70].map((w, i) => (
                    <div key={i} className="h-2.5 rounded-full bg-[#f3f4f6] overflow-hidden">
                      <div className="h-full rounded-full bg-[#0a66c2]/20 animate-pulse" style={{ width: `${w}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isGenerating && !variations && !fallbackPrompt && !generateError && (
              <div className="flex flex-col items-center justify-center h-full min-h-[260px] gap-4 text-center">
                <div className="h-14 w-14 rounded-2xl bg-[#f8f9fb] border border-[#e8eaed] flex items-center justify-center text-2xl">
                  ✍️
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#111827]">Your posts will appear here</p>
                  <p className="text-[12px] text-[#9ca3af] mt-1 max-w-[220px] mx-auto">
                    Answer at least "What happened?" and click Generate.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#9ca3af]">
                  <ArrowRight className="h-3 w-3 -scale-x-100" />
                  <span>Fill in the form on the left</span>
                </div>
              </div>
            )}

            {/* Error */}
            {generateError && !isGenerating && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-[13px] font-medium text-rose-700">{generateError}</p>
                <button onClick={handleGenerate} className="mt-2 text-[12px] font-medium text-rose-700 underline hover:no-underline">
                  Try again
                </button>
              </div>
            )}

            {/* Fallback prompt */}
            {fallbackPrompt && !isGenerating && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <p className="text-[12px] font-semibold text-amber-800">
                  AI generation is being set up — copy this prompt into ChatGPT:
                </p>
                <pre className="text-[11px] text-amber-900 whitespace-pre-wrap leading-relaxed bg-white/70 rounded-lg p-3 border border-amber-200 max-h-[300px] overflow-y-auto">
                  {fallbackPrompt}
                </pre>
                <button
                  onClick={() => { navigator.clipboard.writeText(fallbackPrompt); toast.success('Prompt copied.'); }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-amber-300 bg-white text-[12px] font-medium text-amber-800 hover:bg-amber-50 transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  Copy prompt
                </button>
              </div>
            )}

            {/* Variation cards */}
            {variations && !isGenerating && variations.map((variation, i) => (
              <div
                key={i}
                className="group rounded-xl border border-[#e8eaed] bg-white overflow-hidden transition-all duration-150 hover:border-[#d1d5db] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              >
                {/* Card top bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#f3f4f6] bg-[#fafafa]">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">
                    <span className="h-4 w-4 rounded-full bg-[#0a66c2] text-white text-[9px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {variation.type || `Variation ${i + 1}`}
                  </span>
                  <button
                    onClick={() => copyVariation(variation.content)}
                    className="h-6 w-6 flex items-center justify-center rounded-md text-[#9ca3af] hover:text-[#374151] hover:bg-[#f3f4f6] transition-colors"
                    title="Copy"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>

                {/* Post content */}
                <div className="px-4 py-3">
                  <p className="text-[13px] text-[#111827] leading-relaxed whitespace-pre-wrap line-clamp-6">
                    {variation.content}
                  </p>
                </div>

                {/* Action */}
                <div className="px-4 pb-3">
                  <button
                    onClick={() => useVariation(variation.content)}
                    className="w-full h-8 flex items-center justify-center gap-1.5 rounded-lg bg-[#0a66c2] hover:bg-[#0958a8] text-white text-[12px] font-semibold transition-colors"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    Use this post
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
