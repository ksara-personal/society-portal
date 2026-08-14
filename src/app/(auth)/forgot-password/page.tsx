"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Building2, CheckCircle2, Mail, XCircle } from "lucide-react";
import { requestPasswordReset, verifyResetCode, resetPassword } from "@/actions/auth";
import { BRANDING } from "@/config/branding";

type Step = "email" | "code" | "password" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmitEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const enteredEmail = (formData.get("email") as string).trim();

    const result = await requestPasswordReset(enteredEmail);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setEmail(enteredEmail);
    setMaskedEmail(result.maskedEmail ?? "");
    setStep("code");
  }

  async function onSubmitCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const enteredCode = (formData.get("code") as string).trim();

    const result = await verifyResetCode(email, enteredCode);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setCode(enteredCode);
    setStep("password");
  }

  async function onSubmitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const result = await resetPassword(email, code, newPassword, confirmPassword);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setStep("done");
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-white" />
          </div>
        </div>
        <div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            {step === "email" && `Enter your ${BRANDING.communityName} account email to receive a reset code`}
            {step === "code" && "Enter the code sent to your email"}
            {step === "password" && "Choose a new password"}
            {step === "done" && "Your password has been reset"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border bg-red-50 border-red-200 p-3 text-sm text-red-700 flex gap-2 items-start">
            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === "email" && (
          <form onSubmit={onSubmitEmail} className="space-y-4">
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending code…" : "Send Reset Code"}
            </Button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={onSubmitCode} className="space-y-4">
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700 flex gap-2 items-start">
              <Mail className="h-4 w-4 mt-0.5 shrink-0" />
              <span>We&apos;ve sent a 6-digit code to <strong>{maskedEmail}</strong>.</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                autoComplete="one-time-code"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying…" : "Verify Code"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setError("");
              }}
              className="w-full text-sm text-gray-600 hover:underline flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Use a different email
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={onSubmitPassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters and include an uppercase letter, a lowercase
                letter, a number, and a special character.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter new password"
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Resetting…" : "Reset Password"}
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className="text-center space-y-5 py-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border-2 border-green-200">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Your password has been reset successfully. You can now sign in with your new
              password.
            </p>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Go to Sign In
            </Button>
          </div>
        )}

        {step !== "done" && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Remembered your password?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Back to Sign In
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
