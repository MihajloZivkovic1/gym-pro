// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Debug: Log to see what's in the token
    console.log("🔍 Middleware Debug:", {
      path,
      role: token?.role,
      email: token?.email,
      hasToken: !!token
    })

    // Protect /admin routes - only ADMIN can access
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        console.log("❌ Access denied to admin. Role:", token?.role)
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
      console.log("✅ Admin access granted")
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // This must return true for the middleware function to run
        return !!token
      }
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/staff/:path*",
    "/members/:path*",
  ]
}