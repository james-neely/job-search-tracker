import { NextRequest, NextResponse } from "next/server";
import {
  generateSessionToken,
  COOKIE_NAME,
  cookieOptions,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const authPassword = process.env.AUTH_PASSWORD;

  if (!authPassword) {
    return NextResponse.json(
      { error: "AUTH_PASSWORD not configured" },
      { status: 500 },
    );
  }

  if (password !== authPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = generateSessionToken(authPassword);
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, cookieOptions(60 * 60 * 24 * 30));

  return response;
}
