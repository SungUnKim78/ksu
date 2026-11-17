"use server";

import { redirect } from "next/navigation";
import { checkAdminPassword, endAdminSession, isAdmin, startAdminSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { saveSettings } from "@/lib/settings";

export async function login(_prev: { error: string } | null, fd: FormData) {
  if (!checkAdminPassword(String(fd.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 800)); // 비밀번호 대입 시도를 늦춥니다
    return { error: "비밀번호가 맞지 않습니다." };
  }
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function updateOrder(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const to = String(fd.get("to"));
  const back = String(fd.get("back") ?? "");
  if (!Number.isInteger(id)) return;

  if (to === "paid") {
    await query("UPDATE orders SET status='paid', paid_at=now() WHERE id=$1 AND status='pending'", [id]);
  } else if (to === "shipped") {
    const courier = String(fd.get("courier") ?? "").trim().slice(0, 30);
    const tracking = String(fd.get("tracking") ?? "").trim().slice(0, 40);
    await query(
      "UPDATE orders SET status='shipped', shipped_at=now(), courier=$2, tracking_no=$3 WHERE id=$1 AND status IN ('paid','shipped')",
      [id, courier, tracking],
    );
  } else if (to === "cancelled") {
    await query("UPDATE orders SET status='cancelled' WHERE id=$1 AND status IN ('pending','paid')", [id]);
  } else if (to === "pending") {
    await query("UPDATE orders SET status='pending', paid_at=NULL WHERE id=$1 AND status IN ('paid','cancelled')", [id]);
  }
  redirect(`/admin${/^[a-z]+$/.test(back) ? `?s=${back}` : ""}`);
}

export async function updateSettings(fd: FormData) {
  await requireAdmin();
  const price = (k: string) => String(Math.max(0, Math.floor(Number(fd.get(k)) || 0)));
  const text = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  await saveSettings({
    price_3kg: price("price_3kg"),
    price_5kg: price("price_5kg"),
    bank_name: text("bank_name", 30),
    bank_account: text("bank_account", 40),
    bank_holder: text("bank_holder", 30),
    notice: text("notice", 300),
    selling: fd.get("selling") === "on" ? "1" : "0",
  });
  redirect("/admin/settings?saved=1");
}
