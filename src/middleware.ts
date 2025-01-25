import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req:NextRequest) {
    const path = req.nextUrl.pathname;
    
    const publicPath = path === "/login" || path === "/signup" || path === "/"
    const token = req.cookies.get('token')?.value || ''

    if(publicPath && token && path !=="/") {
        return NextResponse.redirect(new URL(`/home`,req.nextUrl))
    }
    if(!publicPath && !token) {
        return NextResponse.redirect(new URL(`/login`,req.nextUrl))
    }
    return NextResponse.next();
}
export const config = {
    matcher:[
      '/',
      '/login',
      '/signup',
      '/home',
      '/collaborate/:path*'
    ]
  }