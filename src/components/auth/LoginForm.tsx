'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validations';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { z } from 'zod';

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm({ errorFromUrl, callbackUrl }: { errorFromUrl?: string, callbackUrl?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<{ message: string, type: 'error' | 'warning' | 'info' } | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberDevice: false
    }
  });

  useEffect(() => {
    if (errorFromUrl) {
      if (errorFromUrl === 'suspended') {
        setGlobalError({ message: 'Your account has been suspended. Please contact your agency owner.', type: 'error' });
      } else if (errorFromUrl === 'rejected') {
        setGlobalError({ message: 'Your registration was not approved.', type: 'error' });
      } else {
        setGlobalError({ message: errorFromUrl, type: 'error' });
      }
    }
  }, [errorFromUrl]);

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setGlobalError(null);

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      rememberDevice: data.rememberDevice ? 'true' : '', // signIn takes strings
      redirect: false
    });

    if (result?.error) {
      setLoading(false);
      // Parse specific errors and map them to fields or global banners
      if (result.error.includes('No account found')) {
        setError('email', { message: result.error });
      } else if (result.error.includes('Incorrect password')) {
        setError('password', { message: result.error });
      } else if (result.error.includes('Account locked')) {
        setGlobalError({ message: result.error, type: 'warning' });
      } else if (result.error.includes('pending approval')) {
        setGlobalError({ message: "Your account is pending approval. You'll receive an email once approved.", type: 'info' });
      } else if (result.error.includes('suspended')) {
        setGlobalError({ message: "Your account has been suspended. Please contact your agency owner.", type: 'error' });
      } else if (result.error.includes('rejected')) {
        setGlobalError({ message: "Your registration was not approved.", type: 'error' });
      } else if (result.error.includes('Too many login attempts from this IP')) {
        setGlobalError({ message: result.error, type: 'warning' });
      } else {
        setGlobalError({ message: result.error, type: 'error' });
      }
    } else {
      router.push(callbackUrl || '/dashboard');
      router.refresh(); // Important for middleware evaluation
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome back</h1>
        <p className="text-gray-500 text-sm">Sign in to your InsureFlow account</p>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-3 rounded-md">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">Demo: owner@insureflow.in / demo123</p>
        </div>
      )}

      {globalError && (
        <div className={`flex p-4 rounded-md space-x-3 text-sm
          ${globalError.type === 'error' ? 'bg-red-50 text-red-800 border-l-4 border-red-500 dark:bg-red-900/20 dark:text-red-200' : ''}
          ${globalError.type === 'warning' ? 'bg-amber-50 text-amber-800 border-l-4 border-amber-500 dark:bg-amber-900/20 dark:text-amber-200' : ''}
          ${globalError.type === 'info' ? 'bg-blue-50 text-blue-800 border-l-4 border-blue-500 dark:bg-blue-900/20 dark:text-blue-200' : ''}
        `}>
          <AlertCircle size={20} className="shrink-0" />
          <div className="flex-1">
            <p className="font-medium">{globalError.message}</p>
            {globalError.type === 'info' && (
              <Link href="/pending-approval" className="underline mt-1 block">View status</Link>
            )}
          </div>
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

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}`}
              {...register('password')}
            />
            <button 
              type="button" 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex items-center">
          <input 
            id="rememberDevice" 
            type="checkbox" 
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            {...register('rememberDevice')}
          />
          <label htmlFor="rememberDevice" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            Remember this device for 90 days
          </label>
        </div>

        <button 
          type="submit" 
          disabled={loading || isSubmitting}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign in'}
        </button>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:text-primary/80">
            Register here &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
