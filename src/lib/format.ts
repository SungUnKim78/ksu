export function won(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

export function orderNo(id: number): string {
  return "JG-" + String(id).padStart(5, "0");
}

export function phoneFmt(digits: string): string {
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  return digits;
}

const dt = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function dateFmt(d: Date): string {
  return dt.format(d);
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "입금 대기",
  paid: "입금 확인 · 발송 준비",
  shipped: "발송 완료",
  cancelled: "주문 취소",
};

export function itemsText(q3: number, q5: number): string {
  const parts: string[] = [];
  if (q3 > 0) parts.push(`3kg × ${q3}`);
  if (q5 > 0) parts.push(`5kg × ${q5}`);
  return parts.join(", ");
}
