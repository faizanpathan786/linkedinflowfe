import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LoginForm } from './components/auth/LoginForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreatePost } from './pages/CreatePost';
import { Analytics } from './pages/Analytics';
import { LinkedInVault } from './pages/LinkedInVault';
import { Posts } from './pages/Posts';
import { ContentCalendar } from './pages/ContentCalendar';
import { Ideas } from './pages/Ideas';
import { AIInterview } from './pages/AIInterview';
import Landing from './pages/Landing';
import { useAuthStore } from './store/useAuthStore';
import { useLinkedInStore } from './store/useLinkedInStore';
import LinkedInCallback from './pages/LinkedInCallback';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { UserAgreement, PrivacyPolicy, CookiePolicy, HelpCenter } from './pages/LegalPages';
import useLinkedInOAuth from '@/hooks/useLinkedInOAuth';
import { postsAPI, ideasAPI, brandVoiceAPI, queueSettingsAPI, notificationSettingsAPI, linkedInAPI } from '@/lib/api';
import { useDataStore } from '@/store/useDataStore';

function AppContent() {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();
  const { setPosts, setIdeas, hasInitializedPosts } = useLinkedInStore();
  const { setBrandVoice, setNotificationPrefs, setQueueSettings, setLinkedInProfile } = useDataStore();
  const { fetchStatus } = useLinkedInOAuth();

  // Restore session and load data on mount.
  // If a token already exists in localStorage, fire posts + LinkedIn status
  // in parallel with checkAuth so data is ready by the time the UI renders.
  useEffect(() => {
    const token =
      localStorage.getItem('auth_token') || localStorage.getItem('authToken');

    checkAuth();

    if (token) {
      postsAPI.getPosts().then((d) => setPosts(d.posts ?? [])).catch(() => {});
      ideasAPI.getAll().then((d) => { if (d.success) setIdeas(d.data); }).catch(() => {});
      brandVoiceAPI.get().then((d) => { if (d.success && d.data) setBrandVoice(d.data); }).catch(() => {});
      queueSettingsAPI.get().then((d) => { if (d.success) setQueueSettings(d.data); }).catch(() => {});
      notificationSettingsAPI.get().then((d) => { if (d.success) setNotificationPrefs(d.data); }).catch(() => {});
    }
  }, []);

  // Fallback: first login after signup — no token existed on mount,
  // so we fetch once auth is confirmed.
  useEffect(() => {
    if (!isAuthenticated || isLoading || hasInitializedPosts) return;
    postsAPI.getPosts().then((d) => setPosts(d.posts ?? [])).catch(() => {});
    ideasAPI.getAll().then((d) => { if (d.success) setIdeas(d.data); }).catch(() => {});
    brandVoiceAPI.get().then((d) => { if (d.success && d.data) setBrandVoice(d.data); }).catch(() => {});
    queueSettingsAPI.get().then((d) => { if (d.success) setQueueSettings(d.data); }).catch(() => {});
    notificationSettingsAPI.get().then((d) => { if (d.success) setNotificationPrefs(d.data); }).catch(() => {});
  }, [isAuthenticated, isLoading]);

  // Fetch LinkedIn status + profile as soon as user ID is known.
  // Runs in parallel with everything else — profile is ready before user opens the vault page.
  useEffect(() => {
    if (!user?.id) return;
    fetchStatus();
    linkedInAPI.getToken(user.id)
      .then((res) => {
        if (res?.success && res?.data) {
          const isConnected = !res.data.expires_at || new Date(res.data.expires_at) > new Date();
          if (isConnected) {
            linkedInAPI.getProfile(user.id!)
              .then((r) => { if (r?.success && r?.data) setLinkedInProfile(r.data); })
              .catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // Show full-page spinner while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          {/* Public landing page */}
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />}
          />

          {/* Public auth routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />}
          />

          {/* Auth utility routes */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Legal / info pages */}
          <Route path="/legal/user-agreement" element={<UserAgreement />} />
          <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/legal/cookie-policy" element={<CookiePolicy />} />
          <Route path="/legal/help-center" element={<HelpCenter />} />

          {/* LinkedIn OAuth callback — LinkedIn redirects here with ?code=&state= */}
          <Route path="/api/oauth/linkedin/callback" element={<LinkedInCallback />} />

          {/* Protected app routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="create-post" element={<CreatePost />} />
            <Route path="data-management" element={<Navigate to="/dashboard" replace />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="linkedin-vault" element={<LinkedInVault />} />
            <Route path="posts" element={<Posts />} />
            <Route path="content-calendar" element={<ContentCalendar />} />
            <Route path="ideas" element={<Ideas />} />
            <Route path="ai-interview" element={<AIInterview />} />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
