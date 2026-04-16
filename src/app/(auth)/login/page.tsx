import LoginForm from '@/components/auth/LoginForm';
import React from 'react';

export default function LoginPage({ searchParams }: { searchParams: { error?: string, callbackUrl?: string } }) {
  return (
    <LoginForm errorFromUrl={searchParams.error} callbackUrl={searchParams.callbackUrl} />
  );
}
