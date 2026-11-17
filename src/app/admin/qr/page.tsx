import QRCode from "qrcode";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { PrintButton } from "@/components/AdminClient";
import { isAdmin } from "@/lib/auth";
import { FARM_NAME } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminQr({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { code } = await searchParams;
  const batch = (code ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 30);
  const url = `${await siteUrl()}/${batch ? `?b=${batch}` : ""}`;
  const qr = await QRCode.toDataURL(url, { width: 600, margin: 1, errorCorrectionLevel: "M" });

  return (
    <main className="wrap wide">
      <AdminNav />
      <form className="card form no-print" style={{ maxWidth: 520 }}>
        <h2>동봉용 QR 만들기</h2>
        <label>발송 구분 코드 <span className="opt">선택 · 영문과 숫자</span>
          <input name="code" defaultValue={batch} placeholder="예: 2026-11-A" maxLength={30} />
        </label>
        <p className="hint">코드를 넣으면 어느 발송분의 안내지에서 주문이 들어왔는지 주문 화면에서 확인할 수 있습니다.</p>
        <button className="btn-main">QR 만들기</button>
      </form>

      <section className="qr-sheet">
        <p className="farm">{FARM_NAME}</p>
        <h2>토마토, 다음에는 여기서 바로 주문하세요</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="주문 페이지 QR 코드" />
        <p>휴대폰 카메라로 QR을 비추면 주문 페이지가 열립니다.<br />3kg · 5kg 무료배송</p>
      </section>

      <div className="row no-print" style={{ marginTop: 16 }}>
        <PrintButton />
        <a className="btn-sub" href={qr} download={`qr-${batch || "order"}.png`} style={{ lineHeight: "48px" }}>QR 이미지 저장</a>
      </div>
      <p className="muted no-print">연결 주소: {url}</p>
    </main>
  );
}
