"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/admin/actions";

/** 주문 목록을 30초마다 새로 불러옵니다. 입력 중일 때는 건너뜁니다. */
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => {
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "SELECT")) return;
      router.refresh();
    }, 30000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}

export function PrintButton() {
  return <button type="button" className="btn-sub no-print" onClick={() => window.print()}>인쇄하기</button>;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="card form">
      <h2>관리자 로그인</h2>
      <label>비밀번호
        <input type="password" name="password" autoComplete="current-password" required autoFocus />
      </label>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn-main" disabled={pending}>로그인</button>
    </form>
  );
}
