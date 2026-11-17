import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OrderPage from "@/components/OrderPage";
import { CUSTOMER_COOKIE, pendingKakaoId } from "@/lib/auth";
import { customerByToken } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ b?: string }> }) {
  const { b } = await searchParams;
  const source = (b ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 30);

  // 이 기기에서 주문한 적이 있으면 저장된 정보로 바로 이어 줍니다.
  const saved = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (saved && (await customerByToken(saved))) {
    redirect(`/r/${saved}${source ? `?b=${source}` : ""}`);
  }

  return <OrderPage customer={null} source={source} kakaoPending={!!(await pendingKakaoId())} />;
}
