import { NextResponse, type NextRequest } from "next/server";
import {
  CUSTOMER_AGE,
  CUSTOMER_COOKIE,
  KAKAO_PENDING_COOKIE,
  KAKAO_STATE_COOKIE,
  cookieBase,
  kakaoEnabled,
  sign,
  unsign,
} from "@/lib/auth";
import { customerByToken, query } from "@/lib/db";
import { siteUrl } from "@/lib/site";

async function kakaoUserId(code: string, redirectUri: string): Promise<string | null> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.KAKAO_REST_API_KEY!,
    redirect_uri: redirectUri,
    code,
  });
  if (process.env.KAKAO_CLIENT_SECRET) body.set("client_secret", process.env.KAKAO_CLIENT_SECRET);

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });
  if (!tokenRes.ok) return null;
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) return null;

  const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!meRes.ok) return null;
  const me = (await meRes.json()) as { id?: number };
  return me.id ? String(me.id) : null;
}

export async function GET(req: NextRequest) {
  const base = await siteUrl();
  const home = NextResponse.redirect(`${base}/`);
  if (!kakaoEnabled()) return home;

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const saved = unsign(req.cookies.get(KAKAO_STATE_COOKIE)?.value);
  if (!code || !state || !saved) return home;
  const [nonce, link] = saved.split("|");
  if (nonce !== state) return home;

  const kakaoId = await kakaoUserId(code, `${base}/auth/kakao/callback`).catch(() => null);
  if (!kakaoId) return home;

  const remember = (res: NextResponse, token: string) => {
    res.cookies.set(CUSTOMER_COOKIE, token, { ...cookieBase, maxAge: CUSTOMER_AGE });
    res.cookies.delete(KAKAO_STATE_COOKIE);
    return res;
  };

  // 이미 연결된 손님이면 바로 재주문 화면으로
  const [existing] = await query<{ token: string }>("SELECT token FROM customers WHERE kakao_id=$1", [kakaoId]);
  if (existing) return remember(NextResponse.redirect(`${base}/r/${existing.token}`), existing.token);

  // 주문 내역 화면에서 "카카오 계정 연결하기"를 누른 경우
  const target = link ? await customerByToken(link) : null;
  if (target) {
    await query("UPDATE customers SET kakao_id=$1 WHERE id=$2 AND kakao_id IS NULL", [kakaoId, target.id]);
    return remember(NextResponse.redirect(`${base}/my/${target.token}?linked=1`), target.token);
  }

  // 처음 오신 분: 첫 주문 때 카카오 계정을 함께 저장
  home.cookies.set(KAKAO_PENDING_COOKIE, sign(kakaoId, 1800), { ...cookieBase, maxAge: 1800 });
  home.cookies.delete(KAKAO_STATE_COOKIE);
  return home;
}
