import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

const PROTECTED_PATHS = ["/session", "/dashboard", "/admin"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const url = req.nextUrl.clone();
  const path = url.pathname;

  /* ---------------------------------------------------------
     0. IGNORE ROUTES THAT MUST NOT BE PROTECTED
  --------------------------------------------------------- */
  if (
    path.startsWith("/auth") ||
    path.startsWith("/auth/callback") ||
    path.includes(".") ||
    path.startsWith("/_next")
  ) {
    return res;
  }

  /* ---------------------------------------------------------
     1. PROTECTED ROUTES
  --------------------------------------------------------- */
  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));
  if (!isProtected) return res;

  /* ---------------------------------------------------------
     2. INITIALIZE SUPABASE MIDDLEWARE CLIENT
  --------------------------------------------------------- */
  const supabase = createMiddlewareClient(
    { req, res },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    }
  );

  /* ---------------------------------------------------------
     3. GET SESSION — MAY BE NULL ON FIRST INCÓGNITO REQUEST
  --------------------------------------------------------- */
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // IMPORTANT:
  // If session is null on FIRST LOAD in incognito → DO NOT redirect.
  // Allow layout/page to load so Supabase can attach the cookie afterwards.
  if (!session) {
    console.log("⚠️ No session yet (incognito first load) → allow request");
    return res;
  }

  /* ---------------------------------------------------------
     4. ONBOARDING CHECK — ONLY IF SESSION EXISTS
  --------------------------------------------------------- */
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed && path !== "/onboarding") {
    console.log("➡️ Redirecting to onboarding (profile incomplete)");
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  /* ---------------------------------------------------------
     5. ALLOW ACCESS
  --------------------------------------------------------- */
  res.headers.set("x-user-id", session.user.id);
  return res;
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};