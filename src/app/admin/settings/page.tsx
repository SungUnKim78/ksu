import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { updateSettings } from "../actions";
import { isAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { saved } = await searchParams;
  const s = await getSettings();

  return (
    <main className="wrap wide">
      <AdminNav />
      <form action={updateSettings} className="card form" style={{ maxWidth: 520 }}>
        {saved && <p className="hint ok box">저장했습니다.</p>}
        <h2>가격</h2>
        <label>토마토 3kg 가격 (원)
          <input type="number" name="price_3kg" defaultValue={s.price3} min={0} step={100} inputMode="numeric" required />
        </label>
        <label>토마토 5kg 가격 (원)
          <input type="number" name="price_5kg" defaultValue={s.price5} min={0} step={100} inputMode="numeric" required />
        </label>

        <h2>입금 계좌</h2>
        <p className="hint">비워 두면 손님 화면에 “문자로 따로 안내해 드리겠습니다”라고 표시됩니다.</p>
        <label>은행
          <input name="bank_name" defaultValue={s.bankName} placeholder="예: 농협" maxLength={30} />
        </label>
        <label>계좌번호
          <input name="bank_account" defaultValue={s.bankAccount} maxLength={40} />
        </label>
        <label>예금주
          <input name="bank_holder" defaultValue={s.bankHolder} maxLength={30} />
        </label>

        <h2>판매 상태</h2>
        <label className="check">
          <input type="checkbox" name="selling" defaultChecked={s.selling} />
          <span>주문 받는 중 (끄면 손님 화면에 주문을 받지 않는다고 표시됩니다)</span>
        </label>
        <label>주문 화면 공지 <span className="opt">선택</span>
          <input name="notice" defaultValue={s.notice} placeholder="예: 매주 화·금 발송합니다" maxLength={300} />
        </label>

        <button className="btn-main">저장</button>
      </form>
    </main>
  );
}
