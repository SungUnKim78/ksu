import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { query, type Order } from "@/lib/db";
import { STATUS_LABEL, dateFmt, orderNo, phoneFmt } from "@/lib/format";

function cell(v: string | number): string {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // 엑셀 수식으로 실행되지 않도록
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return new NextResponse("권한이 없습니다.", { status: 401 });
  const s = req.nextUrl.searchParams.get("s") ?? "all";
  const orders = await query<Order>(
    "SELECT * FROM orders WHERE ($1='all' OR status=$1) ORDER BY id DESC",
    [s],
  );
  const head = ["주문번호", "주문일시", "상태", "받는분", "연락처", "우편번호", "주소", "상세주소",
    "3kg", "5kg", "금액", "입금자명", "배송메모", "택배사", "송장번호", "유입"];
  const lines = orders.map((o) =>
    [orderNo(o.id), dateFmt(o.created_at), STATUS_LABEL[o.status], o.name, phoneFmt(o.phone), o.postcode,
      o.address, o.address_detail, o.qty_3kg, o.qty_5kg, o.total, o.depositor, o.memo, o.courier,
      o.tracking_no, o.source].map(cell).join(","),
  );
  const csv = "﻿" + [head.map(cell).join(","), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${s}.csv"`,
    },
  });
}
