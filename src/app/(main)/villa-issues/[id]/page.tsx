"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/issues/status-badge";
import { PriorityBadge } from "@/components/issues/priority-badge";
import { StatusTimeline } from "@/components/issues/status-timeline";
import { MediaGallery } from "@/components/issues/media-gallery";
import { ShareIssueButton } from "@/components/issues/share-issue-button";
import { deleteVillaIssue, resolveVillaIssue } from "@/actions/villa-issues";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  User,
  Calendar,
  Tag,
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Home,
} from "lucide-react";

export default function VillaIssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const isOwner = session?.user?.id === issue?.createdById;

  async function fetchIssue() {
    const res = await fetch(`/api/villa-issues/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setIssue(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchIssue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this villa issue?")) return;
    const result = await deleteVillaIssue(params.id as string);
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Issue deleted" });
      router.push("/villa-issues");
    }
  }

  async function handleResolve(resolve: boolean) {
    setResolving(true);
    const result = await resolveVillaIssue(params.id as string, resolve);
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({
        title: resolve ? "Issue marked as resolved!" : "Issue reopened",
      });
      await fetchIssue();
    }
    setResolving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading…</div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Issue not found or you don&apos;t have access.</p>
        <Link href="/villa-issues" className="text-primary hover:underline text-sm mt-2 block">
          ← Back to villa issues
        </Link>
      </div>
    );
  }

  const isResolved = issue.status === "COMPLETED";

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/villa-issues" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex gap-2 flex-wrap">
          <ShareIssueButton issue={issue} />

          {isOwner && (
            <Button
              variant={isResolved ? "outline" : "default"}
              size="sm"
              onClick={() => handleResolve(!isResolved)}
              disabled={resolving}
              className={isResolved ? "gap-1" : "gap-1 bg-green-600 hover:bg-green-700"}
            >
              {isResolved ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Reopen
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {resolving ? "Saving…" : "Mark Resolved"}
                </>
              )}
            </Button>
          )}

          {(isOwner || isAdmin) && !isResolved && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/villa-issues/${issue.id}/edit`} className="gap-1">
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}

          {(isOwner || isAdmin) && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:border-red-300 gap-1"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Issue header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs px-2 border-amber-300 text-amber-700 bg-amber-50">
                  <Home className="h-3 w-3 mr-1" />
                  Villa Issue
                </Badge>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{issue.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {issue.category.name}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {issue.createdBy.name}
                  {issue.createdBy.wing && issue.createdBy.flatNo
                    ? ` (Wing ${issue.createdBy.wing}-${issue.createdBy.flatNo})`
                    : ""}
                </span>
                {(issue.wing || issue.flatNo || issue.location) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {issue.wing ? `Wing ${issue.wing}` : ""}
                    {issue.flatNo ? ` Flat ${issue.flatNo}` : ""}
                    {issue.location ? ` — ${issue.location}` : ""}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(issue.createdAt), "dd MMM yyyy, h:mm a")}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
              {issue.description}
            </p>
          </div>

          {issue.resolvedAt && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Resolved on {format(new Date(issue.resolvedAt), "dd MMM yyyy")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media */}
      {issue.attachments?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Photos & Videos ({issue.attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MediaGallery attachments={issue.attachments} />
          </CardContent>
        </Card>
      )}

      {/* Activity timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline history={issue.statusHistory || []} />
        </CardContent>
      </Card>
    </div>
  );
}
