"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { customerByToken, query } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import {
  CUSTOMER_AGE,
  CUSTOMER_COOKIE,
  KAKAO_PENDING_COOKIE,
  cookieBase,
  newToken,
  pendingKakaoId,
} from "@/lib/auth";

export type OrderState = { error: string } | null;

function text(fd: FormData, key: string, max: number): string {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}

function qty(fd: FormData, key: string): number {
  const n = Number(fd.get(key));
  return Number.isInteger(n) && n >= 0 && n <= 30 ? n : 0;
}

export async function createOrder(_prev: OrderState, fd: FormData): Promise<OrderState> {
  // 자동 입력 프로그램 차단용 숨은 칸
  if (text(fd, "website", 100)) return { error: "주문을 처리하지 못했습니다. 다시 시도해 주세요." };

  const name = text(fd, "name", 30);
  const phone = text(fd, "phone", 20).replace(/\D/g, "");
  const postcode = text(fd, "postcode", 10);
  const address = text(fd, "address", 200);
  const addressDetail = text(fd, "addressDetail", 100);
  const memo = text(fd, "memo", 200);
  const depositor = text(fd, "depositor", 30) || name;
  const source = text(fd, "source", 30).replace(/[^A-Za-z0-9_-]/g, "");
  const token = text(fd, "token", 64);
  const q3 = qty(fd, "qty3");
  const q5 = qty(fd, "qty5");

  if (q3 + q5 === 0) return { error: "수량을 1개 이상 선택해 주세요." };
  if (!name) return { error: "받으시는 분 이름을 입력해 주세요." };
  if (phone.length < 9 || phone.length > 11) return { error: "연락처를 정확히 입력해 주세요." };
  if (!address) return { error: "배송 주소를 입력해 주세요." };
  if (fd.get("consent") !== "on") return { error: "개인정보 수집·이용에 동의해 주세요." };

  const settings = await getSettings();
  if (!settings.selling) return { error: "지금은 주문을 받지 않고 있습니다." };

  let customer = token ? await customerByToken(token) : null;
  if (customer) {
    await query(
      `UPDATE customers SET name=$1, phone=$2, postcode=$3, address=$4, address_detail=$5, updated_at=now() WHERE id=$6`,
      [name, phone, postcode, address, addressDetail, customer.id],
    );
  } else {
    const kakaoId = await pendingKakaoId();
    const rows = await query<{ id: number; token: string }>(
      `INSERT INTO customers (token, kakao_id, name, phone, postcode, address, address_detail)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, token`,
      [newToken(), kakaoId, name, phone, postcode, address, addressDetail],
    );
    customer = { ...rows[0], kakao_id: kakaoId, name, phone, postcode, address, address_detail: addressDetail };
  }

  const total = q3 * settings.price3 + q5 * settings.price5;
  const [order] = await query<{ id: number }>(
    `INSERT INTO orders (customer_id, qty_3kg, qty_5kg, price_3kg, price_5kg, total,
       name, phone, postcode, address, address_detail, memo, depositor, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    [customer.id, q3, q5, settings.price3, settings.price5, total,
      name, phone, postcode, address, addressDetail, memo, depositor, source],
  );

  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, customer.token, { ...cookieBase, maxAge: CUSTOMER_AGE });
  jar.delete(KAKAO_PENDING_COOKIE);

  redirect(`/my/${customer.token}?done=${order.id}`);
}

/** 이 기기에 저장된 주문자 정보를 지우고 새로 주문합니다. */
export async function forgetMe() {
  const jar = await cookies();
  jar.delete(CUSTOMER_COOKIE);
  jar.delete(KAKAO_PENDING_COOKIE);
  redirect("/");
}
