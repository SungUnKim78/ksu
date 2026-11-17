import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

function secret(): string | null {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** 값에 서명을 붙입니다. 만료 시각(초)을 함께 담습니다. */
export function sign(value: string, maxAgeSec: number): string {
  const s = secret();
  if (!s) throw new Error("SESSION_SECRET 또는 ADMIN_PASSWORD가 필요합니다.");
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const body = Buffer.from(`${exp}:${value}`).toString("base64url");
  const mac = createHmac("sha256", s).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function unsign(signed: string | undefined): string | null {
  const s = secret();
  if (!s || !signed) return null;
  const [body, mac] = signed.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", s).update(body).digest("base64url");
  if (!safeEqual(mac, expected)) return null;
  const decoded = Buffer.from(body, "base64url").toString();
  const i = decoded.indexOf(":");
  const exp = Number(decoded.slice(0, i));
  if (!exp || exp < Date.now() / 1000) return null;
  return decoded.slice(i + 1);
}

export function newToken(): string {
  return randomBytes(16).toString("base64url");
}

const secure = process.env.NODE_ENV === "production";
export const cookieBase = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };

// ── 관리자 ─────────────────────────────────────────
const ADMIN_COOKIE = "admin_session";
const ADMIN_AGE = 60 * 60 * 24 * 14;

export function adminConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

export function checkAdminPassword(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && safeEqual(input, pw);
}

export async function startAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, sign("admin", ADMIN_AGE), { ...cookieBase, maxAge: ADMIN_AGE });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  return unsign((await cookies()).get(ADMIN_COOKIE)?.value) === "admin";
}

// ── 손님 ───────────────────────────────────────────
export const CUSTOMER_COOKIE = "ct";
export const CUSTOMER_AGE = 60 * 60 * 24 * 365;
export const KAKAO_PENDING_COOKIE = "kakao_pending";
export const KAKAO_STATE_COOKIE = "kakao_state";

export function kakaoEnabled(): boolean {
  return !!process.env.KAKAO_REST_API_KEY && !!secret();
}

export async function pendingKakaoId(): Promise<string | null> {
  return unsign((await cookies()).get(KAKAO_PENDING_COOKIE)?.value);
}
