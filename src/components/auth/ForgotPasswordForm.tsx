'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '@/lib/validations';
import { Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [errorStr, setErrorStr] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const emailValue = watch('email');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const onSubmit = async (data: ForgotPasswordValues) => {
    setLoading(true);
    setErrorStr(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.status === 429) {
        setErrorStr("You've requested too many resets. Try again in 1 hour.");
      } else {
        // ALWAYS advance to step 2 to prevent enumeration
        setStep(2);
        setCountdown(60);
        setCanResend(false);
      }
    } catch {
      setErrorStr("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-2">
          <Mail size={48} strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Check your inbox</h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            We&apos;ve sent a password reset link to <span className="font-medium text-gray-900 dark:text-white">{emailValue}</span>. The link expires in 1 hour.
          </p>
        </div>

        <div className="pt-2 w-full max-w-xs space-y-3">
          <button
            onClick={() => onSubmit({ email: emailValue })}
            disabled={!canResend || loading}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            {canResend ? 'Resend email' : `Resend available in ${countdown}s`}
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Didn&apos;t receive it? Check your spam folder or <Link href="/login" className="text-primary hover:text-primary/80">return to login</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 w-full max-w-sm mx-auto">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Reset your password</h1>
        <p className="text-gray-500 text-sm">Enter your email and we&apos;ll send you a link to reset your password.</p>
      </div>

      {errorStr && (
        <div className="bg-red-50 text-red-800 border-l-4 border-red-500 p-3 rounded-md dark:bg-red-900/20 dark:text-red-200 text-sm font-medium">
          {errorStr}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
          <input
            type="email"
            autoComplete="email"
            autoFocus
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}`}
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors mt-2"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Send reset link'}
        </button>
      </form>

      <div className="text-center">
        <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          &larr; Back to login
        </Link>
      </div>
    </div>
  );
}
