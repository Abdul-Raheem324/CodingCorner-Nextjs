import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    
    // Ignore internal next files, static assets, and api routes
    if (
        path.startsWith("/_next") ||
        path.startsWith("/api") ||
        path.startsWith("/static") ||
        path.includes(".")
    ) {
        return NextResponse.next();
    }

    const isPublicPath = path === "/login" || path === "/signup" || path === "/" || path.startsWith("/collaborate");
    const token = req.cookies.get('token')?.value || '';

    if ((path === "/login" || path === "/signup") && token) {
        return NextResponse.redirect(new URL(`/home`, req.nextUrl));
    }
    if (!isPublicPath && !token) {
        return NextResponse.redirect(new URL(`/login`, req.nextUrl));
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
      '/',
      '/login',
      '/signup',
      '/home',
      '/collaborate/:path*',
      '/ide/:path*'
    ]
}