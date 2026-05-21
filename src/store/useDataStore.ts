import { create } from 'zustand';
import type { NotificationPreferences } from '@/lib/api';

interface SheetConnection {
  spreadsheetId: string;
  sheetName: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

interface BrandVoice {
  tone?: string;
  style?: string;
  examples?: string;
}

export interface LinkedInProfile {
  firstName?: string;
  lastName?: string;
  headline?: string;
  pictureUrl?: string;
  vanityName?: string;
  personUrn?: string;
}

interface QueueSettings {
  days: number[];
  time: string;
}

interface DataState {
  sheetConnection: SheetConnection | null;
  sheetData: any[];
  isLoading: boolean;
  error: string | null;
  // Pre-fetched page data
  brandVoice: BrandVoice | null;
  notificationPrefs: NotificationPreferences | null;
  queueSettings: QueueSettings | null;
  linkedInProfile: LinkedInProfile | null;
  // AI Interview persisted state
  aiAnswers: { q1: string; q2: string; q3: string; q4: string; q5: string };
  aiStyle: 'story' | 'opinion' | 'insight';
  aiVariations: Array<{ type: string; content: string; hook: string }> | null;
  // Setters
  setSheetConnection: (connection: SheetConnection) => void;
  setSheetData: (data: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setBrandVoice: (bv: BrandVoice) => void;
  setNotificationPrefs: (prefs: NotificationPreferences) => void;
  setQueueSettings: (qs: QueueSettings) => void;
  setLinkedInProfile: (profile: LinkedInProfile | null) => void;
  setAIAnswers: (answers: { q1: string; q2: string; q3: string; q4: string; q5: string }) => void;
  setAIStyle: (style: 'story' | 'opinion' | 'insight') => void;
  setAIVariations: (v: Array<{ type: string; content: string; hook: string }> | null) => void;
}

export const useDataStore = create<DataState>((set) => ({
  sheetConnection: null,
  sheetData: [],
  isLoading: false,
  error: null,
  brandVoice: null,
  notificationPrefs: null,
  queueSettings: null,
  linkedInProfile: null,
  aiAnswers: { q1: '', q2: '', q3: '', q4: '', q5: '' },
  aiStyle: 'story',
  aiVariations: null,
  setSheetConnection: (connection) => set({ sheetConnection: connection }),
  setSheetData: (data) => set({ sheetData: data }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setBrandVoice: (bv) => set({ brandVoice: bv }),
  setNotificationPrefs: (prefs) => set({ notificationPrefs: prefs }),
  setQueueSettings: (qs) => set({ queueSettings: qs }),
  setLinkedInProfile: (profile) => set({ linkedInProfile: profile }),
  setAIAnswers: (answers) => set({ aiAnswers: answers }),
  setAIStyle: (style) => set({ aiStyle: style }),
  setAIVariations: (v) => set({ aiVariations: v }),
}));
