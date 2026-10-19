import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transferToNim } from "@/lib/ledger";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { target_nim, amount, catatan } = await req.json();
    const nominal = parseInt(amount, 10);

    if (isNaN(nominal) || nominal <= 0) {
      return NextResponse.json({ error: "Nominal harus lebih dari 0" }, { status: 400 });
    }
    if (!target_nim) {
      return NextResponse.json({ error: "NIM tujuan wajib diisi" }, { status: 400 });
    }

    const res = transferToNim(user.id, String(target_nim).trim(), nominal, catatan);
    return NextResponse.json({ ...res });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal transfer ke NIM tujuan" }, { status: 400 });
  }
}
