import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { earlyAccessAPI } from '@/lib/api';
import { AuthLeftPanel } from '@/components/auth/AuthIllustration';

export default function Signup() {
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    try {
      setLoading(true);
      await earlyAccessAPI.submit(trimmed);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f4efe6] lg:grid lg:grid-cols-2">
      <AuthLeftPanel />

      <div className="flex h-full items-center justify-center overflow-hidden bg-[#eef3f8] px-5 py-6 sm:px-10 lg:px-12">
        <div className="w-full max-w-[390px]">

          {submitted ? (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0a66c2]/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#0a66c2]" />
              </div>
              <h1 className="text-2xl font-semibold text-[#101010]">You're on the list!</h1>
              <p className="text-sm text-[#595959] leading-relaxed">
                We'll reach out to <span className="font-medium text-[#191919]">{email}</span> personally to get you set up.
              </p>
              <Link to="/" className="text-sm text-[#0a66c2] hover:text-[#004182] hover:underline mt-2">
                Back to home
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 space-y-2.5">
                <h1 className="text-[32px] font-semibold tracking-tight text-[#101010] sm:text-[40px]">
                  Request
                  <span className="block text-[#0a66c2]">early access</span>
                </h1>
                <p className="max-w-md text-sm leading-6 text-[#595959]">
                  LinkedInFlow is currently invite-only. Drop your email and we'll reach out personally to get you set up.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-1.25">
                  <label htmlFor="ea-email" className="block text-[13px] font-semibold text-[#374151]">
                    Email
                  </label>
                  <input
                    id="ea-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full h-11 px-3.5 rounded-full text-sm bg-[#f3f2ee] border border-[#dce6f1] text-[#191919] placeholder:text-[#86888a] focus:outline-none focus:border-[#0a66c2] focus:ring-2 focus:ring-[#0a66c2]/20 transition-colors disabled:opacity-60"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-11 rounded-full text-[14px] font-semibold border border-[#0a66c2] bg-[#0a66c2] text-white hover:bg-[#004182] active:bg-[#004182] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Get Early Access <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                  <Link
                    to="/login"
                    className="flex-1 h-11 rounded-full text-[14px] font-semibold border border-[#e0dfdc] bg-[#f3f2ee] text-[#191919] hover:bg-[#eef3f8] active:bg-[#eef3f8] transition-colors flex items-center justify-center"
                  >
                    Sign in
                  </Link>
                </div>
              </form>

              <p className="mt-5 text-center text-[12px] text-[#86888a]">
                No spam. No credit card. We'll reach out personally.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/*
 * Original signup form commented out — app is invite-only (early access).
 * Restore when payment/open registration is ready.
 *
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const signupSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
 * ... full form implementation preserved in git history
 */
