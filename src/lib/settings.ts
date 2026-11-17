import { query } from "./db";

export const FARM_NAME = "정금농원";

const DEFAULTS = {
  price_3kg: "25000",
  price_5kg: "38000",
  bank_name: "",
  bank_account: "",
  bank_holder: "",
  selling: "1",
  notice: "",
};

export type Settings = {
  price3: number;
  price5: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  selling: boolean;
  notice: string;
};

export async function getSettings(): Promise<Settings> {
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
  const m: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) m[r.key] = r.value;
  return {
    price3: Number(m.price_3kg) || 0,
    price5: Number(m.price_5kg) || 0,
    bankName: m.bank_name,
    bankAccount: m.bank_account,
    bankHolder: m.bank_holder,
    selling: m.selling === "1",
    notice: m.notice,
  };
}

export async function saveSettings(values: Partial<Record<keyof typeof DEFAULTS, string>>) {
  for (const [key, value] of Object.entries(values)) {
    if (!(key in DEFAULTS) || value === undefined) continue;
    await query(
      "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [key, value],
    );
  }
}
