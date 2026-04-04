// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	const token = request.cookies.get("token")?.value;
	const { pathname } = request.nextUrl;

	const isAuthPage = pathname === "/login" || pathname === "/register";
	const isDashboardPage = pathname.startsWith("/dashboard");

	// ✅ Authenticated user trying to access login/register → redirect to dashboard
	if (isAuthPage && token) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// ✅ Unauthenticated user trying to access dashboard → redirect to login
	if (isDashboardPage && !token) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("from", pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		"/dashboard/:path*",
		"/login",
		"/register",
		"/(auth)/:path*",
		"/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
	],
};
