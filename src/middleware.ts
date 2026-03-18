import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // If a Supabase auth code lands on root, redirect to /auth/callback
  if (request.nextUrl.pathname === "/") {
    const code = request.nextUrl.searchParams.get("code");
    if (code) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/callback";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
