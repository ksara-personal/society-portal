import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getQuarters } from "@/actions/quarters";
import { getFinanceUserSummary } from "@/actions/payments";
import { FinanceSummaryQuarterFilter } from "./finance-summary-quarter-filter";

interface FinanceSummaryPageProps {
  searchParams: Promise<{
    quarterId?: string | string[];
  }>;
}

export default async function FinanceSummaryPage({ searchParams }: FinanceSummaryPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard");

  const quarterId = Array.isArray(resolvedSearchParams.quarterId)
    ? resolvedSearchParams.quarterId[0]
    : resolvedSearchParams.quarterId;

  const quarters = await getQuarters();
  const rows = await getFinanceUserSummary({ quarterId: quarterId || undefined });
  const totalCollected = rows.reduce((sum, row) => sum + row.collected, 0);
  const totalExpenses = rows.reduce((sum, row) => sum + row.expenses, 0);
  const totalRemaining = rows.reduce((sum, row) => sum + row.remaining, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Income & Expenditure Summary</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review collection and expense activity by each user who has recorded payments or expenses, regardless of current role.
          </p>
        </div>

        <FinanceSummaryQuarterFilter quarters={quarters} quarterId={quarterId} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Collected</p>
          <p className="mt-2 text-3xl font-semibold">₹{totalCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
          <p className="mt-2 text-3xl font-semibold">₹{totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
          <p className="mt-2 text-3xl font-semibold">₹{totalRemaining.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Collected</th>
              <th className="px-4 py-3 font-medium">Expenses</th>
              <th className="px-4 py-3 font-medium">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No collectors found for the selected filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.userId}>
                  <td className="px-4 py-4 font-medium text-gray-900">{row.user.name}</td>
                  <td className="px-4 py-4 text-gray-900">₹{row.collected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-4 text-gray-900">₹{row.expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className={`px-4 py-4 font-semibold ${row.remaining < 0 ? "text-destructive" : "text-emerald-700"}`}>
                    ₹{row.remaining.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
