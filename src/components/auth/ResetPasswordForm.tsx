'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '@/lib/validations';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CircleCheckBig } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm({ token }: { token: string }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token }
  });

  const passwordValue = watch('newPassword', '');

  const getPasswordStrength = (pw: string) => {
    if (!pw) return 0;
    let strength = 0;
    if (pw.length >= 8) strength += 1;
    if (/[A-Z]/.test(pw)) strength += 1;
    if (/[0-9]/.test(pw)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(pw)) strength += 1;
    return strength;
  };

  const strength = getPasswordStrength(passwordValue);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && redirectCountdown > 0) {
      timer = setTimeout(() => setRedirectCountdown(c => c - 1), 1000);
    } else if (step === 2 && redirectCountdown === 0) {
      router.push('/login');
    }
    return () => clearTimeout(timer);
  }, [step, redirectCountdown, router]);

  const onSubmit = async (data: ResetPasswordValues) => {
    setLoading(true);
    setErrorStr(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const resData = await res.json();
      
      if (res.status === 200) {
        setStep(2);
      } else if (res.status === 400 && resData.error) {
        if (resData.error === 'expired') {
          setErrorStr('This reset link has expired. Please request a new one.');
        } else if (resData.error === 'invalid') {
          setErrorStr('Invalid reset link.');
        } else if (resData.error === 'used') {
          setErrorStr('This reset link has already been used.');
        } else {
          setErrorStr(resData.error);
        }
      } else {
        setErrorStr('Something went wrong. Please try again.');
      }
    } catch {
      setErrorStr('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-2">
          <CircleCheckBig size={48} strokeWidth={1.5} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Password reset successfully!</h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            You can now log in with your new password.
          </p>
        </div>

        <div className="pt-2 w-full max-w-xs space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center animate-pulse">
            Redirecting in {redirectCountdown}...
          </p>
          <Link 
            href="/login" 
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors mt-4"
          >
            Go to login now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 w-full max-w-sm mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Set your new password</h1>
      </div>

      {errorStr && (
        <div className="bg-red-50 text-red-800 border-l-4 border-red-500 p-3 rounded-md dark:bg-red-900/20 dark:text-red-200 text-sm font-medium flex flex-col gap-2">
          <span>{errorStr}</span>
          {(errorStr.includes('expired') || errorStr.includes('invalid') || errorStr.includes('used')) && (
            <Link href="/forgot-password" className="underline font-semibold block mt-1">Request new link</Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Hidden token field is handled via defaultValues and schema, but we don't need a visible input */}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.newPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}`}
              {...register('newPassword')}
            />
            <button 
              type="button" 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {/* Strength Meter */}
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4].map((level) => (
              <div 
                key={level} 
                className={`h-1.5 w-full rounded-full transition-colors ${
                  strength >= level 
                    ? (strength === 1 ? 'bg-red-500' : strength === 2 ? 'bg-orange-500' : strength === 3 ? 'bg-yellow-500' : 'bg-green-500') 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>
          {errors.newPassword && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.newPassword.message}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
          <div className="relative">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}`}
              {...register('confirmPassword')}
            />
            <button 
              type="button" 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors mt-2"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Reset password'}
        </button>
      </form>
    </div>
  );
}
