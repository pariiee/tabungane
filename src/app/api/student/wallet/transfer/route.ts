import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transferToNim } from "@/lib/ledger";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const targetIdentifier = body.target_id || body.target_nim;
    const amount = body.amount;
    const catatan = body.catatan;
    const nominal = parseInt(amount, 10);

    if (isNaN(nominal) || nominal <= 0) {
      return NextResponse.json({ error: "Nominal harus lebih dari 0" }, { status: 400 });
    }
    if (!targetIdentifier) {
      return NextResponse.json({ error: "ID tujuan wajib diisi" }, { status: 400 });
    }

    const res = transferToNim(user.id, String(targetIdentifier).trim(), nominal, catatan);
    return NextResponse.json({ ...res });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal transfer ke ID tujuan" }, { status: 400 });
  }
}
