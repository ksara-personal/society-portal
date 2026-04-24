import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Shield, User, Phone, CheckCircle2, XCircle, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserById } from "@/actions/users";
import AdminUserEditForm, { type AdminUserEditData } from "@/components/users/admin-user-edit-form";

interface PageProps {
  params: { id: string };
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const user = await getUserById(params.id);
  if (!user) notFound();

  const userData: AdminUserEditData = {
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
    issueCount: user._count.createdIssues,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">Admin user management</p>
          <h1 className="text-2xl font-semibold text-gray-900">Edit user details</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/users" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to users
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>User summary</CardTitle>
            <CardDescription>Review the profile before making changes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Name</p>
              <p className="text-base text-gray-900">{user.name}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-base text-gray-900">{user.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Flat</p>
              <p className="text-base text-gray-900">{user.wing && user.flatNo ? `${user.wing}-${user.flatNo}` : "Not assigned"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Phone</p>
              <p className="text-base text-gray-900">{user.phone ?? "Not provided"}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Badge variant="outline" className={user.role === "ADMIN" ? "border-green-300 text-green-700 bg-green-50" : "border-gray-200 text-gray-600"}>
                {user.role === "ADMIN" ? <><Shield className="h-3 w-3 mr-1" />Admin</> : <><User className="h-3 w-3 mr-1" />Resident</>}</Badge>
              <Badge variant="outline" className={user.approvalStatus === "APPROVED" ? "border-green-300 text-green-700 bg-green-50" : user.approvalStatus === "PENDING" ? "border-amber-300 text-amber-700 bg-amber-50" : "border-red-300 text-red-700 bg-red-50"}>
                {user.approvalStatus === "APPROVED" ? <><CheckCircle2 className="h-3 w-3 mr-1" />Approved</> : user.approvalStatus === "PENDING" ? <><Clock className="h-3 w-3 mr-1" />Pending</> : <><XCircle className="h-3 w-3 mr-1" />Rejected</>}</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Joined</p>
              <p className="text-base text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Issues filed</p>
              <p className="text-base text-gray-900">{user._count.createdIssues}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update profile</CardTitle>
            <CardDescription>Change the user profile details and correct inaccuracies.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminUserEditForm user={userData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
