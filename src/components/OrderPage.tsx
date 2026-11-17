import OrderForm from "./OrderForm";
import { forgetMe } from "@/app/actions";
import { kakaoEnabled } from "@/lib/auth";
import { query, type Customer } from "@/lib/db";
import { FARM_NAME, getSettings } from "@/lib/settings";

function Tomato() {
  return (
    <svg viewBox="0 0 120 120" width="96" height="96" aria-hidden="true">
      <ellipse cx="60" cy="68" rx="44" ry="40" fill="#e5412d" />
      <ellipse cx="44" cy="54" rx="12" ry="8" fill="#fff" opacity=".25" />
      <path d="M60 32c-6-10-18-10-24-6 8 2 12 6 14 10-8-2-16 2-18 8 8-4 18-2 28-4 10 2 20 0 28 4-2-6-10-10-18-8 2-4 6-8 14-10-6-4-18-4-24 6z" fill="#3c8a3f" />
      <rect x="57" y="16" width="6" height="16" rx="3" fill="#2f6e32" />
    </svg>
  );
}

export default async function OrderPage({ customer, source, kakaoPending }: {
  customer: Customer | null;
  source: string;
  kakaoPending: boolean;
}) {
  const settings = await getSettings();
  let qty3 = 1;
  let qty5 = 0;
  if (customer) {
    const last = await query<{ qty_3kg: number; qty_5kg: number }>(
      "SELECT qty_3kg, qty_5kg FROM orders WHERE customer_id=$1 ORDER BY id DESC LIMIT 1",
      [customer.id],
    );
    if (last[0]) ({ qty_3kg: qty3, qty_5kg: qty5 } = last[0]);
  }

  return (
    <main className="wrap">
      <header className="hero">
        <Tomato />
        <p className="farm">{FARM_NAME}</p>
        <h1>{customer ? `${customer.name}님, 다시 찾아 주셔서 감사합니다` : "농장에서 바로 보내 드리는 토마토"}</h1>
        <p className="lead">주문하시면 수확해서 바로 보내 드립니다 · 무료배송</p>
      </header>

      {settings.notice && <p className="notice">{settings.notice}</p>}

      {customer && (
        <div className="links">
          <a href={`/my/${customer.token}`}>내 주문 내역 보기</a>
          <form action={forgetMe}><button className="link">다른 분이 주문하시나요?</button></form>
        </div>
      )}

      {!customer && kakaoPending && (
        <p className="hint ok box">카카오 계정이 연결되었습니다. 이번에 주문하시면 다음부터 카카오 로그인만으로 바로 주문하실 수 있습니다.</p>
      )}
      {!customer && !kakaoPending && kakaoEnabled() && (
        <a className="btn-kakao" href="/auth/kakao">전에 주문하셨나요? 카카오로 이어서 주문</a>
      )}

      {settings.selling ? (
        <OrderForm
          price3={settings.price3}
          price5={settings.price5}
          token={customer?.token}
          source={source}
          returning={!!customer}
          initial={{
            name: customer?.name ?? "",
            phone: customer?.phone ?? "",
            postcode: customer?.postcode ?? "",
            address: customer?.address ?? "",
            addressDetail: customer?.address_detail ?? "",
            qty3,
            qty5,
          }}
        />
      ) : (
        <div className="card center">
          <h2>지금은 주문을 받지 않고 있습니다</h2>
          <p>다음 수확 때 다시 찾아 주세요. 감사합니다.</p>
        </div>
      )}

      <footer className="foot">{FARM_NAME} · <a href="/privacy">개인정보 처리 안내</a></footer>
    </main>
  );
}
