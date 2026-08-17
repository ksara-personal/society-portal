"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAccordion } from "@/components/users/user-accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getUsers,
  getPendingUsers,
  getDailyLoginUsers,
  promoteToAdmin,
  demoteToResident,
  toggleUserActive,
  approveUser,
  rejectUser,
  resetUserPassword,
} from "@/actions/users";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { Shield, User, Clock, CheckCircle2, XCircle, Users, KeyRound, UserX, LogIn } from "lucide-react";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  wing: string | null;
  flatNo: string | null;
  phone: string | null;
  createdAt: Date;
};

type DailyLoginUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  wing: string | null;
  flatNo: string | null;
  lastLoginAt: Date | null;
};

type FullUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  wing: string | null;
  flatNo: string | null;
  phone: string | null;
  isActive: boolean;
  approvalStatus: string;
  approvedAt: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  _count: { createdIssues: number };
};

function ResetPasswordDialog({
  user,
  open,
  onClose,
  onSuccess,
}: {
  user: { id: string; name: string } | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const result = await resetUserPassword(user.id, newPassword);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      toast({ title: `Password reset for ${user.name}` });
      formRef.current?.reset();
      onSuccess();
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setError(""); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Set a new password for <strong>{user?.name}</strong>. They will need to use this password on their next sign-in.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="rp-newPassword">New password</Label>
            <Input
              id="rp-newPassword"
              name="newPassword"
              type="password"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rp-confirmPassword">Confirm new password</Label>
            <Input
              id="rp-confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter new password"
              minLength={6}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Resetting…" : "Reset Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApprovalStatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-xs gap-1">
        <CheckCircle2 className="h-3 w-3" /> Approved
      </Badge>
    );
  }
  if (status === "PENDING") {
    return (
      <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 text-xs gap-1">
        <Clock className="h-3 w-3" /> Pending
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50 text-xs gap-1">
      <XCircle className="h-3 w-3" /> Rejected
    </Badge>
  );
}

export default function UsersPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [users, setUsers] = useState<FullUser[]>([]);
  const [dailyLoginUsers, setDailyLoginUsers] = useState<DailyLoginUser[]>([]);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "admins" | "deactivated" | "daily-logins">("pending");

  async function load() {
    const [pending, all, daily] = await Promise.all([
      getPendingUsers(),
      getUsers(),
      getDailyLoginUsers(),
    ]);
    setPendingUsers(pending as PendingUser[]);
    setUsers(all as FullUser[]);
    setDailyLoginUsers(daily as DailyLoginUser[]);
    if (pending.length === 0 && activeTab === "pending") {
      setActiveTab("all");
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (pendingUsers.length > 0) setActiveTab("pending");
  }, [pendingUsers.length]);

  async function handleApprove(id: string) {
    await approveUser(id);
    toast({ title: "User approved", description: "The resident can now sign in." });
    load();
  }

  async function handleReject(id: string) {
    await rejectUser(id);
    toast({ title: "Registration rejected" });
    load();
  }

  async function handlePromote(id: string) {
    await promoteToAdmin(id);
    toast({ title: "User promoted to Admin" });
    load();
  }

  async function handleDemote(id: string) {
    await demoteToResident(id);
    toast({ title: "User demoted to Resident" });
    load();
  }

  async function handleToggleActive(id: string, current: boolean) {
    await toggleUserActive(id, !current);
    toast({ title: current ? "User deactivated" : "User activated" });
    load();
  }

  const deactivatedUsers = users.filter((u) => !u.isActive && u.approvalStatus === "APPROVED");
  const approvedUsers = users.filter((u) => u.approvalStatus !== "PENDING");
  const adminUsers = users.filter((u) => u.role === "ADMIN");

  const wingGroups = Object.entries(
    approvedUsers.reduce<Record<string, FullUser[]>>((groups, user) => {
      const wing = user.wing || "Unassigned";
      if (!groups[wing]) groups[wing] = [];
      groups[wing].push(user);
      return groups;
    }, {})
  )
    .sort(([wingA], [wingB]) => {
      if (wingA === "Unassigned") return 1;
      if (wingB === "Unassigned") return -1;
      return wingA.localeCompare(wingB);
    })
    .map(([wing, users]) => ({
      id: wing,
      name: wing === "Unassigned" ? "No wing assigned" : `Wing ${wing}`,
      label: `${users.length} resident${users.length !== 1 ? "s" : ""}`,
      items: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        wing: user.wing,
        flatNo: user.flatNo,
        phone: user.phone,
        isActive: user.isActive,
        approvalStatus: user.approvalStatus,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        issueCount: user._count.createdIssues,
      })),
    }));

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold">Users</h1>
        <p className="text-sm text-gray-500">{users.length} registered users</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending Approvals
          {pendingUsers.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 min-w-[20px]">
              {pendingUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="h-4 w-4" />
          All Users
        </button>
        <button
          onClick={() => setActiveTab("admins")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "admins"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Shield className="h-4 w-4" />
          Admins
          {adminUsers.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 min-w-[20px]">
              {adminUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("deactivated")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "deactivated"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <UserX className="h-4 w-4" />
          Deactivated
          {deactivatedUsers.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 min-w-[20px]">
              {deactivatedUsers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("daily-logins")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "daily-logins"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <LogIn className="h-4 w-4" />
          Daily Logins
          {dailyLoginUsers.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 min-w-[20px]">
              {dailyLoginUsers.length}
            </span>
          )}
        </button>
      </div>

      {/* Pending approvals tab */}
      {activeTab === "pending" && (
        <div>
          {pendingUsers.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 text-center text-gray-400">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-300" />
              <p className="font-medium text-gray-500">No pending approvals</p>
              <p className="text-sm mt-1">All registrations have been reviewed.</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-white overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  {pendingUsers.length} resident{pendingUsers.length > 1 ? "s" : ""} waiting for approval
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Flat</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id} className="bg-amber-50/30">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                      <TableCell className="text-sm">
                        {user.wing && user.flatNo ? `${user.wing}-${user.flatNo}` : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {user.phone || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(user.createdAt), "dd MMM yy, h:mm a")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(user.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-red-600 hover:bg-red-50 border-red-200"
                            onClick={() => handleReject(user.id)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Deactivated users tab */}
      {activeTab === "deactivated" && (
        <div>
          {deactivatedUsers.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 text-center text-gray-400">
              <UserX className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No deactivated users</p>
              <p className="text-sm mt-1">All approved residents are currently active.</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-white overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
                <UserX className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {deactivatedUsers.length} deactivated resident{deactivatedUsers.length > 1 ? "s" : ""}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Flat</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deactivatedUsers.map((user) => (
                    <TableRow key={user.id} className="bg-gray-50/40">
                      <TableCell className="font-medium text-gray-500">{user.name}</TableCell>
                      <TableCell className="text-sm text-gray-400">{user.email}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {user.wing && user.flatNo ? `${user.wing}-${user.flatNo}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs gap-1 text-gray-500">
                          {user.role === "ADMIN" ? (
                            <><Shield className="h-3 w-3" /> Admin</>
                          ) : (
                            <><User className="h-3 w-3" /> Resident</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {user._count.createdIssues}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-green-700 hover:bg-green-50 border-green-200"
                          onClick={() => handleToggleActive(user.id, false)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Reactivate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* All users tab */}
      {activeTab === "all" && (
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="p-4">
            <UserAccordion
              groups={wingGroups}
              currentUserId={session?.user?.id}
              onApprove={handleApprove}
              onPromote={handlePromote}
              onDemote={handleDemote}
              onToggleActive={handleToggleActive}
              onResetPassword={(userId) => setResetTarget({ id: userId, name: users.find((u) => u.id === userId)?.name ?? "" })}
            />
          </div>
        </div>
      )}

      {/* Admins tab */}
      {activeTab === "admins" && (
        <div>
          {adminUsers.length === 0 ? (
            <div className="rounded-lg border bg-white p-12 text-center text-gray-400">
              <Shield className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No admin users</p>
              <p className="text-sm mt-1">Promote a resident to Admin from the All Users tab.</p>
            </div>
          ) : (
            <div className="rounded-lg border bg-white overflow-hidden">
              <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                  {adminUsers.length} admin{adminUsers.length > 1 ? "s" : ""}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Flat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                        {user.id === session?.user?.id && (
                          <span className="ml-2 text-xs text-gray-400">(you)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {user.wing && user.flatNo ? `${user.wing}-${user.flatNo}` : "—"}
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-300 text-gray-500 bg-gray-50 text-xs">
                            Deactivated
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {user.lastLoginAt ? format(new Date(user.lastLoginAt), "dd MMM yy, h:mm a") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => setResetTarget({ id: user.id, name: user.name })}
                          >
                            <KeyRound className="h-3.5 w-3.5 mr-1" />
                            Reset Password
                          </Button>
                          {user.id !== session?.user?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-amber-700 hover:bg-amber-50 border-amber-200"
                              onClick={() => handleDemote(user.id)}
                            >
                              <User className="h-3.5 w-3.5 mr-1" />
                              Demote to Resident
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Daily Logins tab */}
      {activeTab === "daily-logins" && (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayUsers = dailyLoginUsers.filter(
          (u) => u.lastLoginAt && new Date(u.lastLoginAt) >= today
        );
        const yesterdayUsers = dailyLoginUsers.filter(
          (u) => u.lastLoginAt && new Date(u.lastLoginAt) >= yesterday && new Date(u.lastLoginAt) < today
        );

        const DaySection = ({
          label,
          date,
          users: dayUsers,
        }: {
          label: string;
          date: Date;
          users: DailyLoginUser[];
        }) => (
          <div className="rounded-lg border bg-white overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
              <LogIn className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {label} — {format(date, "dd MMM yyyy")}
              </span>
              <span className="ml-auto inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 min-w-[20px]">
                {dayUsers.length} logged in
              </span>
            </div>
            {dayUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No logins recorded for this day.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Flat</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Login Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dayUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {user.wing && user.flatNo ? `${user.wing}-${user.flatNo}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs gap-1">
                          {user.role === "ADMIN" ? (
                            <><Shield className="h-3 w-3" /> Admin</>
                          ) : (
                            <><User className="h-3 w-3" /> Resident</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {user.lastLoginAt ? format(new Date(user.lastLoginAt), "h:mm a") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        );

        return (
          <div className="space-y-4">
            <DaySection label="Today" date={today} users={todayUsers} />
            <DaySection label="Yesterday" date={yesterday} users={yesterdayUsers} />
          </div>
        );
      })()}

      <ResetPasswordDialog
        user={resetTarget}
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onSuccess={load}
      />
    </div>
  );
}
