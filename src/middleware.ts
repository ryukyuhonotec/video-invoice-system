
import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    // Allow access to public assets and api routes
    const isPublicAsset = req.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
    if (isPublicAsset) return

    // Allow access to auth api routes
    if (req.nextUrl.pathname.startsWith("/api/auth")) return

    // Allow access to invitation pages - Add this for safety if using invite links
    if (req.nextUrl.pathname.startsWith('/invite')) return

    const isLoggedIn = !!req.auth
    const isOnLoginPage = req.nextUrl.pathname.startsWith('/login')

    if (isOnLoginPage) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/', req.nextUrl))
        }
        return
    }

    if (!isLoggedIn) {
        let callbackUrl = req.nextUrl.pathname;
        if (req.nextUrl.search) {
            callbackUrl += req.nextUrl.search;
        }
        const encodedCallbackUrl = encodeURIComponent(callbackUrl);

        return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, req.nextUrl))
    }
})

export const config = {
    // Protect all routes except static assets and logic handled above
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
