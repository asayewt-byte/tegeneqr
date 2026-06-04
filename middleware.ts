import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/admin', '/cashier'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (!isProtected) return NextResponse.next();

  const session = request.cookies.get('session')?.value;
  if (session) {
    try {
      const binary = atob(session);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      const data = JSON.parse(json);
      if (data.exp > Date.now()) return NextResponse.next();
    } catch {}
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: ['/admin/:path*', '/cashier/:path*'],
};
