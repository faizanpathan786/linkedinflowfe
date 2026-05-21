import { useState, useEffect, useCallback } from 'react';
import {
  Bell, CalendarDays, Menu, Sparkles, Check, XCircle, Info,
  Trash2, AlertTriangle, X, Sliders, LogOut, Linkedin,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthStore } from '@/store/useAuthStore';
import { useLinkedInStore } from '@/store/useLinkedInStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLinkedInOAuth } from '@/hooks/useLinkedInOAuth';
import { cn } from '@/lib/utils';
import { notificationsAPI, type ApiNotification } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PageMetadata {
  title: string;
  description: string;
  sectionLabel: string;
}

const routeMetadata: Record<string, PageMetadata> = {
  '/dashboard': {
    sectionLabel: 'Overview',
    title: 'Monitor every post, schedule, and signal in one place',
    description: 'A bird\'s-eye workspace for drafts, scheduling, publishing, and LinkedIn health.',
  },
  '/dashboard/posts': {
    sectionLabel: 'Content',
    title: 'Manage all your posts',
    description: 'View, edit, and organize your LinkedIn content across all statuses.',
  },
  '/dashboard/content-calendar': {
    sectionLabel: 'Planning',
    title: 'Content calendar',
    description: 'Plan and schedule your posts with an intuitive calendar view.',
  },
  '/dashboard/create-post': {
    sectionLabel: 'Creation',
    title: 'Create a new post',
    description: 'Compose your post, choose when to publish, and share with your audience.',
  },
  '/dashboard/analytics': {
    sectionLabel: 'Insights',
    title: 'Post analytics',
    description: 'Track performance, engagement, and reach across all your content.',
  },
  '/dashboard/linkedin-vault': {
    sectionLabel: 'Integrations',
    title: 'LinkedIn Vault',
    description: 'Manage your LinkedIn account connections and integrations.',
  },
  '/dashboard/automation': {
    sectionLabel: 'Automation',
    title: 'Automation Hub',
    description: 'Set up rules and workflows to automate your posting.',
  },
  '/dashboard/settings': {
    sectionLabel: 'Configuration',
    title: 'Settings',
    description: 'Manage your account preferences and application settings.',
  },
  '/dashboard/ideas': {
    sectionLabel: 'Capture',
    title: 'Your idea inbox',
    description: 'Raw thoughts, wins, and lessons captured before they become posts.',
  },
  '/dashboard/ai-interview': {
    sectionLabel: 'Creation',
    title: 'AI Post Interview',
    description: 'Answer 5 questions. Get 3 LinkedIn post drafts written in your voice.',
  },
  '/dashboard/weekly': {
    sectionLabel: 'Planning',
    title: 'Weekly workflow',
    description: 'Turn this week\'s ideas into a full posting schedule in 30 minutes.',
  },
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { daysUntilExpiry } = useLinkedInOAuth();
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sessionStorage.getItem(`linkedin_expiry_dismissed_${today}`) === '1';
  });
  const { user, logout } = useAuthStore();
  const { linkedInStatus, notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useLinkedInStore();
  const location = useLocation();
  const navigate = useNavigate();
  const connected = Boolean(linkedInStatus?.isConnected && !linkedInStatus?.isExpired);
  const pageMetadata = routeMetadata[location.pathname] || routeMetadata['/dashboard'];

  const [apiNotifications, setApiNotifications] = useState<ApiNotification[]>([]);
  const [apiUnreadCount, setApiUnreadCount] = useState(0);

  const fetchApiNotifications = useCallback(async () => {
    try {
      const res = await notificationsAPI.getAll();
      if (res.success) {
        setApiNotifications(res.data);
        setApiUnreadCount(res.unread_count);
      }
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => {
    fetchApiNotifications();
    const interval = setInterval(fetchApiNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchApiNotifications]);

  const handleMarkApiRead = async (id: string) => {
    setApiNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setApiUnreadCount(prev => Math.max(0, prev - 1));
    try { await notificationsAPI.markRead(id); } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    markAllNotificationsRead();
    setApiNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setApiUnreadCount(0);
    try { await notificationsAPI.markAllRead(); } catch { /* ignore */ }
  };

  const localUnread  = notifications.filter(n => !n.read).length;
  const unreadCount  = localUnread + apiUnreadCount;

  const notificationIcon = (type: 'success' | 'error' | 'info') =>
    type === 'success' ? Check : type === 'error' ? XCircle : Info;

  const apiNotifIcon = (type: 'post_success' | 'post_failure') =>
    type === 'post_success' ? Check : XCircle;

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-white border-b border-[#e8eaed] transition-all duration-200">

      {/* Expiry banners */}
      {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7 && !bannerDismissed && (
        <div className="flex items-center justify-between gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-[12px] text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              LinkedIn token expires in <strong>{daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</strong>.{' '}
              <button className="underline font-medium hover:no-underline" onClick={() => navigate('/dashboard/linkedin-vault')}>
                Reconnect now
              </button>
            </span>
          </div>
          <button
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10);
              sessionStorage.setItem(`linkedin_expiry_dismissed_${today}`, '1');
              setBannerDismissed(true);
            }}
            className="shrink-0 rounded p-0.5 hover:bg-amber-200/50"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
        <div className="flex items-center gap-2 bg-rose-50 border-b border-rose-200 px-4 py-2 text-[12px] text-rose-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
          <span>
            LinkedIn token has expired. Scheduled posts are paused.{' '}
            <button className="underline font-medium hover:no-underline" onClick={() => navigate('/dashboard/linkedin-vault')}>
              Reconnect LinkedIn
            </button>
          </span>
        </div>
      )}

      {/* Main header row */}
      <div className="flex items-center justify-between gap-3 px-4 lg:px-5 h-[56px]">

        {/* Left: hamburger + page info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#f3f4f6] text-[#6b7280] transition-colors shrink-0"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0a66c2]">
                {pageMetadata.sectionLabel}
              </span>
              <span className="text-[#d1d5db]">·</span>
              <span className="text-[13px] font-medium text-[#374151] truncate hidden sm:block">
                {pageMetadata.title}
              </span>
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* Create button */}
          <button
            onClick={() => navigate('/dashboard/create-post')}
            className="hidden sm:flex h-8 items-center gap-1.5 px-3 rounded-lg bg-[#0a66c2] hover:bg-[#0958a8] text-white text-[12px] font-semibold transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Create</span>
          </button>

          {/* Calendar */}
          <button
            onClick={() => navigate('/dashboard/content-calendar')}
            aria-label="Open calendar"
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e8eaed] bg-white hover:bg-[#f3f4f6] text-[#6b7280] transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
          </button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Notifications"
                className="relative h-8 w-8 flex items-center justify-center rounded-lg border border-[#e8eaed] bg-white hover:bg-[#f3f4f6] text-[#6b7280] transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[360px] p-0">
              <div className="flex items-center justify-between px-3 py-2.5">
                <DropdownMenuLabel className="p-0 text-[13px] font-semibold text-[#111827]">Notifications</DropdownMenuLabel>
                {(notifications.length > 0 || apiNotifications.length > 0) && (
                  <button className="text-[12px] text-[#0a66c2] hover:underline" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {(apiNotifications.length > 0 || notifications.length > 0) ? (
                <ScrollArea className="max-h-[360px]">
                  <div className="p-1">
                    {apiNotifications.slice(0, 25).map(n => {
                      const Icon = apiNotifIcon(n.type);
                      const isSuccess = n.type === 'post_success';
                      return (
                        <DropdownMenuItem
                          key={`api-${n.id}`}
                          className={cn('flex items-start gap-3 rounded-xl px-3 py-3 cursor-pointer', !n.read && 'bg-[#f8f9fb]')}
                          onClick={() => handleMarkApiRead(n.id)}
                        >
                          <div className={cn('mt-0.5 h-8 w-8 shrink-0 flex items-center justify-center rounded-full', isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13px] font-semibold text-[#111827]">{n.title}</p>
                              {!n.read && <span className="h-2 w-2 rounded-full bg-[#0a66c2] shrink-0" />}
                            </div>
                            <p className="mt-0.5 text-[12px] text-[#9ca3af] leading-relaxed line-clamp-2">{n.body}</p>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                    {notifications.slice(0, 8).map(notification => {
                      const Icon = notificationIcon(notification.type);
                      const iconCls = notification.type === 'success' ? 'bg-emerald-50 text-emerald-600' : notification.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600';
                      return (
                        <DropdownMenuItem
                          key={notification.id}
                          className={cn('flex items-start gap-3 rounded-xl px-3 py-3 cursor-pointer', !notification.read && 'bg-[#f8f9fb]')}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <div className={cn('mt-0.5 h-8 w-8 shrink-0 flex items-center justify-center rounded-full', iconCls)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13px] font-semibold text-[#111827]">{notification.title}</p>
                              {!notification.read && <span className="h-2 w-2 rounded-full bg-[#0a66c2] shrink-0" />}
                            </div>
                            <p className="mt-0.5 text-[12px] text-[#9ca3af] leading-relaxed line-clamp-2">{notification.message}</p>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="px-4 py-8 text-center">
                  <div className="mx-auto h-10 w-10 flex items-center justify-center rounded-full bg-[#f3f4f6] text-[#9ca3af]">
                    <Bell className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-[13px] font-semibold text-[#111827]">No notifications yet</p>
                  <p className="mt-1 text-[12px] text-[#9ca3af]">Published and failed posts will appear here.</p>
                </div>
              )}
              {(notifications.length > 0 || apiNotifications.length > 0) && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-3 py-2">
                    <button
                      className="flex items-center gap-1.5 text-[12px] text-[#9ca3af] hover:text-rose-600 transition-colors"
                      onClick={() => { clearNotifications(); setApiNotifications([]); setApiUnreadCount(0); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear all
                    </button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* LinkedIn status */}
          <div className="hidden xl:flex items-center gap-1.5 rounded-lg border border-[#e8eaed] bg-white px-2.5 py-1.5">
            <span className={cn('h-2 w-2 rounded-full shrink-0', connected ? 'bg-emerald-500' : 'bg-[#d1d5db]')} />
            <span className="text-[12px] font-medium text-[#374151]">{connected ? 'Connected' : 'Not connected'}</span>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-2 rounded-lg border border-[#e8eaed] bg-white px-2 py-1.5 hover:bg-[#f3f4f6] transition-colors outline-none">
                <div className="h-6 w-6 rounded-full bg-[#0a66c2]/15 flex items-center justify-center shrink-0 text-[11px] font-bold text-[#0a66c2]">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-[12px] font-medium text-[#374151] hidden lg:block max-w-[80px] truncate">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-60 p-0 rounded-xl overflow-hidden shadow-lg border border-[#e8eaed]">
              <div className="bg-[#fafafa] px-4 py-3.5 border-b border-[#e8eaed]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0a66c2]/15 flex items-center justify-center shrink-0 text-sm font-bold text-[#0a66c2]">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#111827] truncate">{user?.name || 'User'}</p>
                    <p className="text-[11px] text-[#9ca3af] truncate">{user?.email || ''}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', connected ? 'bg-emerald-500' : 'bg-[#d1d5db]')} />
                      <span className="text-[10px] text-[#9ca3af]">{connected ? 'LinkedIn connected' : 'Not connected'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-1.5 space-y-0.5">
                <DropdownMenuItem
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer"
                  onClick={() => navigate('/dashboard/settings')}
                >
                  <Sliders className="h-3.5 w-3.5 text-[#9ca3af]" />
                  <span className="text-[13px] text-[#374151]">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer"
                  onClick={() => navigate('/dashboard/linkedin-vault')}
                >
                  <Linkedin className="h-3.5 w-3.5 text-[#9ca3af]" />
                  <span className="text-[13px] text-[#374151]">LinkedIn Vault</span>
                </DropdownMenuItem>
              </div>

              <div className="p-1.5 border-t border-[#e8eaed]">
                <DropdownMenuItem
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                  onClick={async () => { await logout(); navigate('/'); }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="text-[13px]">Sign out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
