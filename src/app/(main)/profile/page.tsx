"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getProfile, updateProfile, changePassword } from "@/actions/profile";
import { WINGS, getFlatsForWing } from "@/lib/utils";
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  ClipboardList,
  CalendarDays,
} from "lucide-react";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  wing: string | null;
  flatNo: string | null;
  role: string;
  approvalStatus: string;
  createdAt: Date;
  _count: { createdIssues: number };
};

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wing, setWing] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function load() {
    const data = await getProfile();
    if (data) {
      setProfile(data as Profile);
      setWing(data.wing ?? "");
      setFlatNo(data.flatNo ?? "");
    }
  }

  useEffect(() => { load(); }, []);

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");

    const formData = new FormData(e.currentTarget);
    if (wing) formData.set("wing", wing);
    if (flatNo) formData.set("flatNo", flatNo);

    const result = await updateProfile(formData);

    if (result.error) {
      setProfileError(result.error);
    } else {
      toast({ title: "Profile updated successfully" });
      load();
    }
    setProfileLoading(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await changePassword(formData);

    if (result.error) {
      setPasswordError(result.error);
    } else {
      setPasswordSuccess(true);
      (e.target as HTMLFormElement).reset();
      toast({ title: "Password changed successfully" });
    }
    setPasswordLoading(false);
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 animate-pulse">
        <div className="h-28 bg-gray-100 rounded-xl" />
        <div className="h-64 bg-gray-100 rounded-xl" />
        <div className="h-52 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Profile summary card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-2xl">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold truncate">{profile.name}</h2>
                <Badge
                  variant="outline"
                  className={
                    profile.role === "ADMIN"
                      ? "border-green-300 text-green-700 bg-green-50"
                      : "border-gray-200 text-gray-600"
                  }
                >
                  {profile.role === "ADMIN" ? (
                    <><Shield className="h-3 w-3 mr-1" />Admin</>
                  ) : (
                    <><User className="h-3 w-3 mr-1" />Resident</>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">{profile.email}</p>
              {profile.wing && profile.flatNo && (
                <p className="text-sm text-gray-500">
                  Wing {profile.wing} — Flat {profile.flatNo}
                </p>
              )}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ClipboardList className="h-4 w-4 text-gray-400" />
              <span>{profile._count.createdIssues} issues filed</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              <span>Member since {format(new Date(profile.createdAt), "MMM yyyy")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit Profile</CardTitle>
          <CardDescription>Update your name, phone number, and flat details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {profileError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name">Full name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={profile.name}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400">Email cannot be changed.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ""}
                placeholder="9876543210"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Wing</Label>
                <Select value={wing} onValueChange={(v) => { setWing(v); setFlatNo(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select wing" />
                  </SelectTrigger>
                  <SelectContent>
                    {WINGS.map((w) => (
                      <SelectItem key={w} value={w}>Wing {w}</SelectItem>
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
                    {getFlatsForWing(wing).map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Change Password
          </CardTitle>
          <CardDescription>Enter your current password, then choose a new one.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Password changed successfully.
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter new password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            <Button type="submit" variant="outline" disabled={passwordLoading}>
              {passwordLoading ? "Updating…" : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
