import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import ExpenseItemsAdminClient from "./expense-items-client";

export default async function ExpenseItemsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard");

  return <ExpenseItemsAdminClient currentUserId={user.id} isAdmin={user.role === "ADMIN"} />;
}
