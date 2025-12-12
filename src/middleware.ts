import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getUserRole(request: NextRequest): string | undefined {
  const userCookie = request.cookies.get('user')?.value;
  const roleCookie = request.cookies.get('role')?.value;
  console.log(userCookie);
  console.log(roleCookie);
  let role: string | undefined;

  if (userCookie) {
    try {
      const parsed = JSON.parse(userCookie);
      role = (parsed as any)?.role || (parsed as any)?.userRole;
    } catch {
      console.log('Failed to parse user cookie');
    }
  }

  if (!role && roleCookie) {
    role = roleCookie;
  }

  return role;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userCookie = request.cookies.get('user')?.value;
  const isLoggedIn = !!userCookie;

  // Protect orders and event order routes
  if (pathname.startsWith('/orders') || pathname.includes('/events/') && pathname.endsWith('/order')) {
    if (!isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect organizers dashboard
  if (pathname.startsWith('/organizers')) {
    const role = getUserRole(request);

    if (role !== 'organizer') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect admin dashboard (except the login page itself)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const role = getUserRole(request);
    console.log(role);

    if (role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/orders',
    '/orders/:path*',
    '/events/:id/order',
    '/organizers/:path*',
    '/admin',
    '/admin/:path*'
  ],
};