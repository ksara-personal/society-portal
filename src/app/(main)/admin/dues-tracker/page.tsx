import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getQuarters } from "@/actions/quarters";
import { getDuesTrackerData, getCurrentQuarterDues } from "@/actions/payments";
import { getFlatEligibilityCounts } from "@/actions/flats";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ year?: string | string[] }>;
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default async function DuesTrackerPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard");

  const yearParam = Array.isArray(resolved.year) ? resolved.year[0] : resolved.year;

  // The KPI-card data doesn't depend on the selected year, so it loads alongside
  // the quarter list rather than after it.
  // (currentDues may return an error object if no active quarter is configured)
  const [allQuarters, currentDuesRes, eligibility] = await Promise.all([
    getQuarters(),
    getCurrentQuarterDues(),
    getFlatEligibilityCounts(),
  ]);

  const currentSummary = "error" in currentDuesRes ? null : currentDuesRes.summary;
  const currentQuarter = "error" in currentDuesRes ? null : currentDuesRes.quarter;

  const years = Array.from(new Set(allQuarters.map((q) => q.year))).sort((a, b) => b - a);
  const year = yearParam ? Number(yearParam) : years[0] ?? new Date().getFullYear();

  const { quarters, rows } = await getDuesTrackerData(year);

  const quarterTotals = quarters.map((quarter) =>
    rows.reduce(
      (sum, row) => sum + (row.quarterAmounts.find((qa) => qa.quarterId === quarter.id)?.paid ?? 0),
      0
    )
  );
  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);
  const rowsWithDues = rows.map((row) => ({
    ...row,
    // Only count quarters still flagged short (not resolved by a Paid/Waived status) as outstanding
    totalDue: row.quarterAmounts.reduce((sum, qa) => sum + (qa.isShort ? qa.target - qa.paid : 0), 0),
  }));
  const grandTotalDue = rowsWithDues.reduce((sum, row) => sum + row.totalDue, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dues Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quarter-wise payments collected per flat for the selected year.
          </p>
        </div>

        <form method="get" className="flex items-center gap-3">
          <label className="text-sm font-medium">
            Year
            <select name="year" defaultValue={String(year)} className="ml-2 rounded-md border px-3 py-2">
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
          <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white">
            Apply
          </button>
        </form>
        </div>

        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-muted-foreground">Villas Eligible for Maintenance</p>
            <p className="mt-1 text-xl font-semibold text-emerald-700">{eligibility.eligible}</p>
            <p className="text-xs text-muted-foreground mt-0.5">of {eligibility.total} total villas</p>
          </div>

          {currentSummary && (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground">Collection Rate ({currentQuarter?.name})</p>
                <p className="mt-1 text-xl font-semibold">{currentSummary.collectionRate}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">{currentSummary.paidCount} of {currentSummary.totalFlats} paid</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground">Unpaid Villas</p>
                <p className="mt-1 text-xl font-semibold text-destructive">{currentSummary.unpaidCount}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground">Paid Villas</p>
                <p className="mt-1 text-xl font-semibold text-emerald-700">{currentSummary.paidCount}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-muted-foreground">Total Outstanding</p>
                <p className="mt-1 text-xl font-semibold">₹{currentSummary.totalDueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
            </>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 font-medium">Wing</th>
              <th className="px-4 py-3 font-medium">Flat No</th>
              <th className="px-4 py-3 font-medium">Owner Name</th>
              {quarters.map((quarter) => (
                <th key={quarter.id} className="px-4 py-3 font-medium text-right">
                  {quarter.name}
                  <div className="text-xs font-normal text-gray-400">
                    Target {formatCurrency(Number(quarter.defaultAmount))}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 font-medium text-right">Total Paid</th>
              <th className="px-4 py-3 font-medium text-right">Total Dues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {rowsWithDues.length === 0 ? (
              <tr>
                <td colSpan={quarters.length + 5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No flats or quarters found for the selected year.
                </td>
              </tr>
            ) : (
              rowsWithDues.map((row) => (
                <tr key={`${row.wing}-${row.flatNo}`}>
                  <td className="px-4 py-4 font-medium text-gray-900">{row.wing}</td>
                  <td className="px-4 py-4">{row.flatNo}</td>
                  <td className="px-4 py-4">{row.ownerName}</td>
                  {row.quarterAmounts.map((qa) => (
                    <td
                      key={qa.quarterId}
                      className={cn(
                        "px-4 py-4 text-right",
                        qa.isShort && "bg-red-50 font-semibold text-destructive"
                      )}
                    >
                      {formatCurrency(qa.paid)}
                    </td>
                  ))}
                  <td className="px-4 py-4 text-right font-semibold">{formatCurrency(row.total)}</td>
                  <td className={cn("px-4 py-4 text-right font-semibold", row.totalDue > 0 && "text-destructive")}>
                    {formatCurrency(row.totalDue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rowsWithDues.length > 0 && (
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-4 py-3 font-medium" colSpan={3}>Total</td>
                {quarterTotals.map((total, idx) => (
                  <td key={quarters[idx].id} className="px-4 py-3 text-right font-semibold">
                    {formatCurrency(total)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(grandTotal)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(grandTotalDue)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      

      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <span className="inline-block h-3 w-3 rounded-sm bg-red-50 border border-red-200" />
        Highlighted cells indicate the amount paid is less than the quarterly target and is still pending
        (payments marked Paid or Waived are treated as fully settled regardless of amount).
      </p>
    </div>
  );
}
