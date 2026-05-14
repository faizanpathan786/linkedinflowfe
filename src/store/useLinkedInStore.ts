import { create } from 'zustand';
import type { Post } from '@/lib/api';

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface LinkedInStatusData {
  vanityName: string;
  personUrn: string;
  profile: object;
  expiresAt: string;
  connectedAt: string;
}

interface LinkedInStatus {
  isConnected: boolean;
  isExpired: boolean;
  data?: LinkedInStatusData;
}

interface LinkedInState {
  linkedInStatus: LinkedInStatus | null;
  posts: Post[];
  notifications: AppNotification[];
  isLoading: boolean;
  isCreatePostOpen: boolean;
  hasInitializedPosts: boolean;
  // LinkedIn status
  setLinkedInStatus: (status: LinkedInStatus) => void;
  clearLinkedInStatus: () => void;
  // Posts
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  removePost: (id: string) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & { read?: boolean }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  // Loading
  setLoading: (loading: boolean) => void;
  // Create post modal
  openCreatePost: () => void;
  closeCreatePost: () => void;
}

function createNotificationFromPost(post: Post): Omit<AppNotification, 'id' | 'createdAt' | 'read'> | null {
  const preview = post.content.length > 80 ? `${post.content.slice(0, 80).trimEnd()}…` : post.content;

  if (post.status === 'published') {
    return { type: 'success', title: 'Post published', message: preview };
  }

  if (post.status === 'failed') {
    return {
      type: 'error',
      title: 'Post failed',
      message: post.failure_reason || post.error_message || post.error || 'Publishing failed.',
    };
  }

  if (post.status === 'draft') {
    return { type: 'info', title: 'Post saved as draft', message: preview };
  }

  if (post.status === 'scheduled') {
    const when = post.scheduled_at
      ? new Date(post.scheduled_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      : 'a future time';
    return { type: 'info', title: 'Post scheduled', message: `Sends on ${when} — ${preview}` };
  }

  return null;
}

function pushNotificationsForTransitions(previousPosts: Post[], nextPosts: Post[]): AppNotification[] {
  const previousById = new Map(previousPosts.map((post) => [post.id, post]));
  const notifications: AppNotification[] = [];

  nextPosts.forEach((post) => {
    const previous = previousById.get(post.id);
    if (!previous || previous.status === post.status) return;
    const notification = createNotificationFromPost(post);
    if (!notification) return;

    notifications.push({
      id: `${post.id}-${post.status}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    });
  });

  return notifications;
}

export const useLinkedInStore = create<LinkedInState>((set) => ({
  linkedInStatus: null,
  posts: [],
  notifications: [],
  isLoading: false,
  isCreatePostOpen: false,
  hasInitializedPosts: false,

  setLinkedInStatus: (status) => set({ linkedInStatus: status }),
  clearLinkedInStatus: () => set({ linkedInStatus: null }),

  setPosts: (posts) => set((state) => {
    if (!state.hasInitializedPosts) {
      return { posts, hasInitializedPosts: true };
    }

    const notifications = pushNotificationsForTransitions(state.posts, posts);
    return {
      posts,
      notifications: notifications.length > 0 ? [...notifications, ...state.notifications] : state.notifications,
    };
  }),
  addPost: (post) => set((state) => {
    const notifications = createNotificationFromPost(post);
    return {
      posts: [post, ...state.posts],
      notifications: notifications
        ? [{
            id: `${post.id}-${post.status}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            read: false,
            ...notifications,
          }, ...state.notifications]
        : state.notifications,
    };
  }),
  removePost: (id) => set((state) => ({ posts: state.posts.filter((p) => p.id !== id) })),
  addNotification: (notification) => set((state) => ({
    notifications: [{
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      read: notification.read ?? false,
      ...notification,
    }, ...state.notifications],
  })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),
  markAllNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
  })),
  clearNotifications: () => set({ notifications: [] }),

  setLoading: (loading) => set({ isLoading: loading }),

  openCreatePost:  () => set({ isCreatePostOpen: true }),
  closeCreatePost: () => set({ isCreatePostOpen: false }),
}));
