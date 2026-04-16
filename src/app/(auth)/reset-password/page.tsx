import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { redirect } from 'next/navigation';
import React from 'react';

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string } }) {
  if (!searchParams.token) {
    redirect('/forgot-password');
  }

  return <ResetPasswordForm token={searchParams.token} />;
}
