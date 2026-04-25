"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Building2, CheckCircle2, Clock } from "lucide-react";
import { registerUser } from "@/actions/auth";
import { WINGS, getFlatsForWing } from "@/lib/utils";
import { BRANDING } from "@/config/branding";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [wing, setWing] = useState("");
  const [flatNo, setFlatNo] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    if (wing) formData.set("wing", wing);
    if (flatNo) formData.set("flatNo", flatNo);

    const result = await registerUser(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setRegistered(true);
  }

  if (registered) {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-10 pb-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 border-2 border-amber-200">
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Account Created!</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your registration is <strong>pending admin approval</strong>. The society secretary will
              review your request and approve your account shortly.
            </p>
            <p className="text-xs text-gray-400 mt-3">
              Once approved, you can sign in using your email and password.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>You will be able to log in after approval.</span>
          </div>
          <Link href="/login">
            <Button variant="outline" className="w-full mt-2">
              Back to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl my-8">
      <CardHeader className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-white" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Register as a {BRANDING.communityName} {BRANDING.memberLabel.toLowerCase()}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name">Full name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ravi Kumar"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ravi@example.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="9876543210"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Wing</Label>
              <Select value={wing} onValueChange={(v) => { setWing(v); setFlatNo(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
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
                  <SelectValue placeholder={wing ? "Select" : "Select wing first"} />
                </SelectTrigger>
                <SelectContent>
                  {getFlatsForWing(wing).map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>

          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
            Your account will require <strong>admin approval</strong> before you can sign in.
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
