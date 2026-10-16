import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic gate for the admin panel: no staff cookie, no admin pages. The real check is
 * requireStaff() in every /api/admin route; this only saves a flash of an empty panel.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("rb_staff")) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
