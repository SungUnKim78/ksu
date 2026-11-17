import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { AutoRefresh } from "@/components/AdminClient";
import { updateOrder } from "./actions";
import { isAdmin } from "@/lib/auth";
import { query, type Order } from "@/lib/db";
import { STATUS_LABEL, dateFmt, itemsText, orderNo, phoneFmt, won } from "@/lib/format";

export const dynamic = "force-dynamic";

const TABS = [
  ["pending", "입금 대기"],
  ["paid", "발송 준비"],
  ["shipped", "발송 완료"],
  ["cancelled", "취소"],
  ["all", "전체"],
] as const;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { s } = await searchParams;
  const tab = TABS.some(([k]) => k === s) ? s! : "pending";

  const [orders, counts, [stats], sources] = await Promise.all([
    query<Order & { order_seq: number }>(
      `SELECT o.*, (SELECT count(*)::int FROM orders p WHERE p.customer_id=o.customer_id AND p.id<=o.id AND p.status<>'cancelled') AS order_seq
       FROM orders o WHERE ($1='all' OR o.status=$1) ORDER BY o.id DESC LIMIT 200`,
      [tab],
    ),
    query<{ status: string; n: number }>("SELECT status, count(*)::int AS n FROM orders GROUP BY status"),
    query<{ orders: number; revenue: number; customers: number; repeaters: number }>(
      `SELECT count(*)::int AS orders, coalesce(sum(total),0)::int AS revenue,
              count(DISTINCT customer_id)::int AS customers,
              (SELECT count(*)::int FROM (SELECT customer_id FROM orders WHERE status<>'cancelled'
                 GROUP BY customer_id HAVING count(*)>1) t) AS repeaters
       FROM orders WHERE status<>'cancelled'`,
    ),
    query<{ source: string; n: number }>(
      "SELECT source, count(*)::int AS n FROM orders WHERE status<>'cancelled' GROUP BY source ORDER BY n DESC LIMIT 8",
    ),
  ]);
  const countOf = (k: string) =>
    k === "all" ? counts.reduce((a, c) => a + c.n, 0) : counts.find((c) => c.status === k)?.n ?? 0;

  return (
    <main className="wrap wide">
      <AdminNav />
      <AutoRefresh />

      <div className="stats">
        <div className="stat"><b>{stats.orders}</b><span>누적 주문</span></div>
        <div className="stat"><b>{won(stats.revenue)}</b><span>누적 주문 금액</span></div>
        <div className="stat"><b>{stats.customers}</b><span>주문 고객</span></div>
        <div className="stat">
          <b>{stats.repeaters}{stats.customers > 0 && ` (${Math.round((stats.repeaters / stats.customers) * 100)}%)`}</b>
          <span>재주문 고객</span>
        </div>
      </div>
      {sources.length > 0 && (
        <p className="muted">
          유입 경로: {sources.map((x) => `${x.source === "reorder" ? "재주문 링크" : x.source || "직접 접속"} ${x.n}건`).join(" · ")}
        </p>
      )}

      <div className="tabs">
        {TABS.map(([k, label]) => (
          <a key={k} href={`/admin?s=${k}`} className={k === tab ? "on" : ""}>{label} {countOf(k)}</a>
        ))}
        <a href={`/admin/export?s=${tab}`}>엑셀 내려받기</a>
      </div>

      {orders.length === 0 && <p className="card center">해당하는 주문이 없습니다.</p>}

      {orders.map((o) => (
        <article key={o.id} className="a-order">
          <div className="order-top">
            <span>{orderNo(o.id)} · {dateFmt(o.created_at)}{o.order_seq > 1 && ` · ${o.order_seq}번째 주문`}</span>
            <span className={`badge ${o.status}`}>{STATUS_LABEL[o.status]}</span>
          </div>
          <div><strong>{itemsText(o.qty_3kg, o.qty_5kg)}</strong> · {won(o.total)}</div>
          <div>{o.name} · <a href={`tel:${o.phone}`}>{phoneFmt(o.phone)}</a>{o.depositor !== o.name && ` · 입금자 ${o.depositor}`}</div>
          <div className="muted">({o.postcode}) {o.address} {o.address_detail}</div>
          {o.memo && <div className="muted">메모: {o.memo}</div>}
          {o.tracking_no && <div className="muted">송장: {o.courier} {o.tracking_no}</div>}

          <div className="a-actions">
            {o.status === "pending" && (
              <form action={updateOrder}>
                <input type="hidden" name="id" value={o.id} />
                <input type="hidden" name="back" value={tab} />
                <button name="to" value="paid" className="btn-sub btn-go">입금 확인</button>
                <button name="to" value="cancelled" className="btn-sub btn-danger">주문 취소</button>
              </form>
            )}
            {(o.status === "paid" || o.status === "shipped") && (
              <form action={updateOrder}>
                <input type="hidden" name="id" value={o.id} />
                <input type="hidden" name="back" value={tab} />
                <input name="courier" defaultValue={o.courier} placeholder="택배사" aria-label="택배사" size={8} />
                <input name="tracking" defaultValue={o.tracking_no} placeholder="송장번호" aria-label="송장번호" size={14} />
                <button name="to" value="shipped" className="btn-sub btn-go">
                  {o.status === "paid" ? "발송 완료 처리" : "송장 수정"}
                </button>
                {o.status === "paid" && (
                  <>
                    <button name="to" value="pending" className="btn-sub">입금 확인 취소</button>
                    <button name="to" value="cancelled" className="btn-sub btn-danger">주문 취소</button>
                  </>
                )}
              </form>
            )}
            {o.status === "cancelled" && (
              <form action={updateOrder}>
                <input type="hidden" name="id" value={o.id} />
                <input type="hidden" name="back" value={tab} />
                <button name="to" value="pending" className="btn-sub">주문 되살리기</button>
              </form>
            )}
          </div>
        </article>
      ))}
    </main>
  );
}
