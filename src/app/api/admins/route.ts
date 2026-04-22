export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAdmins } from "@/actions/issues";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admins = await getAdmins();
  return NextResponse.json(admins);
}
