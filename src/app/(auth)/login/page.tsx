"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Clock, XCircle } from "lucide-react";
import { checkApprovalStatus } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<"generic" | "pending" | "rejected">("generic");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      // Check why sign-in failed to give a helpful message
      const status = await checkApprovalStatus(email);
      if (status === "PENDING") {
        setErrorType("pending");
        setError("Your account is awaiting admin approval. You will be able to sign in once approved.");
      } else if (status === "REJECTED") {
        setErrorType("rejected");
        setError("Your registration was not approved. Please contact the society secretary.");
      } else {
        setErrorType("generic");
        setError("Invalid email or password. Please try again.");
      }
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  const errorBg =
    errorType === "pending"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : errorType === "rejected"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-red-50 border-red-200 text-red-700";

  const ErrorIcon = errorType === "pending" ? Clock : XCircle;

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-white" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl">Green Valley</CardTitle>
          <CardDescription>
            Sign in to access the issue tracker
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className={`rounded-md border p-3 text-sm flex gap-2 items-start ${errorBg}`}>
              <ErrorIcon className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          New resident?{" "}
          <Link
            href="/register"
            className="text-primary hover:underline font-medium"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
