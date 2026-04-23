"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/issues/status-badge";
import { PriorityBadge } from "@/components/issues/priority-badge";
import { StatusTimeline } from "@/components/issues/status-timeline";
import { MediaGallery } from "@/components/issues/media-gallery";
import { ShareIssueButton } from "@/components/issues/share-issue-button";
import { updateIssueStatus, assignIssue, deleteIssue } from "@/actions/issues";
import { useToast } from "@/components/ui/use-toast";
import {
  MapPin,
  User,
  Calendar,
  Tag,
  ArrowLeft,
  Pencil,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [issue, setIssue] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  const isOwner = session?.user?.id === issue?.createdById;

  useEffect(() => {
    fetch(`/api/issues/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setIssue(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    if (isAdmin) {
      fetch("/api/admins")
        .then((r) => r.json())
        .then(setAdmins)
        .catch(() => {});
    }
  }, [params.id, isAdmin]);

  async function handleStatusUpdate() {
    if (!newStatus) return;
    setUpdating(true);
    const result = await updateIssueStatus(params.id as string, {
      status: newStatus,
      note: statusNote || undefined,
    });
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Status updated!" });
      // Refresh
      const data = await fetch(`/api/issues/${params.id}`).then((r) => r.json());
      setIssue(data);
      setNewStatus("");
      setStatusNote("");
    }
    setUpdating(false);
  }

  async function handleAssign(adminId: string) {
    // "unassigned" sentinel → pass null to clear the assignment
    const resolvedId = adminId === "unassigned" ? null : adminId;
    await assignIssue(params.id as string, resolvedId);
    const data = await fetch(`/api/issues/${params.id}`).then((r) => r.json());
    setIssue(data);
    toast({ title: resolvedId ? "Issue assigned!" : "Assignment cleared" });
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    const result = await deleteIssue(params.id as string);
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Issue deleted" });
      router.push("/issues");
    }
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
        <p className="text-gray-400">Issue not found.</p>
        <Link href="/issues" className="text-primary hover:underline text-sm mt-2 block">
          ← Back to issues
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/issues" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex gap-2">
          <ShareIssueButton issue={issue} />
          {(isOwner || isAdmin) && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/issues/${issue.id}/edit`} className="gap-1">
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
              <h1 className="text-xl font-bold text-gray-900">{issue.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  {issue.category.name}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {issue.createdBy.name}
                  {issue.createdBy.flatNo &&
                    ` (Wing ${issue.createdBy.wing}-${issue.createdBy.flatNo})`}
                </span>
                {issue.wing && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Wing {issue.wing}
                    {issue.location && ` — ${issue.location}`}
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

          {issue.assignedTo && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
              <UserCheck className="h-4 w-4 text-green-600" />
              Assigned to:{" "}
              <span className="font-medium text-gray-700">
                {issue.assignedTo.name}
              </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Admin actions */}
        {isAdmin && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Note (optional)</Label>
                <Textarea
                  placeholder="Add a note about this status change…"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={2}
                />
              </div>
              <Button
                onClick={handleStatusUpdate}
                disabled={!newStatus || updating}
                className="w-full"
              >
                {updating ? "Updating…" : "Update Status"}
              </Button>

              {admins.length > 0 && (
                <div className="pt-2 border-t space-y-1.5">
                  <Label>Assign To</Label>
                  <Select
                    value={issue.assignedToId || "unassigned"}
                    onValueChange={handleAssign}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select admin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {admins.map((admin: any) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline history={issue.statusHistory || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
