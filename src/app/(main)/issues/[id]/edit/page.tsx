"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateIssue } from "@/actions/issues";
import { useToast } from "@/components/ui/use-toast";
import { WINGS } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default function EditIssuePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [issue, setIssue] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/issues/${params.id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([issueData, cats]) => {
      setIssue(issueData);
      setCategories(cats);
      setLoading(false);
    });
  }, [params.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateIssue(params.id as string, formData);
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Issue updated!" });
      router.push(`/issues/${params.id}`);
    }
    setSaving(false);
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading…</div>;
  if (!issue) return <div className="text-center py-16 text-gray-400">Issue not found.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/issues/${params.id}`} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Issue
        </Link>
      </Button>

      <h1 className="text-xl font-bold mb-5">Edit Issue</h1>

      <form onSubmit={onSubmit}>
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={issue.title}
                required
                minLength={5}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={issue.description}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select name="categoryId" defaultValue={issue.categoryId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select name="priority" defaultValue={issue.priority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Wing</Label>
                <Select name="wing" defaultValue={issue.wing || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select wing" />
                  </SelectTrigger>
                  <SelectContent>
                    {WINGS.map((w) => (
                      <SelectItem key={w} value={w}>
                        Wing {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Specific Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={issue.location || ""}
                  placeholder="e.g. 3rd floor corridor"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
