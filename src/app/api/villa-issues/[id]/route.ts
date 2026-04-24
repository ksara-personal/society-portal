export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVillaIssueById } from "@/actions/villa-issues";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const issue = await getVillaIssueById(params.id);
  if (!issue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only the owner or an admin may fetch a villa issue
  const isOwner = issue.createdById === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(issue);
}
