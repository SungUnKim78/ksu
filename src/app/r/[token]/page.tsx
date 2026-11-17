import { redirect } from "next/navigation";
import OrderPage from "@/components/OrderPage";
import { customerByToken } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Reorder({ params, searchParams }: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ b?: string }>;
}) {
  const { token } = await params;
  const { b } = await searchParams;
  const customer = await customerByToken(token);
  if (!customer) redirect("/");
  const source = (b ?? "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 30) || "reorder";
  return <OrderPage customer={customer} source={source} kakaoPending={false} />;
}
