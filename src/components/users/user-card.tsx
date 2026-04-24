"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Phone, User as UserIcon, Shield, KeyRound, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

export type UserCardData = {
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

interface UserCardProps {
  user: UserCardData;
  isSelf: boolean;
  onApprove: () => Promise<void>;
  onPromote: () => Promise<void>;
  onDemote: () => Promise<void>;
  onToggleActive: () => Promise<void>;
  onResetPassword: () => void;
}

export function UserCard({
  user,
  isSelf,
  onApprove,
  onPromote,
  onDemote,
  onToggleActive,
  onResetPassword,
}: UserCardProps) {
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"deactivate" | "activate" | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleAction(action: () => Promise<void>, successMessage: string) {
    startTransition(async () => {
      try {
        await action();
        toast({ title: successMessage });
      } catch (err: any) {
        toast({ title: "Error", description: err?.message ?? "Action failed", variant: "destructive" });
      }
    });
  }

  return (
    <>
      <div className="group relative rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link href={`/admin/users/${user.id}`} className="truncate text-sm font-semibold text-gray-900 hover:underline">
              {user.name}
            </Link>
            <p className="text-xs text-gray-500">{user.email}</p>
            <p className="mt-2 text-xs text-gray-500">
              {user.wing && user.flatNo ? `${user.wing}-${user.flatNo}` : "Flat not assigned"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <Badge
              variant="outline"
              className={
                user.role === "ADMIN"
                  ? "border-green-300 text-green-700 bg-green-50"
                  : "border-gray-200 text-gray-600"
              }
            >
              {user.role === "ADMIN" ? (
                <><Shield className="h-3 w-3 mr-1" />Admin</>
              ) : (
                <><UserIcon className="h-3 w-3 mr-1" />Resident</>
              )}
            </Badge>
            <Badge
              variant="outline"
              className={
                user.approvalStatus === "APPROVED"
                  ? "border-green-300 text-green-700 bg-green-50"
                  : user.approvalStatus === "PENDING"
                  ? "border-amber-300 text-amber-700 bg-amber-50"
                  : "border-red-300 text-red-700 bg-red-50"
              }
            >
              {user.approvalStatus === "APPROVED" ? (
                <><CheckCircle2 className="h-3 w-3 mr-1" />Approved</>
              ) : user.approvalStatus === "PENDING" ? (
                <><Clock className="h-3 w-3 mr-1" />Pending</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" />Rejected</>
              )}
            </Badge>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-600">
          {user.phone ? (
            <p className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5" />
              <a href={`tel:${user.phone}`} className="hover:text-gray-900 hover:underline">
                {user.phone}
              </a>
            </p>
          ) : (
            <p className="flex items-center gap-2 text-gray-400">
              <Phone className="h-3.5 w-3.5" /> No phone provided
            </p>
          )}
          <p className="flex items-center gap-2 text-xs text-gray-400">
            <KeyRound className="h-3.5 w-3.5" /> Joined {format(new Date(user.createdAt), "dd MMM yyyy")}
          </p>
          <div className="mt-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/users/${user.id}`}>View details</Link>
            </Button>
          </div>
        </div>

        <div className="mt-4 border-t pt-3">
          {isSelf ? (
            <p className="text-xs text-gray-400">You cannot manage your own account from here.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.approvalStatus === "REJECTED" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleAction(onApprove, "User approved")}
                  disabled={isPending}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                </Button>
              )}
              {user.role === "RESIDENT" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleAction(onPromote, "User promoted to admin")}
                  disabled={isPending}
                >
                  <Shield className="h-3 w-3 mr-1" /> Make Admin
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => handleAction(onDemote, "User demoted to resident")}
                  disabled={isPending}
                >
                  <UserIcon className="h-3 w-3 mr-1" /> Demote
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className={`h-8 text-xs ${user.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}
                onClick={() => {
                  setConfirmAction(user.isActive ? "deactivate" : "activate");
                  setShowConfirm(true);
                }}
                disabled={isPending}
              >
                {user.isActive ? "Deactivate" : "Activate"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-gray-600 hover:bg-gray-50"
                onClick={() => {
                  onResetPassword();
                }}
              >
                <KeyRound className="h-3 w-3 mr-1" /> Reset Password
              </Button>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "deactivate" ? "Deactivate user?" : "Activate user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "deactivate"
                ? `Deactivating ${user.name} will block their access.`
                : `Activating ${user.name} will allow them to sign in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmAction) return;
                handleAction(onToggleActive, user.isActive ? "User deactivated" : "User activated");
                setShowConfirm(false);
              }}
              disabled={isPending}
              className={user.isActive ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"}
            >
              {user.isActive ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
