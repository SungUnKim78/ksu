import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AdminClient";
import { adminConfigured, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="wrap">
      {adminConfigured() ? (
        <LoginForm />
      ) : (
        <div className="card">
          <h2>관리자 비밀번호가 설정되지 않았습니다</h2>
          <p>서버 환경변수 <code>ADMIN_PASSWORD</code>를 설정한 뒤 다시 접속해 주세요.</p>
        </div>
      )}
    </main>
  );
}
