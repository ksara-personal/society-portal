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
import { updateVillaIssue } from "@/actions/villa-issues";
import { useToast } from "@/components/ui/use-toast";
import { WINGS, FLAT_NUMBERS } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default function EditVillaIssuePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [issue, setIssue] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wing, setWing] = useState("");
  const [flatNo, setFlatNo] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/villa-issues/${params.id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([issueData, cats]) => {
      setIssue(issueData);
      setCategories(cats);
      setWing(issueData.wing || "");
      setFlatNo(issueData.flatNo || "");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    formData.set("wing", wing);
    formData.set("flatNo", flatNo);
    const result = await updateVillaIssue(params.id as string, formData);
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Issue updated!" });
      router.push(`/villa-issues/${params.id}`);
    }
    setSaving(false);
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading…</div>;
  if (!issue) return <div className="text-center py-16 text-gray-400">Issue not found.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/villa-issues/${params.id}`} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Issue
        </Link>
      </Button>

      <h1 className="text-xl font-bold mb-5">Edit Villa Issue</h1>

      <form onSubmit={onSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Issue Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" defaultValue={issue.title} required minLength={5} />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Villa Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Wing</Label>
                <Select value={wing} onValueChange={setWing}>
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
                <Label>Flat No.</Label>
                <Select value={flatNo} onValueChange={setFlatNo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select flat" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLAT_NUMBERS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Specific Area (optional)</Label>
              <Input
                id="location"
                name="location"
                defaultValue={issue.location || ""}
                placeholder="e.g. Master bedroom, kitchen, balcony"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
