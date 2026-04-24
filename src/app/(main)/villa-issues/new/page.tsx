"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { MediaUpload, type UploadedFile } from "@/components/issues/media-upload";
import { createVillaIssue } from "@/actions/villa-issues";
import { useToast } from "@/components/ui/use-toast";
import { WINGS, getFlatsForWing } from "@/lib/utils";
import { ArrowLeft, Home } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export default function NewVillaIssuePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wing, setWing] = useState<string>("");
  const [flatNo, setFlatNo] = useState<string>("");

  // Fetch categories once on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Pre-fill wing/flatNo from profile once session is authenticated
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    const profileWing = session.user.wing ?? "";
    const profileFlatNo = session.user.flatNo ?? "";
    if (profileWing) setWing(profileWing);
    if (profileFlatNo) setFlatNo(profileFlatNo);
  }, [status, session?.user?.wing, session?.user?.flatNo]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("wing", wing);
    formData.set("flatNo", flatNo);
    formData.set("attachments", JSON.stringify(attachments));

    const result = await createVillaIssue(formData);

    if ("error" in result && result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({
      title: "Villa issue logged!",
      description: "Your issue has been saved and only you can see it.",
    });
    router.push(`/villa-issues/${result.issueId}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/villa-issues" className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Villa Issues
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          Log a Villa Issue
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track issues specific to your villa. Only you (and admins) can see these.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Issue Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Bathroom tap dripping"
                required
                minLength={5}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the issue in detail. When did it start? How severe is it?"
                rows={4}
                required
                minLength={10}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select name="categoryId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select name="priority" defaultValue="MEDIUM">
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
                <Select value={wing} onValueChange={(v) => { setWing(v); setFlatNo(""); }}>
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
                <Select value={flatNo} onValueChange={setFlatNo} disabled={!wing}>
                  <SelectTrigger>
                    <SelectValue placeholder={wing ? "Select flat" : "Select wing first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getFlatsForWing(wing).map((f) => (
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
                placeholder="e.g. Master bedroom, kitchen, balcony"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Attach Photos / Video</CardTitle>
          </CardHeader>
          <CardContent>
            <MediaUpload onFilesChange={setAttachments} />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Log Issue"}
          </Button>
        </div>
      </form>
    </div>
  );
}
