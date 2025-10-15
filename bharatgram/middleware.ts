import { clerkMiddleware } from "@clerk/nextjs/server"

// Protect all routes by default; allow sign-in/sign-up publicly.
export default clerkMiddleware({
  publicRoutes: ["/sign-in(.*)", "/sign-up(.*)"],
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
