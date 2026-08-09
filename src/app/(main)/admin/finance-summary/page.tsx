import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getQuarters } from "@/actions/quarters";
import { getFinanceUserSummary } from "@/actions/payments";

interface FinanceSummaryPageProps {
  searchParams: Promise<{
    quarterId?: string | string[];
    search?: string | string[];
  }>;
}

export default async function FinanceSummaryPage({ searchParams }: FinanceSummaryPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const quarterId = Array.isArray(resolvedSearchParams.quarterId)
    ? resolvedSearchParams.quarterId[0]
    : resolvedSearchParams.quarterId;
  const searchText = Array.isArray(resolvedSearchParams.search)
    ? resolvedSearchParams.search[0]
    : resolvedSearchParams.search ?? "";

  const quarters = await getQuarters();
  const rows = await getFinanceUserSummary({ quarterId: quarterId || undefined });
  const normalizedSearch = searchText.trim().toLowerCase();

  const filteredRows = normalizedSearch
    ? rows.filter((row) =>
        row.user.name.toLowerCase().includes(normalizedSearch) ||
        row.user.email.toLowerCase().includes(normalizedSearch)
      )
    : rows;

  const totalCollected = filteredRows.reduce((sum, row) => sum + row.collected, 0);
  const totalExpenses = filteredRows.reduce((sum, row) => sum + row.expenses, 0);
  const totalRemaining = filteredRows.reduce((sum, row) => sum + row.remaining, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finance Summary</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review collection and expense activity by each user who has recorded payments or expenses, regardless of current role.
          </p>
        </div>

        <form method="get" className="grid gap-3 sm:grid-cols-[220px_minmax(220px,1fr)_auto]">
          <label className="block text-sm font-medium text-gray-700">
            Quarter
            <select
              name="quarterId"
              defaultValue={quarterId ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All quarters</option>
              {quarters.map((quarter) => (
                <option key={quarter.id} value={quarter.id}>
                  {quarter.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Collector name or email
            <input
              name="search"
              defaultValue={searchText}
              placeholder="Search user"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            Apply
          </button>
        </form>
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
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Collected</th>
              <th className="px-4 py-3 font-medium">Expenses</th>
              <th className="px-4 py-3 font-medium">Remaining</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No collectors found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.userId}>
                  <td className="px-4 py-4 font-medium text-gray-900">{row.user.name}</td>
                  <td className="px-4 py-4 text-gray-600">{row.user.email || "—"}</td>
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
