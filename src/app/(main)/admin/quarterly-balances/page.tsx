import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getQuarters } from "@/actions/quarters";
import { getQuarterlyBalances } from "@/actions/payments";

interface PageProps {
  searchParams: Promise<{ year?: string | string[] }>;
}

export default async function QuarterlyBalancesPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/dashboard");

  const yearParam = Array.isArray(resolved.year) ? resolved.year[0] : resolved.year;
  const quarters = await getQuarters();
  const years = Array.from(new Set(quarters.map((q) => q.year))).sort((a, b) => b - a);
  const year = yearParam ? Number(yearParam) : years[0] ?? new Date().getFullYear();

  const balances = await getQuarterlyBalances(year);

  const totalOpening = balances.reduce((s, b) => s + b.opening, 0);
  const totalMaintenance = balances.reduce((s, b) => s + b.maintenance, 0);
  const totalBuilder = balances.reduce((s, b) => s + b.builderFunds, 0);
  const totalOther = balances.reduce((s, b) => s + b.otherIncome, 0);
  const totalExpenses = balances.reduce((s, b) => s + b.totalExpenses, 0);
  const totalNet = balances.reduce((s, b) => s + b.netMovement, 0);
  const totalClosing = balances.reduce((s, b) => s + b.closing, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quarterly Balances</h1>
          <p className="text-sm text-muted-foreground mt-1">View quarterly financial balances for a selected year.</p>
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
          <button className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white">Apply</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 font-medium">Quarter</th>
              <th className="px-4 py-3 font-medium">Opening Balance</th>
              <th className="px-4 py-3 font-medium">Maintenance</th>
              <th className="px-4 py-3 font-medium">Builder Funds</th>
              <th className="px-4 py-3 font-medium">Other Income</th>
              <th className="px-4 py-3 font-medium">Total Expenses</th>
              <th className="px-4 py-3 font-medium">Net Movement</th>
              <th className="px-4 py-3 font-medium">Closing Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {balances.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">No data for selected year.</td>
              </tr>
            ) : (
              balances.map((b: any) => (
                <tr key={b.quarterId}>
                  <td className="px-4 py-4 font-medium text-gray-900">{b.name}</td>
                  <td className="px-4 py-4">₹{Number(b.opening).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-4">₹{Number(b.maintenance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-4">₹{Number(b.builderFunds).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-4">₹{Number(b.otherIncome).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-4">₹{Number(b.totalExpenses).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className={`px-4 py-4 font-semibold ${b.netMovement < 0 ? "text-destructive" : "text-emerald-700"}`}>₹{Number(b.netMovement).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-4">₹{Number(b.closing).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-3 font-medium">Total</td>
              <td className="px-4 py-3">₹{totalOpening.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3">₹{totalMaintenance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3">₹{totalBuilder.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3">₹{totalOther.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3">₹{totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3 font-semibold">₹{totalNet.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3">₹{totalClosing.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
