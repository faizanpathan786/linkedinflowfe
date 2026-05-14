import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/useAuthStore';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLeftPanel } from './AuthIllustration';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const footerLinks = ['User Agreement', 'Privacy Policy', 'Cookie Policy', 'Help Center'];

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const { setUser }  = useAuthStore();
  const navigate     = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const result = await authAPI.login(data.email, data.password);
      setUser(result.user);
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.message || 'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen dashboard-shell flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl bg-[#ffffff] rounded-3xl border border-[#e0dfdc] shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col md:flex-row">

        <AuthLeftPanel />

        {/* ── Right: form panel ── */}
        <div className="md:w-[58%] flex flex-col px-8 py-10 sm:px-12 sm:py-12 bg-[#ffffff]">

          <div className="flex-1 flex flex-col justify-center">
            <div className="w-full max-w-[360px] mx-auto">

              <h1 className="text-[30px] font-bold text-[#191919] leading-tight tracking-tight">
                Welcome back
              </h1>
              <p className="mt-1.5 mb-8 text-sm text-[#595959]">
                Sign in to your LinkedInFlow account
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="li-email" className="block text-[13px] font-semibold text-[#374151]">
                    Email or Phone
                  </label>
                  <input
                    id="li-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register('email')}
                    className="w-full h-11 px-3.5 rounded-full text-sm bg-[#f8fafc] border border-[#dce6f1] text-[#191919] placeholder:text-[#86888a] focus:outline-none focus:border-[#0a66c2] focus:ring-2 focus:ring-[#0a66c2]/20 transition-colors"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label htmlFor="li-password" className="block text-[13px] font-semibold text-[#374151]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="li-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
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

                {/* Forgot password */}
                <div className="flex justify-end -mt-1">
                  <Link to="#" className="text-[13px] font-medium text-[#0a66c2] hover:text-[#004182] hover:underline">
                    Forgot password?
                  </Link>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-11 rounded-full text-[14px] font-semibold border border-[#0a66c2] bg-[#0a66c2] text-white hover:bg-[#004182] active:bg-[#004182] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                        Signing in…
                      </>
                    ) : 'Login'}
                  </button>
                  <Link
                    to="/signup"
                    className="flex-1 h-11 rounded-full text-[14px] font-semibold border border-[#e0dfdc] bg-[#f3f2ee] text-[#191919] hover:bg-[#eef3f8] active:bg-[#eef3f8] transition-colors flex items-center justify-center"
                  >
                    Sign up
                  </Link>
                </div>

              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {footerLinks.map((item) => (
              <Link key={item} to="#" className="text-[11px] text-[#86888a] hover:text-[#595959] hover:underline">
                {item}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
