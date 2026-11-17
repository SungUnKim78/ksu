import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { KAKAO_STATE_COOKIE, cookieBase, kakaoEnabled, sign } from "@/lib/auth";
import { siteUrl } from "@/lib/site";

/** 카카오 로그인 시작. ?link=<손님 토큰>이 있으면 그 손님에게 카카오 계정을 연결합니다. */
export async function GET(req: NextRequest) {
  const base = await siteUrl();
  if (!kakaoEnabled()) return NextResponse.redirect(`${base}/`);

  const link = (req.nextUrl.searchParams.get("link") ?? "").replace(/[^A-Za-z0-9_-]/g, "");
  const nonce = randomBytes(12).toString("base64url");
  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", process.env.KAKAO_REST_API_KEY!);
  url.searchParams.set("redirect_uri", `${base}/auth/kakao/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", nonce);

  const res = NextResponse.redirect(url);
  res.cookies.set(KAKAO_STATE_COOKIE, sign(`${nonce}|${link}`, 600), { ...cookieBase, maxAge: 600 });
  return res;
}
