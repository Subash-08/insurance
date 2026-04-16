import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/register', '/register/success', '/forgot-password', '/reset-password', '/pending-approval'];
const AUTH_ROUTES = ['/login', '/register'];
const OWNER_ONLY_ROUTES = ['/settings/team', '/settings/agency', '/settings/billing'];

/*
ROUTE ACCESS MATRIX
Route                    | Owner | Employee | Notes
-------------------------|-------|----------|------------------
/dashboard               | YES   | YES      | Different content per role
/clients                 | YES   | YES      | Employee sees own only
/clients/[id]            | YES   | YES*     | Employee only if they added it
/policies                | YES   | YES      | Employee sees own only
/premiums                | YES   | YES      | Employee sees own only
/claims                  | YES   | YES      | Employee sees own only
/leads                   | YES   | YES      | Employee sees own only
/reminders               | YES   | YES      | Employee sees own only
/reports                 | YES   | YES      | Employee sees own data only
/reports/analytics       | YES   | NO       | Owner only — full agency analytics
/settings                | YES   | YES*     | Employee: profile only
/settings/team           | YES   | NO       | Owner only
/settings/agency         | YES   | NO       | Owner only
/settings/insurers       | YES   | NO       | Owner only
/settings/templates      | YES   | YES      | Both can use templates
/settings/profile        | YES   | YES      | Own profile only
/api/owner/*             | YES   | NO       | Owner-only APIs
*/

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const pathname = req.nextUrl.pathname;

  // 3. ALLOW: /api/auth/* — always pass through
  if (pathname.startsWith('/api/auth/')) {
    return addSecurityHeaders(NextResponse.next());
  }

  // 4. ALLOW: /api/n8n/* — pass through but must have N8N_WEBHOOK_SECRET
  if (pathname.startsWith('/api/n8n/')) {
    const authHeader = req.headers.get('Authorization') || req.headers.get('x-n8n-webhook-secret');
    if (!authHeader || authHeader !== process.env.N8N_WEBHOOK_SECRET) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // 5. PUBLIC ASSET CHECK
  if (pathname.startsWith('/_next/') || pathname.includes('/favicon') || pathname.startsWith('/public/')) {
    return NextResponse.next();
  }

  // 6. AUTH_ROUTES check
  if (AUTH_ROUTES.includes(pathname) && token && token.status === 'active') {
    return addSecurityHeaders(NextResponse.redirect(new URL('/dashboard', req.url)));
  }

  // 7. Protected roots
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/') || pathname.startsWith('/settings') || pathname.startsWith('/reports') || pathname.startsWith('/clients') || pathname.startsWith('/policies')) {
    
    // a. No token
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
      return addSecurityHeaders(NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url)));
    }

    // b. pending_approval
    if (token.status === 'pending_approval' && !PUBLIC_ROUTES.includes(pathname)) {
      if (pathname.startsWith('/api/')) return new NextResponse(JSON.stringify({ error: 'Pending approval' }), { status: 403 });
      return addSecurityHeaders(NextResponse.redirect(new URL('/pending-approval', req.url)));
    }

    // c. suspended
    if (token.status === 'suspended' && !PUBLIC_ROUTES.includes(pathname)) {
      if (pathname.startsWith('/api/')) return new NextResponse(JSON.stringify({ error: 'Suspended' }), { status: 403 });
      return addSecurityHeaders(NextResponse.redirect(new URL('/login?error=suspended', req.url)));
    }

    // d. rejected
    if (token.status === 'rejected' && !PUBLIC_ROUTES.includes(pathname)) {
      if (pathname.startsWith('/api/')) return new NextResponse(JSON.stringify({ error: 'Rejected' }), { status: 403 });
      return addSecurityHeaders(NextResponse.redirect(new URL('/login?error=rejected', req.url)));
    }

    // e. non-active fallback
    if (token.status !== 'active' && !PUBLIC_ROUTES.includes(pathname)) {
      if (pathname.startsWith('/api/')) return new NextResponse(JSON.stringify({ error: 'Not active' }), { status: 403 });
      return addSecurityHeaders(NextResponse.redirect(new URL('/login', req.url)));
    }

    // f. OWNER_ONLY check
    const isOwnerRoute = OWNER_ONLY_ROUTES.some(r => pathname.startsWith(r)) || pathname.startsWith('/api/owner/');
    if (isOwnerRoute && token.role !== 'owner') {
      if (pathname.startsWith('/api/')) return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      return addSecurityHeaders(NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url)));
    }

    // g. API routes -> attach headers
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-user-id', token.id as string);
      requestHeaders.set('x-user-role', token.role as string);
      requestHeaders.set('x-user-status', token.status as string);

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      return addSecurityHeaders(response);
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https://res.cloudinary.com; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://res.cloudinary.com;");
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)']
};
