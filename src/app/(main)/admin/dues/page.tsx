"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getCurrentQuarterDues, markPaymentPaid, createDuePayment } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, type AccordionGroup } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { WINGS } from "@/lib/utils";
import { IndianRupee, Users, CheckCircle2, XCircle, Calendar, Pencil } from "lucide-react";

export default function DuesPage() {
  const [data, setData] = useState<any>(null);
  const [filters, setFilters] = useState({ wing: "" });
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDue, setSelectedDue] = useState<any>(null);
  const { data: session } = useSession();

  useEffect(() => {
    load();
  }, [filters]);

  async function load() {
    setLoading(true);
    const res = await getCurrentQuarterDues({
      wing: filters.wing || undefined,
    });
    setLoading(false);

    if ("error" in res) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }
    setData(res);
  }

  async function handleMarkPaid(e: React.FormEvent<HTMLFormElement>, paymentId: string | null) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (paymentId) {
      const res = await markPaymentPaid(paymentId, form);
      if ("error" in res) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
        return;
      }
    } else if (selectedDue) {
      const createForm = new FormData();
      createForm.set("amount", form.get("amount") as string);
      createForm.set("quarterId", data.quarter.id);
      createForm.set("wing", selectedDue.flat.wing);
      createForm.set("flatNo", selectedDue.flat.flatNo);

      const createRes = await createDuePayment(createForm);
      if ("error" in createRes) {
        toast({ title: "Error", description: createRes.error, variant: "destructive" });
        return;
      }
      toast({ title: "Payment recorded" });
      setCreateOpen(false);
      setSelectedDue(null);
      load();
      return;
    }

    toast({ title: "Marked as paid" });
    setMarkingId(null);
    load();
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dues...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">No data available.</div>;
  }

  const { quarter, dues, summary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Current Quarter Dues</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Calendar className="h-3.5 w-3.5" />
            {quarter.name} — {new Date(quarter.startDate).toLocaleDateString()} to {new Date(quarter.endDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filters.wing || "all"} onValueChange={v => setFilters({ wing: v === "all" ? "" : v })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All wings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All wings</SelectItem>
                {WINGS.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setFilters({ wing: "" })}>
            Reset
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{summary.collectionRate}%</p>
              <p className="text-xs text-muted-foreground">
                {summary.paidCount} of {summary.totalFlats} paid
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Unpaid Flats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{summary.unpaidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Paid Flats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{summary.paidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{summary.totalDueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg bg-white p-4">
        <Accordion
          groups={Object.entries(
            dues.reduce((groupMap: Record<string, any[]>, due: any) => {
              const wing = due.flat.wing ?? "Unassigned";
              groupMap[wing] = groupMap[wing] ?? [];
              groupMap[wing].push(due);
              return groupMap;
            }, {})
          )
            .map(([wing, items]) => ({
              id: wing,
              name: `Wing ${wing}`,
              label: `${items.length} unpaid`, 
              items: items.sort((left, right) => {
                const leftNum = parseInt(left.flat.flatNo ?? "0", 10);
                const rightNum = parseInt(right.flat.flatNo ?? "0", 10);
                return leftNum - rightNum;
              }),
            }))
            .sort((a, b) => a.name.localeCompare(b.name))}
          renderItem={(due: any) => (
            <Card key={`${due.flat.wing}-${due.flat.flatNo}`} className="border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">
                      {due.flat.wing}-{due.flat.flatNo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {due.allResidents.length > 0
                        ? due.allResidents.map((r: any) => r.name).join(", ")
                        : "Unregistered"}
                    </p>
                  </div>
                  <Badge variant={due.payment?.status === "OVERDUE" ? "destructive" : "secondary"}>
                    {due.payment?.status || "NO RECORD"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Contact</p>
                    <p className="text-sm">{due.primaryResident?.phone || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase text-muted-foreground">Amount due</p>
                    <p className="text-lg font-semibold">
                      ₹{Number(due.payment?.amount ?? quarter.defaultAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  {due.allResidents.length > 0 && (
                    <p>{due.allResidents[0].email}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {due.payment ? (
                    <Dialog open={markingId === due.payment.id} onOpenChange={(open) => setMarkingId(open ? due.payment.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto">
                          <Pencil className="h-3 w-3 mr-1" />
                          Mark Paid
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Mark Payment as Paid</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => handleMarkPaid(e, due.payment.id)} className="space-y-4">
                          <div>
                            <Label>Flat</Label>
                            <p className="text-sm font-medium">{due.flat.wing}-{due.flat.flatNo}</p>
                          </div>
                          <div>
                            <Label>Amount</Label>
                            <p className="text-sm font-medium">₹{Number(due.payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <Label>Paid Date</Label>
                            <Input name="paidAt" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                          </div>
                          <div>
                            <Label>Payment Method</Label>
                            <Select name="paymentMethod" defaultValue="Cash">
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="Cheque">Cheque</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Collected By</Label>
                            <Input value={session?.user?.name ?? ""} readOnly />
                          </div>
                          <div>
                            <Label>Transaction ID (optional)</Label>
                            <Input name="transactionId" placeholder="e.g. UPI123456" />
                          </div>
                          <div>
                            <Label>Notes (optional)</Label>
                            <Input name="notes" placeholder="Any notes..." />
                          </div>
                          <Button type="submit" className="w-full">Confirm Payment</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Dialog open={createOpen && selectedDue?.flat.wing === due.flat.wing && selectedDue?.flat.flatNo === due.flat.flatNo} onOpenChange={(open) => {
                      if (!open) { setCreateOpen(false); setSelectedDue(null); }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => { setSelectedDue(due); setCreateOpen(true); }}>
                          <IndianRupee className="h-3 w-3 mr-1" />
                          Bill & Pay
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create & Mark Payment</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => handleMarkPaid(e, null)} className="space-y-4">
                          <div>
                            <Label>Flat</Label>
                            <p className="text-sm font-medium">{due.flat.wing}-{due.flat.flatNo}</p>
                          </div>
                          <div>
                            <Label>Amount (₹)</Label>
                            <Input name="amount" type="number" step="0.01" defaultValue={data.quarter.defaultAmount ? String(data.quarter.defaultAmount) : ""} placeholder="Uses quarter default if left blank" />
                          </div>
                          <div>
                            <Label>Paid Date</Label>
                            <Input name="paidAt" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                          </div>
                          <div>
                            <Label>Payment Method</Label>
                            <Select name="paymentMethod" defaultValue="Cash">
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="Cheque">Cheque</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Collected By</Label>
                            <Input value={session?.user?.name ?? ""} readOnly />
                          </div>
                          <div>
                            <Label>Transaction ID (optional)</Label>
                            <Input name="transactionId" placeholder="e.g. UPI123456" />
                          </div>
                          <div>
                            <Label>Notes (optional)</Label>
                            <Input name="notes" placeholder="Any notes..." />
                          </div>
                          <Button type="submit" className="w-full">Create & Confirm Payment</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          emptyStateText={`All flats have paid for ${quarter.name}!`}
          gridClassName="grid-cols-1 lg:grid-cols-2 gap-4"
        />
      </div>
    </div>
  );
}