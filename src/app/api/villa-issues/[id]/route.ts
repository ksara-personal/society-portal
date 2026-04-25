export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getVillaIssueById } from "@/actions/villa-issues";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = issue.createdById === session.user.id;

  // Allow flatmates (same wing + flatNo) to view each other's issues
  let isFlatmate = false;
  if (!isOwner && !isAdmin) {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { wing: true, flatNo: true },
    });
    if (currentUser?.wing && currentUser?.flatNo) {
      const issueCreator = await prisma.user.findUnique({
        where: { id: issue.createdById },
        select: { wing: true, flatNo: true },
      });
      isFlatmate =
        issueCreator?.wing === currentUser.wing &&
        issueCreator?.flatNo === currentUser.flatNo;
    }
  }

  if (!isOwner && !isAdmin && !isFlatmate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(issue);
}
