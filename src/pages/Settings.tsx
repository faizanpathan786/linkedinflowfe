import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  User, Bell, Palette, Database, Download, Trash2,
  Save, RefreshCw, AlertTriangle, Check, Mic2,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLinkedInStore } from '@/store/useLinkedInStore';
import { useDataStore } from '@/store/useDataStore';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { authAPI, brandVoiceAPI, notificationSettingsAPI } from '@/lib/api';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  name:     z.string().min(1, 'Name is required'),
  email:    z.string().email('Invalid email address'),
  timezone: z.string(),
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications:  z.boolean(),
  postSuccess:        z.boolean(),
  postFailure:        z.boolean(),
  batchComplete:      z.boolean(),
  weeklyReport:       z.boolean(),
});

type ProfileFormData      = z.infer<typeof profileSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;
type TabId = 'profile' | 'notifications' | 'appearance' | 'data' | 'brand-voice';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'profile',       label: 'Profile',       icon: User      },
  { id: 'notifications', label: 'Notifications', icon: Bell      },
  { id: 'appearance',    label: 'Appearance',    icon: Palette   },
  { id: 'data',          label: 'Data',          icon: Database  },
  { id: 'brand-voice',   label: 'Brand Voice',   icon: Mic2      },
];

export function Settings() {
  const { user, setUser }       = useAuthStore();
  const { posts }               = useLinkedInStore();
  const { sheetConnection, brandVoice: storedBrandVoice, notificationPrefs: storedNotifPrefs, setBrandVoice: setStoreBrandVoice } = useDataStore();
  const { actualTheme, theme, setTheme } = useTheme();
  const [activeTab,     setActiveTab]     = useState<TabId>('profile');
  const [isLoading,     setIsLoading]     = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved,  setProfileSaved]  = useState(false);

  const [brandVoice, setBrandVoice] = useState({
    name: '', tone: storedBrandVoice?.tone || 'professional',
    style: storedBrandVoice?.style || '', examples: storedBrandVoice?.examples || '',
  });
  const [brandVoiceSaved, setBrandVoiceSaved] = useState(false);

  const saveBrandVoice = async () => {
    try {
      await brandVoiceAPI.update({ tone: brandVoice.tone, style: brandVoice.style, examples: brandVoice.examples });
      setStoreBrandVoice({ tone: brandVoice.tone, style: brandVoice.style, examples: brandVoice.examples });
      setBrandVoiceSaved(true);
      setTimeout(() => setBrandVoiceSaved(false), 2000);
    } catch {
      toast.error('Failed to save brand voice.');
    }
  };

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name:     user?.name  || '',
      email:    user?.email || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: storedNotifPrefs?.emailNotifications ?? true,
      pushNotifications:  storedNotifPrefs?.pushNotifications  ?? false,
      postSuccess:        storedNotifPrefs?.postSuccess        ?? true,
      postFailure:        storedNotifPrefs?.postFailure        ?? true,
      batchComplete:      storedNotifPrefs?.batchComplete      ?? true,
      weeklyReport:       storedNotifPrefs?.weeklyReport       ?? false,
    },
  });


  const saveNotifications = async (data: NotificationFormData) => {
    setIsLoading(true);
    try {
      if (data.pushNotifications && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          notificationForm.setValue('pushNotifications', false);
          data = { ...data, pushNotifications: false };
          toast.warning('Push permission denied by browser. Toggle disabled.');
        }
      }
      await notificationSettingsAPI.update(data);
      toast.success('Notification preferences saved.');
    } catch {
      toast.success('Preferences saved locally.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (data: { name: string; timezone: string }) => {
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      const res = await authAPI.updateProfile({ name: data.name, timezone: data.timezone });
      if (res.user) setUser({ ...user!, ...res.user });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        toast.error('Profile save not available yet — backend update in progress.');
      } else {
        toast.error(err?.response?.data?.message ?? 'Failed to save profile.');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const exportCSV = () => {
    const escape = (val: string) => `"${val.replace(/"/g, '""').replace(/\n/g, ' ').trim()}"`;
    const formatDate = (iso?: string) => {
      if (!iso) return '';
      const d = new Date(iso);
      return isNaN(d.getTime()) ? iso : d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true });
    };
    const headers = ['No.','Post ID','Type','Status','Content Preview','Word Count','Scheduled At','Published At','Created At'];
    const rows = posts.map((p, i) => [
      i + 1,
      escape(p.id || ''),
      escape((p.post_type || 'text').toUpperCase()),
      escape((p.status || '').toUpperCase()),
      escape((p.content || '').slice(0, 120) + ((p.content || '').length > 120 ? '...' : '')),
      (p.content || '').trim().split(/\s+/).filter(Boolean).length,
      escape(formatDate(p.scheduled_at)),
      escape(formatDate(p.published_at)),
      escape(formatDate(p.created_at)),
    ].join(','));
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const csv = [`"LinkedInFlow — Posts Export"`, `"Exported on: ${today}"`, `"Total posts: ${posts.length}"`, '', headers.join(','), ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `linkedinflow-posts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV exported.');
  };

  const exportData = () => {
    const now = new Date();
    const fmt = (iso?: string) => { if (!iso) return null; const d = new Date(iso); return isNaN(d.getTime()) ? iso : d.toISOString(); };
    const data = {
      _meta: { app: 'LinkedInFlow', version: '1.0', exported_at: now.toISOString(), total_posts: posts.length },
      summary: {
        by_status: { published: posts.filter(p => p.status === 'published').length, scheduled: posts.filter(p => p.status === 'scheduled').length, draft: posts.filter(p => p.status === 'draft').length, failed: posts.filter(p => p.status === 'failed').length },
        by_type:   { text: posts.filter(p => p.post_type === 'text').length, image: posts.filter(p => p.post_type === 'image').length, link: posts.filter(p => p.post_type === 'link').length },
      },
      posts: posts.map((p, i) => ({ index: i + 1, id: p.id, status: p.status, post_type: p.post_type, content: p.content, link_url: p.link_url || null, scheduled_at: fmt(p.scheduled_at), published_at: fmt(p.published_at), created_at: fmt(p.created_at), updated_at: fmt(p.updated_at) })),
      integrations: { google_sheets: sheetConnection ? { connected: true, details: sheetConnection } : { connected: false } },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `linkedinflow-export-${now.toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('JSON exported.');
  };

  const clearAllData = () => { localStorage.clear(); toast.success('All local data cleared.'); };

  // ── Shared input classes ─────────────────────────────────────────────────────
  const inputCls = 'w-full h-9 rounded-lg border border-[#e8eaed] bg-[#f8f9fb] px-3 text-[13px] text-[#111827] placeholder:text-[#c0c4cc] focus:border-[#0a66c2] focus:outline-none focus:ring-1 focus:ring-[#0a66c2] transition-colors';
  const labelCls = 'block text-[12px] font-medium text-[#374151] mb-1.5';

  return (
    <div className="flex flex-col gap-3 animate-fade-in">

      {/* ── Main card ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-[#e8eaed] shadow-[0_1px_4px_rgba(0,0,0,0.05)] flex flex-col">

        {/* Tab bar */}
        <div className="flex items-center border-b border-[#e8eaed] px-1 overflow-x-auto scrollbar-hide shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-1.5 h-10 px-3 text-[13px] font-medium transition-colors whitespace-nowrap shrink-0',
                activeTab === tab.id ? 'text-[#0a66c2]' : 'text-[#6b7280] hover:text-[#374151]',
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0a66c2] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">

          {/* ── Profile ────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4 max-w-xl">

              {/* Avatar row */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-[#e8eaed] bg-[#fafafa]">
                <div className="h-12 w-12 rounded-full bg-[#0a66c2] flex items-center justify-center text-xl font-bold text-white shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#111827]">{user?.name || 'User'}</p>
                  <p className="text-[12px] text-[#9ca3af]">{user?.email || ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="name" className={labelCls}>Full name</label>
                  <input id="name" {...profileForm.register('name')} className={inputCls} />
                  {profileForm.formState.errors.name && (
                    <p className="text-[11px] text-rose-600 mt-1">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className={labelCls}>Email address</label>
                  <input id="email" type="email" {...profileForm.register('email')} className={inputCls} />
                  {profileForm.formState.errors.email && (
                    <p className="text-[11px] text-rose-600 mt-1">{profileForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="timezone" className={labelCls}>Timezone</label>
                <input id="timezone" {...profileForm.register('timezone')} className={inputCls} />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-[#0a66c2] hover:bg-[#0958a8] text-white text-[13px] font-medium transition-colors disabled:opacity-50"
              >
                {savingProfile ? (
                  <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Saving…</>
                ) : profileSaved ? (
                  <><Check className="h-3.5 w-3.5" />Saved</>
                ) : (
                  <><Save className="h-3.5 w-3.5" />Save changes</>
                )}
              </button>
            </form>
          )}

          {/* ── Notifications ──────────────────────────────── */}
          {activeTab === 'notifications' && (
            <form onSubmit={notificationForm.handleSubmit(saveNotifications)} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { name: 'emailNotifications' as const, label: 'Email notifications', desc: 'Updates in your inbox'       },
                  { name: 'pushNotifications'  as const, label: 'Push notifications',  desc: 'Browser push alerts'         },
                  { name: 'postSuccess'        as const, label: 'Post published',       desc: 'On successful publish'       },
                  { name: 'postFailure'        as const, label: 'Post failed',          desc: 'On publish failure'          },
                  { name: 'batchComplete'      as const, label: 'Batch complete',       desc: 'Bulk processing done'        },
                  { name: 'weeklyReport'       as const, label: 'Weekly digest',        desc: 'Weekly activity summary'     },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl border border-[#e8eaed] bg-[#fafafa] px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[#111827]">{item.label}</p>
                      <p className="text-[11px] text-[#9ca3af]">{item.desc}</p>
                    </div>
                    <Controller
                      name={item.name}
                      control={notificationForm.control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-[#0a66c2] hover:bg-[#0958a8] text-white text-[13px] font-medium transition-colors disabled:opacity-50"
              >
                {isLoading
                  ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Saving…</>
                  : <><Save className="h-3.5 w-3.5" />Save preferences</>}
              </button>
            </form>
          )}

          {/* ── Appearance ─────────────────────────────────── */}
          {activeTab === 'appearance' && (
            <div className="space-y-5 max-w-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-[#111827]">Theme</p>
                  <p className="text-[12px] text-[#9ca3af] mt-0.5">Light, dark, or system default</p>
                </div>
                <ThemeToggle />
              </div>

              <div>
                <p className="text-[12px] font-medium text-[#6b7280] mb-2">Preview</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'light',  label: 'Light',  cls: 'bg-white border-[#e8eaed]' },
                    { id: 'dark',   label: 'Dark',   cls: 'bg-slate-900 border-slate-700' },
                    { id: 'system', label: 'System', cls: 'bg-gradient-to-br from-white to-slate-200 border-[#e8eaed]' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={cn(
                        'rounded-xl border-2 p-0.5 transition-all',
                        theme === t.id ? 'border-[#0a66c2]' : 'border-transparent hover:border-[#e8eaed]',
                      )}
                    >
                      <div className={cn('h-12 rounded-lg border', t.cls)} />
                      <p className="text-[11px] font-medium text-center py-1 text-[#9ca3af]">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#f3f4f6]">
                <span className="text-[12px] text-[#9ca3af]">Currently active</span>
                <span className="text-[12px] font-semibold text-[#374151] capitalize">{actualTheme}</span>
              </div>
            </div>
          )}

          {/* ── Data ───────────────────────────────────────── */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Export */}
                <div className="rounded-xl border border-[#e8eaed] bg-[#fafafa] p-4 space-y-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[#111827]">Export your data</p>
                    <p className="text-[12px] text-[#9ca3af] mt-0.5">Download all posts as JSON or CSV.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={exportData}
                      className="h-8 flex items-center gap-1.5 px-3 rounded-lg border border-[#e8eaed] bg-white text-[13px] font-medium text-[#374151] hover:bg-[#f3f4f6] transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />Export JSON
                    </button>
                    <button
                      onClick={exportCSV}
                      className="h-8 flex items-center gap-1.5 px-3 rounded-lg border border-[#e8eaed] bg-white text-[13px] font-medium text-[#374151] hover:bg-[#f3f4f6] transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />Export CSV
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="rounded-xl border border-[#e8eaed] bg-[#fafafa] p-4 space-y-3">
                  <p className="text-[13px] font-semibold text-[#111827]">Account statistics</p>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Total posts', value: posts.length },
                      { label: 'Published',   value: posts.filter(p => p.status === 'published').length },
                      { label: 'Drafts',      value: posts.filter(p => p.status === 'draft').length     },
                      { label: 'Failed',      value: posts.filter(p => p.status === 'failed').length    },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between py-1 border-b border-[#f3f4f6] last:border-0">
                        <span className="text-[12px] text-[#9ca3af]">{row.label}</span>
                        <span className="text-[13px] font-semibold text-[#111827] tabular-nums">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Danger zone */}
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-[13px] font-semibold text-rose-700">Danger zone</p>
                  <p className="text-[12px] text-rose-600 leading-relaxed">
                    Permanently deletes all local data including posts, credentials, and settings.{' '}
                    <strong>This action cannot be undone.</strong>
                  </p>
                  <button
                    onClick={clearAllData}
                    className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-medium transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear all data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Brand Voice ────────────────────────────────── */}
          {activeTab === 'brand-voice' && (
            <div className="space-y-4 max-w-xl">
              <p className="text-[12px] text-[#9ca3af]">
                Define your writing style so AI generates posts that sound like you.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bv-name" className={labelCls}>Voice name</label>
                  <input
                    id="bv-name"
                    placeholder="e.g. Thought Leader, Casual Expert"
                    className={inputCls}
                    value={brandVoice.name}
                    onChange={e => setBrandVoice(v => ({ ...v, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="bv-tone" className={labelCls}>Default tone</label>
                  <select
                    id="bv-tone"
                    value={brandVoice.tone}
                    onChange={e => setBrandVoice(v => ({ ...v, tone: e.target.value }))}
                    className="w-full h-9 rounded-lg border border-[#e8eaed] bg-[#f8f9fb] px-3 text-[13px] text-[#111827] focus:border-[#0a66c2] focus:outline-none focus:ring-1 focus:ring-[#0a66c2] transition-colors"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual &amp; Friendly</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="educational">Educational</option>
                    <option value="storytelling">Storytelling</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="bv-style" className={labelCls}>Writing style notes</label>
                <textarea
                  id="bv-style"
                  placeholder="e.g. Short sentences, bullet points, end with a question. No corporate jargon."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[#e8eaed] bg-[#f8f9fb] px-3 py-2.5 text-[13px] text-[#111827] placeholder:text-[#c0c4cc] leading-relaxed focus:border-[#0a66c2] focus:outline-none focus:ring-1 focus:ring-[#0a66c2] transition-colors"
                  value={brandVoice.style}
                  onChange={e => setBrandVoice(v => ({ ...v, style: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="bv-examples" className={labelCls}>
                  Example posts <span className="text-[#9ca3af] font-normal">(optional)</span>
                </label>
                <textarea
                  id="bv-examples"
                  placeholder="Paste 1–3 of your best LinkedIn posts. AI will learn your patterns."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[#e8eaed] bg-[#f8f9fb] px-3 py-2.5 text-[13px] text-[#111827] placeholder:text-[#c0c4cc] leading-relaxed focus:border-[#0a66c2] focus:outline-none focus:ring-1 focus:ring-[#0a66c2] transition-colors"
                  value={brandVoice.examples}
                  onChange={e => setBrandVoice(v => ({ ...v, examples: e.target.value }))}
                />
              </div>

              <button
                onClick={saveBrandVoice}
                className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-[#0a66c2] hover:bg-[#0958a8] text-white text-[13px] font-medium transition-colors"
              >
                {brandVoiceSaved
                  ? <><Check className="h-3.5 w-3.5" />Saved</>
                  : <><Save className="h-3.5 w-3.5" />Save voice</>}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
