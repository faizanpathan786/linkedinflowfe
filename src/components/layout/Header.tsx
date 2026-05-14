import { useState, useEffect, useCallback } from 'react';
import { Bell, CalendarDays, Menu, Sparkles, Check, XCircle, Info, Trash2, AlertTriangle, X, Sliders, LogOut, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  // API notifications (from backend)
  const [apiNotifications, setApiNotifications] = useState<ApiNotification[]>([]);
  const [apiUnreadCount, setApiUnreadCount] = useState(0);

  const fetchApiNotifications = useCallback(async () => {
    try {
      const res = await notificationsAPI.getAll();
      if (res.success) {
        setApiNotifications(res.data);
        setApiUnreadCount(res.unread_count);
      }
    } catch {
      // Backend may not have this endpoint yet — silently ignore
    }
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

  const localUnread = notifications.filter((n) => !n.read).length;
  const unreadCount = localUnread + apiUnreadCount;

  const notificationIcon = (type: 'success' | 'error' | 'info') => {
    if (type === 'success') return Check;
    if (type === 'error') return XCircle;
    return Info;
  };

  const apiNotifIcon = (type: 'post_success' | 'post_failure') =>
    type === 'post_success' ? Check : XCircle;

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-gray-200 bg-[#f8fafb] backdrop-blur-lg transition-all duration-200 ease-in-out">
      {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 7 && !bannerDismissed && (
        <div className="flex items-center justify-between gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              LinkedIn token expires in <strong>{daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}</strong>.{' '}
              <button
                className="underline font-medium hover:no-underline"
                onClick={() => navigate('/dashboard/linkedin-vault')}
              >
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
        <div className="flex items-center gap-2 bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" />
          <span>
            LinkedIn token has expired. Scheduled posts are paused.{' '}
            <button
              className="underline font-medium hover:no-underline"
              onClick={() => navigate('/dashboard/linkedin-vault')}
            >
              Reconnect LinkedIn
            </button>
          </span>
        </div>
      )}
      <div className="relative px-4 py-2 lg:py-2.5 lg:px-8">

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-xl p-0 lg:hidden"
              onClick={onMenuClick}
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-0.5 w-0.5 rounded-full bg-[#0a66c2]" />
                <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[#0a66c2]">{pageMetadata.sectionLabel}</p>
              </div>
              <h1 className="text-base md:text-xl font-bold tracking-tight text-[#191919] leading-tight mb-0.5 sm:mb-1 line-clamp-1">
                {pageMetadata.title}
              </h1>
              <p className="hidden sm:block text-xs text-[#595959] leading-relaxed">
                {pageMetadata.description}
              </p>
            </div>
          </div>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative h-10 w-10 rounded-full border-gray-400 bg-[#f8fafb] hover:bg-[#f0f3f5]"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-black" />
                {unreadCount > 0 && (
                  <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[360px] p-0">
              <div className="flex items-center justify-between px-3 py-2.5">
                <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
                {(notifications.length > 0 || apiNotifications.length > 0) && (
                  <button
                    className="text-xs text-[#191919] hover:opacity-75"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {(apiNotifications.length > 0 || notifications.length > 0) ? (
                <ScrollArea className="max-h-[360px]">
                  <div className="space-y-0 p-1">
                    {/* API notifications (from backend) */}
                    {apiNotifications.slice(0, 25).map((n) => {
                      const Icon = apiNotifIcon(n.type);
                      const isSuccess = n.type === 'post_success';
                      return (
                        <DropdownMenuItem
                          key={`api-${n.id}`}
                          className={cn('flex items-start gap-3 rounded-xl px-3 py-3 focus:bg-muted cursor-pointer', !n.read && 'bg-muted/40')}
                          onClick={() => handleMarkApiRead(n.id)}
                        >
                          <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', isSuccess ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive')}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground">{n.title}</p>
                              {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.body}</p>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                    {/* Local notifications (from post state transitions) */}
                    {notifications.slice(0, 8).map((notification) => {
                      const Icon = notificationIcon(notification.type);
                      return (
                        <DropdownMenuItem
                          key={notification.id}
                          className={cn('flex items-start gap-3 rounded-xl px-3 py-3 focus:bg-muted cursor-pointer', !notification.read && 'bg-muted/40')}
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          <div className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            notification.type === 'success' && 'bg-primary/10 text-primary',
                            notification.type === 'error' && 'bg-destructive/10 text-destructive',
                            notification.type === 'info' && 'bg-tertiary/15 text-tertiary',
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                              {!notification.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed line-clamp-2">{notification.message}</p>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="px-4 py-8 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Bell className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">No notifications yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Published and failed posts will appear here.</p>
                </div>
              )}
              {(notifications.length > 0 || apiNotifications.length > 0) && (
                <>
                  <DropdownMenuSeparator />
                  <div className="flex items-center justify-between px-3 py-2">
                    <button
                      className="flex items-center gap-1.5 text-xs text-[#191919] hover:opacity-75"
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

          <Button
            variant="outline"
            size="icon"
            className="hidden sm:inline-flex h-10 w-10 rounded-full border-gray-400 bg-[#f8fafb] hover:bg-[#f0f3f5]"
            onClick={() => navigate('/dashboard/content-calendar')}
            aria-label="Open calendar"
          >
            <CalendarDays className="h-4 w-4 text-black" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="hidden xl:inline-flex h-10 rounded-full px-4 border-gray-400 bg-[#f8fafb] hover:bg-[#f0f3f5]"
            onClick={() => navigate('/dashboard/create-post')}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-black" />
            Create
          </Button>

          <ThemeToggle />

          <div
            role="status"
            aria-label={connected ? 'LinkedIn account connected' : 'LinkedIn account not connected'}
            className="hidden xl:flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs shadow-[var(--shadow-xs)]"
          >
            <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', connected ? 'bg-primary' : 'bg-muted-foreground/50')} />
            <span className="font-medium text-foreground">{connected ? 'Connected' : 'Not connected'}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-2 rounded-full border border-gray-400 bg-[#f8fafb] px-2 py-1.5 shadow-[var(--shadow-xs)] hover:bg-[#f0f3f5] transition-colors outline-none">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-[11px] font-bold text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-0 rounded-2xl overflow-hidden shadow-lg border border-border">
              {/* Profile card header */}
              <div className="bg-[#f8fafb] px-4 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.name || 'User'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email || ''}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', connected ? 'bg-green-500' : 'bg-gray-300')} />
                      <span className="text-[10px] text-muted-foreground">{connected ? 'LinkedIn connected' : 'LinkedIn not connected'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="p-1.5 space-y-0.5">
                <DropdownMenuItem
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer"
                  onClick={() => navigate('/dashboard/settings')}
                >
                  <Sliders className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer"
                  onClick={() => navigate('/dashboard/linkedin-vault')}
                >
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">LinkedIn Vault</span>
                </DropdownMenuItem>
              </div>

              <div className="p-1.5 border-t border-border">
                <DropdownMenuItem
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Sign out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </div>
    </header>
  );
}
