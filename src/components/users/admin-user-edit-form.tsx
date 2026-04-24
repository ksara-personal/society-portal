"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { updateUser } from "@/actions/users";
import { WINGS, FLAT_NUMBERS } from "@/lib/utils";

export type AdminUserEditData = {
  id: string;
  name: string;
  email: string;
  role: string;
  wing: string | null;
  flatNo: string | null;
  phone: string | null;
  isActive: boolean;
  approvalStatus: string;
  createdAt: Date;
  issueCount: number;
};

interface AdminUserEditFormProps {
  user: AdminUserEditData;
}

export default function AdminUserEditForm({ user }: AdminUserEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [wing, setWing] = useState(user.wing ?? "");
  const [flatNo, setFlatNo] = useState(user.flatNo ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    if (wing) formData.set("wing", wing);
    if (flatNo) formData.set("flatNo", flatNo);

    const result = await updateUser(user.id, formData);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    toast({ title: "User updated successfully" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name *</Label>
          <Input id="name" name="name" defaultValue={user.name} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" value={user.email} disabled className="bg-gray-50 text-gray-500 cursor-not-allowed" />
          <p className="text-xs text-gray-400">Email cannot be changed through this form.</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} placeholder="9876543210" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              {FLAT_NUMBERS.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}
