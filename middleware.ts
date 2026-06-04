import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('qr_session')?.value;
  const isQRTokenRoute = pathname.startsWith('/a/');
  const isMenuRoute = pathname.startsWith('/menu/');
  const isOrderApiPost = pathname === '/api/orders' && request.method === 'POST';

  if (isQRTokenRoute) {
    return NextResponse.next();
  }

  if (isMenuRoute) {
    const token = pathname.split('/menu/')[1];
    if (!token || sessionToken !== token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (isOrderApiPost) {
    if (!sessionToken) {
      return NextResponse.json({ error: 'QR session required' }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/menu/:path*', '/a/:path*', '/api/orders'],
}
