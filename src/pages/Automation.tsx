import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';
import {
  Save, Clock, CalendarDays,
  CheckCircle2, TrendingUp, Sparkles, Shield, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { automationAPI, queueSettingsAPI } from '@/lib/api';
import { loadQueueSettings, saveQueueSettings, type QueueSettings } from '@/lib/queue';
import { useDataStore } from '@/store/useDataStore';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

const automationSchema = z.object({
  autoRetry: z.boolean(),
  retryAttempts: z.number().min(1).max(5),
  delayBetweenPosts: z.number().min(1).max(60),
  enableScheduling: z.boolean(),
  maxDailyPosts: z.number().min(1).max(50),
});

type AutomationFormData = z.infer<typeof automationSchema>;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const PRESETS = [
  {
    label: 'Conservative',
    badge: '3/day',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Low frequency, high reliability.',
    values: { autoRetry: true, retryAttempts: 2, delayBetweenPosts: 30, enableScheduling: true, maxDailyPosts: 3 },
  },
  {
    label: 'Standard',
    badge: '5/day',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Balanced cadence for most users.',
    values: { autoRetry: true, retryAttempts: 3, delayBetweenPosts: 10, enableScheduling: true, maxDailyPosts: 5 },
  },
  {
    label: 'Aggressive',
    badge: '20/day',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'High-frequency for power users.',
    values: { autoRetry: true, retryAttempts: 5, delayBetweenPosts: 2, enableScheduling: true, maxDailyPosts: 20 },
  },
] as const;

const FEATURES = [
  { icon: Sparkles,  title: 'AI-Optimised Timing',  desc: 'Posts go out when your audience is most active.'  },
  { icon: Shield,    title: 'Safe Rate Limiting',    desc: 'Stays within LinkedIn API limits always.'          },
  { icon: BarChart3, title: 'Performance Tracking',  desc: 'Every scheduled post is tracked automatically.'   },
];

export function Automation() {
  const { queueSettings: storedQueue, setQueueSettings } = useDataStore();
  const [activePreset, setActivePreset] = useState<string>('Standard');
  const [queue, setQueue] = useState<QueueSettings>(() => {
    if (storedQueue) return { ...loadQueueSettings(), days: storedQueue.days, time: storedQueue.time };
    return loadQueueSettings();
  });

  const toggleQueueDay = (day: number) => {
    setQueue(q => ({
      ...q,
      days: q.days.includes(day) ? q.days.filter(d => d !== day) : [...q.days, day].sort(),
    }));
  };

  const saveQueue = async () => {
    try {
      await queueSettingsAPI.update({ days: queue.days, time: queue.time });
      saveQueueSettings(queue);
      setQueueSettings({ days: queue.days, time: queue.time });
      toast.success('Posting schedule saved.');
    } catch {
      toast.error('Failed to save schedule.');
    }
  };

  const automationForm = useForm<AutomationFormData>({
    resolver: zodResolver(automationSchema),
    defaultValues: { autoRetry: true, retryAttempts: 3, delayBetweenPosts: 5, enableScheduling: true, maxDailyPosts: 10 },
  });

  useEffect(() => {
    automationAPI.getSettings()
      .then(d => automationForm.reset(d.settings))
      .catch(() => {});
  }, [automationForm]);

  const nextSlots: string[] = [];
  if (queue.enabled && queue.days.length > 0) {
    const [h, m] = queue.time.split(':').map(Number);
    for (let i = 0; i <= 28 && nextSlots.length < 2; i++) {
      const d = addDays(new Date(), i);
      d.setHours(h, m, 0, 0);
      if (d.getTime() > Date.now() + 5 * 60 * 1000 && queue.days.includes(d.getDay())) {
        nextSlots.push(format(d, 'EEE, MMM d · h:mm a'));
      }
    }
  }

  return (
    <div className="flex flex-col gap-3 animate-fade-in">

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: CalendarDays,
            label: 'Schedule',
            value: queue.enabled ? `${queue.days.length} days/week` : 'Off',
            sub: queue.enabled ? `at ${queue.time}` : 'Enable below',
            iconBg: 'bg-[#0a66c2]/10', iconColor: 'text-[#0a66c2]',
          },
          {
            icon: Clock,
            label: 'Next Post',
            value: nextSlots[0]?.split('·')[0].trim() ?? '—',
            sub: nextSlots[0]?.split('·')[1]?.trim() ?? 'No slots set',
            iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
          },
          {
            icon: TrendingUp,
            label: 'Posts/Week',
            value: queue.days.length > 0 ? `${queue.days.length}` : '0',
            sub: 'scheduled days',
            iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
          },
        ].map(({ icon: Icon, label, value, sub, iconBg, iconColor }) => (
          <div key={label} className="bg-white rounded-xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.05)] px-4 py-3.5 flex items-start gap-3">
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', iconBg)}>
              <Icon className={cn('h-4 w-4', iconColor)} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[#9ca3af] uppercase tracking-wide">{label}</p>
              <p className="text-[14px] font-semibold text-[#111827] leading-tight mt-0.5 truncate">{value}</p>
              <p className="text-[11px] text-[#9ca3af] mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Posting Schedule ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8eaed]">
          <div>
            <p className="text-[13px] font-semibold text-[#111827]">Posting Schedule</p>
            <p className="text-[12px] text-[#9ca3af] mt-0.5">Choose which days and time your posts go out.</p>
          </div>
          <Switch
            checked={queue.enabled}
            onCheckedChange={(v) => setQueue(q => ({ ...q, enabled: v }))}
          />
        </div>

        <div className="px-4 py-4">
          {queue.enabled ? (
            <div className="space-y-4">

              {/* Day picker */}
              <div>
                <p className="text-[12px] font-medium text-[#6b7280] mb-2">Active Days</p>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleQueueDay(idx)}
                      className={cn(
                        'h-8 w-10 rounded-lg border text-[12px] font-semibold transition-all duration-150',
                        queue.days.includes(idx)
                          ? 'bg-[#0a66c2] border-[#0a66c2] text-white shadow-sm'
                          : 'bg-white border-[#e8eaed] text-[#6b7280] hover:border-[#0a66c2]/40 hover:text-[#374151]',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time + upcoming */}
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div>
                  <p className="text-[12px] font-medium text-[#6b7280] mb-2">Publish Time</p>
                  <input
                    type="time"
                    value={queue.time}
                    onChange={(e) => setQueue(q => ({ ...q, time: e.target.value }))}
                    className="h-8 rounded-lg border border-[#e8eaed] bg-[#f8f9fb] px-3 text-[13px] text-[#111827] focus:border-[#0a66c2] focus:outline-none focus:ring-1 focus:ring-[#0a66c2] transition-colors"
                  />
                </div>
                {nextSlots.length > 0 && (
                  <div>
                    <p className="text-[12px] font-medium text-[#6b7280] mb-2">Upcoming</p>
                    <div className="flex flex-col gap-1.5">
                      {nextSlots.map((slot, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span className="text-[12px] text-[#9ca3af]">
                            <span className="font-medium text-[#374151]">{i === 0 ? 'Next:' : 'Then:'}</span> {slot}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Save */}
              <button
                onClick={saveQueue}
                className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-[#0a66c2] hover:bg-[#0958a8] text-white text-[13px] font-medium transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                Save Schedule
              </button>
            </div>
          ) : (
            <p className="text-[13px] text-[#9ca3af]">Toggle the switch to configure your posting days and time.</p>
          )}
        </div>
      </div>

      {/* ── Presets ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e8eaed]">
          <p className="text-[13px] font-semibold text-[#111827]">Posting Presets</p>
          <p className="text-[12px] text-[#9ca3af] mt-0.5">Pick a posting intensity that fits your workflow.</p>
        </div>

        <div className="px-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESETS.map((preset) => {
              const isActive = activePreset === preset.label;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setActivePreset(preset.label);
                    automationForm.reset({ ...preset.values });
                    toast.success(`"${preset.label}" preset applied.`);
                  }}
                  className={cn(
                    'text-left rounded-xl border p-4 transition-all duration-150 space-y-2',
                    isActive
                      ? 'border-[#0a66c2] bg-[#eff6ff] shadow-sm'
                      : 'border-[#e8eaed] bg-white hover:border-[#c8cdd5] hover:bg-[#f8f9fb]',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[#111827]">{preset.label}</span>
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', preset.badgeClass)}>
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#9ca3af] leading-snug">{preset.description}</p>
                  <div className="flex gap-3">
                    <span className="text-[11px] text-[#9ca3af]">{preset.values.retryAttempts} retries</span>
                    <span className="text-[11px] text-[#9ca3af]">{preset.values.delayBetweenPosts}m delay</span>
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#0a66c2]" />
                      <span className="text-[11px] font-semibold text-[#0a66c2]">Active</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e8eaed]">
          <p className="text-[13px] font-semibold text-[#111827]">How it works</p>
          <p className="text-[12px] text-[#9ca3af] mt-0.5">Everything runs in the background — no manual work needed.</p>
        </div>
        <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#0a66c2]/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-[#0a66c2]" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#111827]">{title}</p>
                <p className="text-[12px] text-[#9ca3af] mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
