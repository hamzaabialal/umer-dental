import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: bounces visitors without a session cookie to /login.
// Real verification happens in requireUser() on every page and action.
const PUBLIC = [/^\/login/, /^\/a\//, /^\/i\//, /^\/r\//, /^\/api\/calendar\//];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((re) => re.test(pathname))) return NextResponse.next();
  if (!request.cookies.has("udc_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)"],
};
