import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  LogOut,
  X,
  Linkedin,
  LineChart,
  Lock,
  Sliders,
  Zap,
  FileText,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Sparkles,
  PenLine,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLinkedInStore } from '@/store/useLinkedInStore';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const navSections = [
  {
    label: 'Workspace',
    items: [
      { title: 'Dashboard',    href: '/dashboard',                  icon: LayoutDashboard },
      { title: 'Create Post',  href: '/dashboard/create-post',      icon: PenLine         },
      { title: 'Posts',        href: '/dashboard/posts',            icon: FileText        },
      { title: 'Planner',      href: '/dashboard/content-calendar', icon: CalendarDays    },
      { title: 'Ideas',        href: '/dashboard/ideas',            icon: Lightbulb       },
      { title: 'AI Interview', href: '/dashboard/ai-interview',     icon: Sparkles        },
    ],
  },
  {
    label: 'Insights',
    items: [
      { title: 'Analytics',      href: '/dashboard/analytics',      icon: LineChart },
      { title: 'LinkedIn Vault', href: '/dashboard/linkedin-vault', icon: Lock      },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'Automation', href: '/dashboard/automation', icon: Zap     },
      { title: 'Settings',   href: '/dashboard/settings',   icon: Sliders },
    ],
  },
];

export function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user }          = useAuthStore();
  const { posts, linkedInStatus } = useLinkedInStore();

  const draftCount     = posts.filter(p => p.status === 'draft').length;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;

  const isLinkedInConnected = Boolean(linkedInStatus?.isConnected && !linkedInStatus?.isExpired);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity duration-300 ease-in-out',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-[280px] flex flex-col overflow-hidden lg:overflow-visible',
          'border-r border-gray-200 bg-[#f8fafb] text-gray-700',
          'lg:m-0 lg:h-screen lg:rounded-none lg:border-r lg:border-gray-200 lg:shadow-none',
          isCollapsed ? 'lg:w-[90px]' : 'lg:w-[250px]',
          'transition-[transform,width] duration-300 ease-in-out lg:sticky lg:top-0 lg:self-start lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute right-0 translate-x-1/2 top-16 z-20 h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-[0_2px_8px_rgba(0,0,0,0.10)] hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        {/* Brand */}
        <div className={cn('flex h-16 items-center shrink-0', isCollapsed ? 'justify-center px-2' : 'justify-between px-5')}>
          <button
            className={cn('flex items-center', isCollapsed ? 'justify-center' : 'gap-3')}
            onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
            aria-label="Go to Dashboard"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-sm shrink-0">
              <Linkedin className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="text-left leading-tight">
                <span className="block text-base font-bold text-gray-800 whitespace-nowrap">LinkedInFlow</span>
                <span className="block text-[11px] text-gray-500 whitespace-nowrap">Control center</span>
              </div>
            )}
          </button>

          <button
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          'flex-1 overflow-hidden pb-3 flex flex-col',
          isCollapsed ? 'px-2 pt-2 gap-3' : 'px-3 pt-8 gap-6',
        )}>
          {navSections.map((section, sectionIndex) => (
            <div key={section.label}>
              {sectionIndex > 0 && (
                <div className={cn(isCollapsed ? '-mx-2 mb-2' : '-mx-3 mb-3')} />
              )}
              <div className={cn(isCollapsed ? 'flex flex-col items-center gap-3' : 'space-y-3')}>
                {section.items.map((item) => {
                  const itemPath = item.href.split('?')[0];
                  const isActive = location.pathname === itemPath;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'sidebar-item',
                        isCollapsed && 'h-10 w-10 justify-center rounded-xl !px-0 !gap-0',
                        isActive && 'active',
                      )}
                      title={item.title}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 whitespace-nowrap overflow-hidden">{item.title}</span>
                          {item.href === '/dashboard/posts' && (draftCount > 0 || scheduledCount > 0) && (
                            <span className="ml-auto flex gap-0.5">
                              {draftCount > 0 && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                  {draftCount}
                                </span>
                              )}
                              {scheduledCount > 0 && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-[#0a66c2] border border-blue-200">
                                  {scheduledCount}
                                </span>
                              )}
                            </span>
                          )}
                          {item.href === '/dashboard/linkedin-vault' && (
                            <span className={cn('ml-auto h-2 w-2 rounded-full shrink-0', isLinkedInConnected ? 'bg-green-500' : 'bg-amber-400')} />
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Account */}
        <div className={cn('shrink-0 space-y-1.5', isCollapsed ? 'p-2' : 'p-3')}>
          <div className={cn('flex rounded-2xl border border-gray-200 bg-white', isCollapsed ? 'items-center justify-center px-2 py-3' : 'items-center gap-3 px-3 py-3')}>
            <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-[11px] font-bold text-primary ring-2 ring-primary/30">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email || ''}</p>
              </div>
            )}
          </div>

          <div className={cn(isCollapsed && 'flex justify-center')}>
            <button
              onClick={logout}
              className={cn('sidebar-item', isCollapsed ? 'h-10 w-10 justify-center !px-0 !gap-0' : 'w-full justify-start')}
              title="Sign out"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Sign out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
