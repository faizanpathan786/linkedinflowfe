import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Zap, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { automationAPI, queueSettingsAPI } from '@/lib/api';
import { loadQueueSettings, saveQueueSettings, type QueueSettings } from '@/lib/queue';
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

const PRESETS = [
  {
    label: 'Conservative',
    description: 'Safe defaults — low frequency, high reliability',
    values: { autoRetry: true, retryAttempts: 2, delayBetweenPosts: 30, enableScheduling: true, maxDailyPosts: 3 },
  },
  {
    label: 'Standard',
    description: 'Balanced posting cadence for most users',
    values: { autoRetry: true, retryAttempts: 3, delayBetweenPosts: 10, enableScheduling: true, maxDailyPosts: 5 },
  },
  {
    label: 'Aggressive',
    description: 'High-frequency for power users and agencies',
    values: { autoRetry: true, retryAttempts: 5, delayBetweenPosts: 2, enableScheduling: true, maxDailyPosts: 20 },
  },
] as const;

export function Automation() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const [queue, setQueue] = useState<QueueSettings>(() => loadQueueSettings());

  const toggleQueueDay = (day: number) => {
    setQueue(q => ({
      ...q,
      days: q.days.includes(day) ? q.days.filter(d => d !== day) : [...q.days, day].sort(),
    }));
  };

  const saveQueue = async () => {
    try {
      await queueSettingsAPI.update({ days: queue.days, time: queue.time });
      saveQueueSettings(queue); // keep localStorage in sync for sync consumers
      toast.success('Posting schedule saved.');
    } catch {
      toast.error('Failed to save schedule.');
    }
  };

  const automationForm = useForm<AutomationFormData>({
    resolver: zodResolver(automationSchema),
    defaultValues: {
      autoRetry: true,
      retryAttempts: 3,
      delayBetweenPosts: 5,
      enableScheduling: true,
      maxDailyPosts: 10,
    },
  });

  // Load automation settings and queue settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoadingInitial(true);
        const [automationData, queueData] = await Promise.allSettled([
          automationAPI.getSettings(),
          queueSettingsAPI.get(),
        ]);
        if (automationData.status === 'fulfilled') {
          automationForm.reset(automationData.value.settings);
        }
        if (queueData.status === 'fulfilled' && queueData.value.success) {
          const q = queueData.value.data;
          setQueue((prev) => ({ ...prev, days: q.days, time: q.time }));
          saveQueueSettings({ ...loadQueueSettings(), days: q.days, time: q.time });
        }
      } catch (error: any) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoadingInitial(false);
      }
    };

    loadSettings();
  }, [automationForm]);

  const onSubmit = async (data: AutomationFormData) => {
    setIsLoading(true);
    try {
      await automationAPI.updateSettings(data);
      toast.success('Automation settings updated successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to update automation settings';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 animate-fade-in lg:h-full lg:overflow-hidden">

      {/* Row 1: Presets + Posting Schedule side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Quick presets */}
        <div className="rounded-xl border border-[#e0dfdc] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] space-y-2.5">
          <p className="text-sm font-semibold text-[#191919]">Quick Presets</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  automationForm.reset({ ...preset.values });
                  toast.success(`"${preset.label}" preset applied — save to keep changes.`);
                }}
                className="text-left rounded-lg border border-[#dce6f1] bg-[#f8fafc] hover:bg-[#eef3f8] hover:border-[#0a66c2]/40 transition-colors p-2.5 space-y-1 group"
              >
                <p className="text-xs font-semibold text-[#191919] group-hover:text-[#0a66c2] transition-colors">{preset.label}</p>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-[#0a66c2] font-medium">{preset.values.maxDailyPosts}/day</span>
                  <span className="text-[10px] text-[#595959]">{preset.values.delayBetweenPosts}min delay</span>
                  <span className="text-[10px] text-[#595959]">{preset.values.retryAttempts} retries</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Posting Schedule */}
        <div className="rounded-xl border border-[#e0dfdc] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#191919]">Posting Schedule</p>
            <Switch
              checked={queue.enabled}
              onCheckedChange={(v) => setQueue(q => ({ ...q, enabled: v }))}
            />
          </div>

          {queue.enabled ? (
            <>
              <div className="flex gap-1 flex-wrap">
                {(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as const).map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleQueueDay(idx)}
                    className={cn(
                      'h-8 w-10 rounded-lg border text-[11px] font-semibold transition-colors',
                      queue.days.includes(idx)
                        ? 'bg-[#0a66c2] border-[#0a66c2] text-white'
                        : 'bg-[#f8fafc] border-[#dce6f1] text-[#595959] hover:border-[#0a66c2]/40 hover:bg-[#eef3f8]'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={queue.time}
                  onChange={(e) => setQueue(q => ({ ...q, time: e.target.value }))}
                  className="h-8 rounded-lg border border-[#dce6f1] bg-[#f8fafc] px-3 text-sm text-[#191919] focus:border-[#0a66c2] focus:outline-none focus:ring-2 focus:ring-[#0a66c2]/20"
                />
                {queue.days.length > 0 && (() => {
                  const [h, m] = queue.time.split(':').map(Number);
                  const slots: string[] = [];
                  for (let i = 0; i <= 28 && slots.length < 2; i++) {
                    const d = addDays(new Date(), i);
                    d.setHours(h, m, 0, 0);
                    if (d.getTime() > Date.now() + 5 * 60 * 1000 && queue.days.includes(d.getDay())) {
                      slots.push(format(d, "EEE MMM d"));
                    }
                  }
                  return slots.length > 0 ? (
                    <span className="text-[11px] text-[#0a66c2]">Next: {slots[0]}</span>
                  ) : null;
                })()}
              </div>
            </>
          ) : (
            <p className="text-xs text-[#595959]">Enable to set your posting days and time.</p>
          )}

          <Button type="button" size="sm" onClick={saveQueue} className="!bg-[#0a66c2] !text-white hover:!bg-[#004182] !border-[#0a66c2]">
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Save schedule
          </Button>
        </div>
      </div>

      {/* Row 2: Automation Settings */}
      <div className="rounded-xl border border-[#e0dfdc] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden lg:flex-1 lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5 border-b border-[#e0dfdc] bg-[#f8fafb] px-4 py-3">
          <div className="rounded-lg bg-[#eef3f8] p-1.5 text-[#0a66c2] border border-[#dce6f1]">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#191919]">Automation Settings</p>
            <p className="text-[11px] text-[#595959]">Configure automated posting behaviour</p>
          </div>
        </div>

        <div className="p-4 lg:flex-1">
          {isLoadingInitial ? (
            <div className="flex items-center justify-center py-6">
              <RefreshCw className="h-4 w-4 animate-spin text-[#0a66c2]" />
              <span className="ml-2 text-sm text-[#595959]">Loading…</span>
            </div>
          ) : (
            <form onSubmit={automationForm.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Behaviour toggles */}
                <div className="rounded-xl border border-[#dce6f1] bg-[#f8fafc] p-4 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#595959]">Behaviour</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#e8eef5] bg-white px-3 py-2.5">
                      <div>
                        <p className="text-xs font-medium text-[#191919]">Auto Retry</p>
                        <p className="text-[11px] text-[#595959]">Automatically retry failed posts</p>
                      </div>
                      <Switch {...automationForm.register('autoRetry')} />
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-[#e8eef5] bg-white px-3 py-2.5">
                      <div>
                        <p className="text-xs font-medium text-[#191919]">Enable Scheduling</p>
                        <p className="text-[11px] text-[#595959]">Allow posts to be scheduled ahead</p>
                      </div>
                      <Switch {...automationForm.register('enableScheduling')} />
                    </div>
                  </div>
                </div>

                {/* Limits */}
                <div className="rounded-xl border border-[#dce6f1] bg-[#f8fafc] p-4 space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#595959]">Limits</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="retryAttempts" className="text-xs font-medium text-[#374151]">Retry Attempts <span className="text-[#595959] font-normal">(max 5)</span></Label>
                        <Input
                          id="retryAttempts"
                          type="number"
                          min="1"
                          max="5"
                          {...automationForm.register('retryAttempts', { valueAsNumber: true })}
                          className="h-9 !border-[#dce6f1] !bg-white !text-[#191919]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="delayBetweenPosts" className="text-xs font-medium text-[#374151]">Delay <span className="text-[#595959] font-normal">(mins)</span></Label>
                        <Input
                          id="delayBetweenPosts"
                          type="number"
                          min="1"
                          max="60"
                          {...automationForm.register('delayBetweenPosts', { valueAsNumber: true })}
                          className="h-9 !border-[#dce6f1] !bg-white !text-[#191919]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="maxDailyPosts" className="text-xs font-medium text-[#374151]">Max Daily Posts <span className="text-[#595959] font-normal">(max 50)</span></Label>
                      <Input
                        id="maxDailyPosts"
                        type="number"
                        min="1"
                        max="50"
                        {...automationForm.register('maxDailyPosts', { valueAsNumber: true })}
                        className="h-9 !border-[#dce6f1] !bg-white !text-[#191919]"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="!border-[#0a66c2] !bg-[#0a66c2] !text-white hover:!bg-[#004182]"
              >
                {isLoading ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" />Save Settings</>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
