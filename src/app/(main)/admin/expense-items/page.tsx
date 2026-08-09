import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import ExpenseItemsAdminClient from "./expense-items-client";

export default async function ExpenseItemsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  return <ExpenseItemsAdminClient />;
}
