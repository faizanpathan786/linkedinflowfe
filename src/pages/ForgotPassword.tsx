import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authAPI } from '@/lib/api';
import { AuthLeftPanel } from '@/components/auth/AuthIllustration';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      await authAPI.forgotPassword(data.email);
    } catch {
      // Always show success — never reveal if email exists
    } finally {
      setSentEmail(data.email);
      setSubmitted(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f4efe6] lg:grid lg:grid-cols-2">
      <AuthLeftPanel />

      <div className="flex h-full items-center justify-center overflow-hidden bg-[#eef3f8] px-5 py-6 sm:px-10 lg:px-12">
        <div className="w-full max-w-[390px]">
          <div className="mb-6 space-y-2.5">
            {!submitted ? (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-[#595959] hover:text-[#0a66c2] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </Link>

                <h1 className="text-[32px] font-semibold tracking-tight text-[#101010] sm:text-[40px]">
                  Forgot password?
                </h1>
                <p className="max-w-md text-sm leading-6 text-[#595959]">
                  Enter your email and we'll send you a reset link.
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#a7a19a]">Password reset</p>
                <h1 className="text-[32px] font-semibold tracking-tight text-[#101010] sm:text-[40px]">
                  Check your inbox
                </h1>
                <p className="max-w-md text-sm leading-6 text-[#595959]">
                  If <span className="font-medium text-[#374151]">{sentEmail}</span> is registered, you'll receive a password reset link shortly.
                </p>
              </>
            )}
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-1.25">
                <label htmlFor="fp-email" className="block text-[13px] font-semibold text-[#374151]">
                  Email address
                </label>
                <input
                  id="fp-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                  className="w-full h-11 px-3.5 rounded-full text-sm bg-[#f3f2ee] border border-[#dce6f1] text-[#191919] placeholder:text-[#86888a] focus:outline-none focus:border-[#0a66c2] focus:ring-2 focus:ring-[#0a66c2]/20 transition-colors"
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-full text-[14px] font-semibold bg-[#0a66c2] text-white hover:bg-[#004182] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    Sending…
                  </>
                ) : (
                  <><Mail className="w-4 h-4" /> Send reset link</>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#eef3f8] border border-[#dce6f1] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-[#0a66c2]" />
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full text-[14px] font-semibold bg-[#0a66c2] text-white hover:bg-[#004182] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
              <p className="text-xs text-[#86888a]">
                Didn't receive it?{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-[#0a66c2] hover:text-[#004182] transition-colors"
                >
                  Try again
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
