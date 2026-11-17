import { redirect } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import { kakaoEnabled } from "@/lib/auth";
import { customerByToken, query, type Order } from "@/lib/db";
import { STATUS_LABEL, dateFmt, itemsText, orderNo, won } from "@/lib/format";
import { FARM_NAME, getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function MyOrders({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ done?: string; linked?: string }>;
}) {
  const { token } = await params;
  const { done, linked } = await searchParams;
  const customer = await customerByToken(token);
  if (!customer) redirect("/");

  const [orders, settings, base] = await Promise.all([
    query<Order>("SELECT * FROM orders WHERE customer_id=$1 ORDER BY id DESC LIMIT 30", [customer.id]),
    getSettings(),
    siteUrl(),
  ]);
  const justDone = orders.find((o) => String(o.id) === done);
  const unpaid = orders.filter((o) => o.status === "pending");
  const reorderUrl = `${base}/r/${customer.token}`;
  const hasBank = !!settings.bankAccount;

  return (
    <main className="wrap">
      <header className="hero small">
        <p className="farm">{FARM_NAME}</p>
        <h1>{justDone ? "주문이 접수되었습니다" : `${customer.name}님의 주문 내역`}</h1>
        {justDone && <p className="lead">주문번호 {orderNo(justDone.id)} · {itemsText(justDone.qty_3kg, justDone.qty_5kg)}</p>}
      </header>

      {linked && <p className="hint ok box">카카오 계정이 연결되었습니다. 다음부터 카카오 로그인으로 바로 주문하실 수 있습니다.</p>}

      {unpaid.length > 0 && (
        <section className="card">
          <h2>입금 안내</h2>
          <dl className="info">
            <dt>입금하실 금액</dt>
            <dd><strong className="price">{won(unpaid.reduce((s, o) => s + o.total, 0))}</strong></dd>
            {hasBank ? (
              <>
                <dt>입금 계좌</dt>
                <dd>{settings.bankName} {settings.bankAccount}</dd>
                <dt>예금주</dt>
                <dd>{settings.bankHolder}</dd>
              </>
            ) : (
              <>
                <dt>입금 계좌</dt>
                <dd>문자로 따로 안내해 드리겠습니다.</dd>
              </>
            )}
            <dt>입금자명</dt>
            <dd>{unpaid[0].depositor}</dd>
          </dl>
          {hasBank && <CopyButton text={settings.bankAccount} label="계좌번호 복사" />}
          <p className="hint">입금이 확인되면 발송해 드립니다.</p>
        </section>
      )}

      <section className="card">
        <h2>다음 주문은 더 간단하게</h2>
        <p>아래 링크를 저장해 두시면 주소를 다시 입력하지 않고 바로 주문하실 수 있습니다.</p>
        <p className="url">{reorderUrl}</p>
        <div className="row">
          <CopyButton text={reorderUrl} label="링크 복사" />
          <CopyButton text={reorderUrl} label="카톡 등으로 보내기" share />
        </div>
        {kakaoEnabled() && !customer.kakao_id && (
          <a className="btn-kakao" href={`/auth/kakao?link=${customer.token}`}>카카오 계정 연결하기</a>
        )}
        {customer.kakao_id && <p className="hint ok">카카오 계정이 연결되어 있습니다.</p>}
        <a className="btn-main" href={`/r/${customer.token}`}>다시 주문하기</a>
      </section>

      <section className="card">
        <h2>주문 내역</h2>
        {orders.length === 0 && <p>아직 주문 내역이 없습니다.</p>}
        <ul className="orders">
          {orders.map((o) => (
            <li key={o.id}>
              <div className="order-top">
                <span>{orderNo(o.id)} · {dateFmt(o.created_at)}</span>
                <span className={`badge ${o.status}`}>{STATUS_LABEL[o.status]}</span>
              </div>
              <div>{itemsText(o.qty_3kg, o.qty_5kg)} · {won(o.total)}</div>
              <div className="muted">{o.address} {o.address_detail}</div>
              {o.status === "shipped" && o.tracking_no && (
                <div className="muted">송장 {o.courier} {o.tracking_no}</div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <footer className="foot">{FARM_NAME} · <a href="/privacy">개인정보 처리 안내</a></footer>
    </main>
  );
}
