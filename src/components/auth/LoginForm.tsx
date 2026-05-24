import { useState, useEffect } from 'react';
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

const footerLinks = [
  { label: 'User Agreement',  to: '/legal/user-agreement' },
  { label: 'Privacy Policy',  to: '/legal/privacy-policy' },
  { label: 'Cookie Policy',   to: '/legal/cookie-policy'  },
  { label: 'Help Center',     to: '/legal/help-center'    },
];

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const { setUser }  = useAuthStore();
  const navigate     = useNavigate();

  useEffect(() => {
    // Ensure pressing back always returns to the landing page,
    // regardless of how the user arrived at /login (direct URL, redirect, etc.)
    window.history.replaceState(null, '', '/');
    window.history.pushState(null, '', '/login');
  }, []);

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
    <div className="h-screen overflow-hidden bg-[#f4efe6] lg:grid lg:grid-cols-2">
      <AuthLeftPanel />

      <div className="flex h-full items-center justify-center overflow-hidden bg-[#eef3f8] px-5 py-6 sm:px-10 lg:px-12">
        <div className="w-full max-w-[390px]">
          <div className="mb-6 space-y-2.5">
            <h1 className="text-[32px] font-semibold tracking-tight text-[#101010] sm:text-[40px]">
              Welcome back
            </h1>
            <p className="max-w-md text-sm leading-6 text-[#595959]">
              Sign in to your LinkedInFlow account and continue building your content system.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

                {/* Email */}
                <div className="space-y-1.25">
                  <label htmlFor="li-email" className="block text-[13px] font-semibold text-[#374151]">
                    Email or Phone
                  </label>
                  <input
                    id="li-email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register('email')}
                    className="w-full h-11 px-3.5 rounded-full text-sm bg-[#e5e7eb] border border-[#dce6f1] text-[#191919] placeholder:text-[#86888a] focus:outline-none focus:border-[#9ca3af] focus:ring-2 focus:ring-[#9ca3af]/30 transition-colors [&:-webkit-autofill]:shadow-[0_0_0_1000px_#e5e7eb_inset] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#e5e7eb_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#191919]"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.25">
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
                      className="w-full h-11 px-3.5 pr-11 rounded-full text-sm bg-[#e5e7eb] border border-[#dce6f1] text-[#191919] placeholder:text-[#86888a] focus:outline-none focus:border-[#9ca3af] focus:ring-2 focus:ring-[#9ca3af]/30 transition-colors [&:-webkit-autofill]:shadow-[0_0_0_1000px_#e5e7eb_inset] [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_#e5e7eb_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#191919]"
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
                  <Link to="/forgot-password" className="text-[13px] font-medium text-[#0a66c2] hover:text-[#004182] hover:underline">
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

          <div className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {footerLinks.map((item) => (
              <Link key={item.label} to={item.to} className="text-[11px] text-[#86888a] hover:text-[#595959] hover:underline">
                {item.label}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
