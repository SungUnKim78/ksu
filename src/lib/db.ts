import { Pool, type QueryResultRow } from "pg";

const g = globalThis as unknown as { __pool?: Pool; __schema?: Promise<void> };

function pool(): Pool {
  if (!g.__pool) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
    g.__pool = new Pool({ connectionString: url, max: 3 });
  }
  return g.__pool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS customers (
  id serial PRIMARY KEY,
  token text UNIQUE NOT NULL,
  kakao_id text UNIQUE,
  name text NOT NULL,
  phone text NOT NULL,
  postcode text NOT NULL DEFAULT '',
  address text NOT NULL,
  address_detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  customer_id integer NOT NULL REFERENCES customers(id),
  qty_3kg integer NOT NULL,
  qty_5kg integer NOT NULL,
  price_3kg integer NOT NULL,
  price_5kg integer NOT NULL,
  total integer NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  postcode text NOT NULL DEFAULT '',
  address text NOT NULL,
  address_detail text NOT NULL DEFAULT '',
  memo text NOT NULL DEFAULT '',
  depositor text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  courier text NOT NULL DEFAULT '',
  tracking_no text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  shipped_at timestamptz
);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders(customer_id);
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL
);
`;

async function ensureSchema(): Promise<void> {
  if (!g.__schema) {
    g.__schema = (async () => {
      const client = await pool().connect();
      try {
        await client.query("BEGIN");
        // 동시에 여러 서버가 처음 뜰 때 표 생성이 충돌하지 않도록 잠금
        await client.query("SELECT pg_advisory_xact_lock(778899)");
        await client.query(SCHEMA);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    })().catch((e) => {
      g.__schema = undefined;
      throw e;
    });
  }
  return g.__schema;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  await ensureSchema();
  const res = await pool().query<T>(text, params);
  return res.rows;
}

export type Customer = {
  id: number;
  token: string;
  kakao_id: string | null;
  name: string;
  phone: string;
  postcode: string;
  address: string;
  address_detail: string;
};

export type Order = {
  id: number;
  customer_id: number;
  qty_3kg: number;
  qty_5kg: number;
  price_3kg: number;
  price_5kg: number;
  total: number;
  name: string;
  phone: string;
  postcode: string;
  address: string;
  address_detail: string;
  memo: string;
  depositor: string;
  status: "pending" | "paid" | "shipped" | "cancelled";
  courier: string;
  tracking_no: string;
  source: string;
  created_at: Date;
};

export async function customerByToken(token: string): Promise<Customer | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const rows = await query<Customer>("SELECT * FROM customers WHERE token = $1", [token]);
  return rows[0] ?? null;
}
