import { getMyPayments } from "@/actions/payments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MyPaymentsPage() {
  const payments = await getMyPayments();

  // A PARTIAL payment's amount is what's already been paid, so only the remainder is still outstanding
  const totalPending = payments
    .filter(p => p.status === "PENDING" || p.status === "OVERDUE")
    .reduce((sum, p) => sum + Number(p.amount), 0)
    + payments
      .filter(p => p.status === "PARTIAL")
      .reduce((sum, p) => sum + Math.max(Number(p.quarter.defaultAmount) - Number(p.amount), 0), 0);
  const totalPaid = payments
    .filter(p => p.status === "PAID" || p.status === "WAIVED" || p.status === "PARTIAL")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Payments</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending / Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">₹{totalPending.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quarter</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paid On</TableHead>
            <TableHead>Transaction ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.quarter.name}</TableCell>
              <TableCell>
                {p.quarter.startDate.toLocaleDateString()} → {p.quarter.endDate.toLocaleDateString()}
              </TableCell>
              <TableCell>₹{Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
              <TableCell>
                <Badge variant={
                  p.status === "PAID" ? "default" :
                  p.status === "OVERDUE" ? "destructive" :
                  p.status === "WAIVED" ? "secondary" : "outline"
                } className={p.status === "PARTIAL" ? "border-amber-300 bg-amber-50 text-amber-800" : undefined}>
                  {p.status}
                </Badge>
              </TableCell>
              <TableCell>{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}</TableCell>
              <TableCell className="font-mono text-xs">{p.transactionId || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}