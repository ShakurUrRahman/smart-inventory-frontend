import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Get token from cookies
	const token = request.cookies.get("token")?.value;

	// Check if user is trying to access protected routes
	const isProtectedRoute =
		pathname.startsWith("/dashboard") ||
		pathname.startsWith("/products") ||
		pathname.startsWith("/categories") ||
		pathname.startsWith("/orders") ||
		pathname.startsWith("/restock") ||
		pathname.startsWith("/activity");

	const isAuthRoute =
		pathname.startsWith("/login") || pathname.startsWith("/register");
	const isAuthApiRoute = pathname.startsWith("/api/auth");

	// Allow API auth routes to pass through
	if (isAuthApiRoute) {
		return NextResponse.next();
	}

	// If user has token and tries to access auth routes, redirect to dashboard
	if (token && isAuthRoute) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// If user doesn't have token and tries to access protected routes, redirect to login
	if (!token && isProtectedRoute) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// Allow the request to proceed
	return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!_next/static|_next/image|favicon.ico).*)",
	],
};
