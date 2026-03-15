import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "session-token";
const SESSION_PAYLOAD = "job-search-tracker-session";

async function generateExpectedToken(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(SESSION_PAYLOAD),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request: NextRequest) {
  const authPassword = process.env.AUTH_PASSWORD;
  const resumeUuidMatch = request.nextUrl.pathname.match(
    /^\/resume\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i
  );

  if (resumeUuidMatch) {
    const url = request.nextUrl.clone();
    url.pathname = "/resume-builder";
    url.searchParams.set("id", resumeUuidMatch[1]);
    return NextResponse.rewrite(url);
  }

  if (!authPassword) {
    return NextResponse.next();
  }

  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const expectedToken = await generateExpectedToken(authPassword);
    const isAuthenticated = token === expectedToken;

    if (isAuthenticated) {
      return NextResponse.next();
    }

    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|icons|manifest).*)",
  ],
};
