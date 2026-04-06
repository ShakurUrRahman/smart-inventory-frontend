import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
	const token = request.cookies.get("token")?.value;
	const { pathname } = request.nextUrl;

	const isAuthPage = pathname === "/login" || pathname === "/register";

	// ── Auth pages — redirect logged-in users to dashboard ──────────────────
	if (isAuthPage) {
		if (token) {
			return NextResponse.redirect(new URL("/dashboard", request.url));
		}
		return NextResponse.next();
	}

	// ── All protected pages — require token ──────────────────────────────────
	if (!token) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("from", pathname);
		return NextResponse.redirect(loginUrl);
	}

	// ── If we have a token, allow the request through ──────────────────────────
	// Backend verification happens via GET /api/auth/me which uses requireAuth
	// middleware. The apiClient interceptor handles 401 responses and role-based
	// access. Frontend components check user.role and redirect as needed.
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
