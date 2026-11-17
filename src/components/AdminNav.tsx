import { logout } from "@/app/admin/actions";
import { FARM_NAME } from "@/lib/settings";

export default function AdminNav() {
  return (
    <nav className="admin-nav no-print">
      <strong>{FARM_NAME} 관리</strong>
      <a href="/admin">주문</a>
      <a href="/admin/settings">가격·계좌 설정</a>
      <a href="/admin/qr">QR 만들기</a>
      <form action={logout}><button className="link">로그아웃</button></form>
    </nav>
  );
}
