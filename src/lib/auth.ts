import { createHmac } from "crypto";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const COOKIE_NAME = "session-token";
const SESSION_PAYLOAD = "job-search-tracker-session";

export function generateSessionToken(password: string): string {
  return createHmac("sha256", password).update(SESSION_PAYLOAD).digest("hex");
}

export function isValidSessionToken(
  token: string,
  password: string,
): boolean {
  return token === generateSessionToken(password);
}

export function cookieOptions(
  maxAge?: number,
): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}
