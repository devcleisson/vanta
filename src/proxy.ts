import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every matched request:
 *  1. Refreshes the Supabase session cookie (when Supabase Auth is configured).
 *  2. Sends anonymous visitors of /account and /admin to the login page.
 * Authorisation (admin role) is enforced again on the server in layouts and actions.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  let signedIn = false;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anon) {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } else {
    signedIn = request.cookies.has("vanta_session");
  }

  const { pathname, search } = request.nextUrl;
  const isProtected = pathname.startsWith("/account") || pathname.startsWith("/admin");
  if (isProtected && !signedIn) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images/|uploads/|favicon.ico|robots.txt|sitemap.xml|api/stripe/webhook).*)"],
};
