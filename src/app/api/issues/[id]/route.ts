export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getIssueById } from "@/actions/issues";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const issue = await getIssueById(resolvedParams.id);
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(issue);
}
