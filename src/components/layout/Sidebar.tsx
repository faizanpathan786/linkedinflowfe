import { useState, type MouseEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LinkedInGateModal } from '@/components/posts/LinkedInGateModal';
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
  Lightbulb,
  Sparkles,
  PenLine,
  HelpCircle,
  PanelLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useLinkedInStore } from '@/store/useLinkedInStore';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const mainNav = [
  { title: 'Dashboard',    href: '/dashboard',                  icon: LayoutDashboard },
  { title: 'Create Post',  href: '/dashboard/create-post',      icon: PenLine         },
  { title: 'Posts',        href: '/dashboard/posts',            icon: FileText        },
  { title: 'Planner',      href: '/dashboard/content-calendar', icon: CalendarDays    },
  { title: 'Ideas',        href: '/dashboard/ideas',            icon: Lightbulb       },
  { title: 'AI Interview', href: '/dashboard/ai-interview',     icon: Sparkles        },
];

const insightsNav = [
  { title: 'Analytics',      href: '/dashboard/analytics',      icon: LineChart },
  { title: 'LinkedIn Vault', href: '/dashboard/linkedin-vault', icon: Lock      },
];

const systemNav = [
  { title: 'Automation', href: '/dashboard/automation', icon: Zap     },
  { title: 'Settings',   href: '/dashboard/settings',   icon: Sliders },
];

export function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user }          = useAuthStore();
  const { posts, linkedInStatus } = useLinkedInStore();

  const draftCount     = posts.filter(p => p.status === 'draft').length;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;

  const isLinkedInConnected = Boolean(linkedInStatus?.isConnected && !linkedInStatus?.isExpired);
  const [showGate, setShowGate] = useState(false);

  const NavItem = ({ item }: { item: typeof mainNav[0] }) => {
    const itemPath = item.href.split('?')[0];
    const isActive = location.pathname === itemPath;

    const handleClick = (e: MouseEvent) => {
      if (item.href === '/dashboard/create-post' && !isLinkedInConnected) {
        e.preventDefault();
        setShowGate(true);
        return;
      }
      setIsOpen(false);
    };

    return (
      <Link
        to={item.href}
        onClick={handleClick}
        className={cn(
          'sidebar-item',
          isCollapsed && 'h-9 w-9 justify-center !px-0 !gap-0',
          isActive && 'active',
        )}
        title={isCollapsed ? item.title : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1 whitespace-nowrap overflow-hidden">{item.title}</span>
            {item.href === '/dashboard/posts' && (draftCount > 0 || scheduledCount > 0) && (
              <span className="ml-auto flex gap-0.5">
                {draftCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                    {draftCount}
                  </span>
                )}
                {scheduledCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-[#0a66c2]">
                    {scheduledCount}
                  </span>
                )}
              </span>
            )}
            {item.href === '/dashboard/linkedin-vault' && (
              <span className={cn('ml-auto h-1.5 w-1.5 rounded-full shrink-0', isLinkedInConnected ? 'bg-green-500' : 'bg-amber-400')} />
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <>
      {showGate && (
        <LinkedInGateModal onDismiss={() => setShowGate(false)} />
      )}
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/30 lg:hidden transition-opacity duration-200',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full flex flex-col overflow-hidden',
          'border-r border-[#e8eaed] bg-white',
          'lg:h-screen lg:sticky lg:top-0 lg:self-start lg:translate-x-0',
          isCollapsed ? 'lg:w-[68px] w-[68px]' : 'w-[220px] lg:w-[220px]',
          'transition-[transform,width] duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className="flex h-[56px] items-center shrink-0 border-b border-[#e8eaed] px-3 gap-2">

          {/* Collapsed: LinkedIn icon + expand toggle */}
          {isCollapsed ? (
            <div className="flex items-center justify-between w-full">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0a66c2] text-white shrink-0"
                onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
                aria-label="Go to Dashboard"
              >
                <Linkedin className="h-4 w-4" />
              </button>
              <button
                className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-[#f1f3f6] hover:text-[#1a1d23] transition-colors"
                onClick={() => setIsCollapsed(false)}
                aria-label="Expand sidebar"
              >
                <PanelLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          ) : (
            <>
              {/* Logo + name */}
              <button
                className="flex items-center gap-2 min-w-0"
                onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
                aria-label="Go to Dashboard"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0a66c2] text-white shrink-0">
                  <Linkedin className="h-4 w-4" />
                </div>
                <span className="text-[14px] font-bold text-[#1a1d23] whitespace-nowrap">LinkedInFlow</span>
              </button>

              {/* Desktop: collapse */}
              <button
                className="hidden lg:flex ml-auto h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-[#f1f3f6] hover:text-[#1a1d23] transition-colors"
                onClick={() => setIsCollapsed(true)}
                aria-label="Collapse sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </button>

              {/* Mobile: close drawer */}
              <button
                className="lg:hidden ml-auto h-7 w-7 shrink-0 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden py-3', isCollapsed ? 'px-1.5' : 'px-2')}>

          {/* Main */}
          <div className="space-y-0.5">
            {mainNav.map(item => <NavItem key={item.href} item={item} />)}
          </div>

          {/* Insights */}
          <div className="mt-4">
            {!isCollapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">Insights</p>
            )}
            {isCollapsed && <div className="mx-1.5 mb-2 border-t border-[#e8eaed]" />}
            <div className="space-y-0.5">
              {insightsNav.map(item => <NavItem key={item.href} item={item} />)}
            </div>
          </div>

          {/* System */}
          <div className="mt-4">
            {!isCollapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">System</p>
            )}
            {isCollapsed && <div className="mx-1.5 mb-2 border-t border-[#e8eaed]" />}
            <div className="space-y-0.5">
              {systemNav.map(item => <NavItem key={item.href} item={item} />)}
            </div>
          </div>

        </nav>

        {/* Bottom: help + user */}
        <div className={cn('shrink-0 border-t border-[#e8eaed]', isCollapsed ? 'px-1.5 py-2' : 'px-2 py-2')}>

          <button
            className={cn('sidebar-item w-full', isCollapsed && 'h-9 w-9 justify-center !px-0 !gap-0')}
            title={isCollapsed ? 'Help' : undefined}
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Help Center</span>}
          </button>

          <button
            onClick={logout}
            className={cn('sidebar-item w-full mt-0.5', isCollapsed && 'h-9 w-9 justify-center !px-0 !gap-0')}
            title={isCollapsed ? 'Sign out' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Sign out</span>}
          </button>

          {/* User row */}
          {!isCollapsed && (
            <div className="mt-2 flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#e8eaed] bg-[#f8f9fb]">
              <div className="h-7 w-7 rounded-full bg-[#0a66c2]/15 flex items-center justify-center shrink-0 text-[11px] font-bold text-[#0a66c2]">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[#1a1d23] truncate leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-[#9ca3af] truncate leading-tight">{user?.email || ''}</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="mt-1 flex justify-center">
              <div className="h-7 w-7 rounded-full bg-[#0a66c2]/15 flex items-center justify-center text-[11px] font-bold text-[#0a66c2]">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
