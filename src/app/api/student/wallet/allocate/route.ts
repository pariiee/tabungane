import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { allocateToGroup } from "@/lib/ledger";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { grup_id, amount, catatan } = await req.json();
    const nominal = parseInt(amount, 10);

    if (isNaN(nominal) || nominal <= 0) {
      return NextResponse.json({ error: "Nominal harus lebih dari 0" }, { status: 400 });
    }
    if (!grup_id) {
      return NextResponse.json({ error: "Grup tujuan alokasi wajib dipilih" }, { status: 400 });
    }

    const res = allocateToGroup(user.id, grup_id, nominal, catatan);
    return NextResponse.json({ ...res });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal melakukan alokasi dana" }, { status: 400 });
  }
}
