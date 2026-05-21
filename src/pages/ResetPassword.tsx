import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authAPI } from '@/lib/api';
import { AuthLeftPanel } from '@/components/auth/AuthIllustration';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Invalid or missing reset token. Please request a new link.');
      return;
    }
    try {
      setIsLoading(true);
      await authAPI.resetPassword(token, data.password);
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch {
      setInvalidToken(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#eef3f8]">
        <div className="text-center max-w-sm px-6">
          <p className="text-[#191919] font-semibold mb-2">Invalid reset link</p>
          <p className="text-sm text-[#595959] mb-6">This link is missing a token. Please request a new password reset.</p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center h-10 px-5 rounded-full text-sm font-semibold bg-[#0a66c2] text-white hover:bg-[#004182] transition-colors"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden dashboard-shell flex items-center justify-center sm:p-6 md:p-8">
      <div className="w-full max-w-5xl h-full sm:h-auto bg-white sm:rounded-3xl border-0 sm:border border-[#e0dfdc] shadow-none sm:shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col md:flex-row">

        <AuthLeftPanel tagline="Set a new password and get back in." />

        <div className="flex-1 min-h-0 md:w-[58%] flex flex-col px-6 py-4 sm:px-12 sm:py-12 bg-white overflow-hidden">
          <div className="flex-1 flex flex-col justify-center">
            <div className="w-full max-w-[360px] mx-auto">

              {invalidToken ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#191919] mb-2">Link expired</h2>
                  <p className="text-sm text-[#595959] mb-8">
                    This reset link is invalid or has expired. Reset links are valid for 1 hour.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="inline-flex items-center h-11 px-6 rounded-full text-[14px] font-semibold bg-[#0a66c2] text-white hover:bg-[#004182] transition-colors"
                  >
                    Request a new link
                  </Link>
                </div>
              ) : !success ? (
                <>
                  <h1 className="text-[30px] font-bold text-[#191919] leading-tight tracking-tight">
                    Set new password
                  </h1>
                  <p className="mt-1.5 mb-8 text-sm text-[#595959]">
                    Choose a strong password — at least 6 characters.
                  </p>

                  <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

                    {/* New password */}
                    <div className="space-y-1.5">
                      <label htmlFor="rp-password" className="block text-[13px] font-semibold text-[#374151]">
                        New password
                      </label>
                      <div className="relative">
                        <input
                          id="rp-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min. 6 characters"
                          autoComplete="new-password"
                          autoFocus
                          {...register('password')}
                          className="w-full h-11 px-3.5 pr-11 rounded-full text-sm bg-[#f8fafc] border border-[#dce6f1] text-[#191919] placeholder:text-[#86888a] focus:outline-none focus:border-[#0a66c2] focus:ring-2 focus:ring-[#0a66c2]/20 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86888a] hover:text-[#191919] transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-xs text-red-500">{errors.password.message}</p>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-1.5">
                      <label htmlFor="rp-confirm" className="block text-[13px] font-semibold text-[#374151]">
                        Confirm password
                      </label>
                      <div className="relative">
                        <input
                          id="rp-confirm"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Repeat your password"
                          autoComplete="new-password"
                          {...register('confirm')}
                          className="w-full h-11 px-3.5 pr-11 rounded-full text-sm bg-[#f8fafc] border border-[#dce6f1] text-[#191919] placeholder:text-[#86888a] focus:outline-none focus:border-[#0a66c2] focus:ring-2 focus:ring-[#0a66c2]/20 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86888a] hover:text-[#191919] transition-colors"
                          aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirm && (
                        <p className="text-xs text-red-500">{errors.confirm.message}</p>
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
                          Updating…
                        </>
                      ) : 'Update password'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#eef3f8] border border-[#dce6f1] flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-8 h-8 text-[#0a66c2]" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#191919] mb-2">Password updated!</h2>
                  <p className="text-sm text-[#595959] mb-6">
                    Redirecting you to login…
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center h-10 px-5 rounded-full text-sm font-semibold bg-[#0a66c2] text-white hover:bg-[#004182] transition-colors"
                  >
                    Go to login
                  </Link>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
