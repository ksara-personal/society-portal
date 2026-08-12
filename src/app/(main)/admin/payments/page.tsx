"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getPayments, createPayment, updatePayment, deletePayment, generateBulkPayments, getAdmins } from "@/actions/payments";
import { getActiveQuarters, getCurrentQuarter } from "@/actions/quarters";
import { getPaymentTypes } from "@/actions/expense-master";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { useWings, useFlatsForWing } from "@/hooks/use-wings";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [quarters, setQuarters] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ quarterId: "", wing: "", flatNo: "", status: "" });
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selectedWing, setSelectedWing] = useState("");
  const [selectedFlats, setSelectedFlats] = useState<string[]>([]);
  const [selectedQuarterId, setSelectedQuarterId] = useState("");
  const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [formWing, setFormWing] = useState("");
  const [formFlatNo, setFormFlatNo] = useState("");
  const { data: session } = useSession();
  const wings = useWings();
  const formFlats = useFlatsForWing(formWing);

  useEffect(() => { loadQuarters(); loadPaymentTypes(); loadAdmins(); }, []);
  useEffect(() => { load(); }, [page, filters]);

  async function loadQuarters() {
    const data = await getActiveQuarters();
    setQuarters(data);

    const current = await getCurrentQuarter();
    if (current?.id) {
      setSelectedQuarterId(current.id);
    } else if (data.length > 0 && !selectedQuarterId) {
      setSelectedQuarterId(data[0].id);
    }
  }

  async function loadPaymentTypes() {
    const data = await getPaymentTypes();
    setPaymentTypes(data);
  }

  async function loadAdmins() {
    const data = await getAdmins();
    setAdmins(data);
  }

  async function load() {
    const res = await getPayments({ ...filters, page, limit: 20 });
    setPayments(res.items);
    setTotal(res.total);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("wing", formWing);
    form.set("flatNo", formFlatNo);
    const res = editing
      ? await updatePayment(editing.id, form)
      : await createPayment(form);

    if ("error" in res) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Payment updated" : "Payment created" });
    setOpen(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this payment record?")) return;
    const res = await deletePayment(id);
    if ("error" in res) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Deleted" });
    load();
  }

  async function handleBulk(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("flatNos", JSON.stringify(selectedFlats));
    const res = await generateBulkPayments(form);
    if ("error" in res) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: `Generated ${res.count} payments` });
    setBulkOpen(false);
    setSelectedFlats([]);
    load();
  }

  const flats = useFlatsForWing(selectedWing);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Resident Payments</h1>
        <div className="flex gap-2">
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Download className="mr-2 h-4 w-4" />Bulk Generate</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Bulk Generate Payments</DialogTitle></DialogHeader>
              <form onSubmit={handleBulk} className="space-y-4">
                <div>
                  <Label>Quarter</Label>
                  <Select name="quarterId" required value={selectedQuarterId} onValueChange={setSelectedQuarterId}>
                    <SelectTrigger><SelectValue placeholder="Select quarter" /></SelectTrigger>
                    <SelectContent>
                      {quarters.map(q => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={selectedQuarterId ? String(quarters.find(q => q.id === selectedQuarterId)?.defaultAmount ?? "") : ""}
                    placeholder="Uses quarter default if left blank"
                  />
                </div>
                <div>
                  <Label>Wing (optional)</Label>
                  <Select onValueChange={v => { setSelectedWing(v); setSelectedFlats([]); }}>
                    <SelectTrigger><SelectValue placeholder="All wings or select one" /></SelectTrigger>
                    <SelectContent>
                      {wings.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {selectedWing && (
                  <div>
                    <Label>Flats</Label>
                    <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
                      {flats.map(f => (
                        <label key={f} className="flex items-center space-x-1 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedFlats.includes(f)}
                            onChange={e => {
                              setSelectedFlats(prev => e.target.checked ? [...prev, f] : prev.filter(x => x !== f));
                            }}
                          />
                          <span>{f}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFlats(flats)}>Select All</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFlats([])}>Clear</Button>
                    </div>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={selectedFlats.length === 0}>
                  Generate {selectedFlats.length > 0 && `(${selectedFlats.length})`}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setFormWing(""); setFormFlatNo(""); }}><Plus className="mr-2 h-4 w-4" />Add Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit Payment" : "New Payment"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Quarter</Label>
                  <Select name="quarterId" defaultValue={editing?.quarterId} value={editing?.quarterId ?? selectedQuarterId} onValueChange={(value) => setSelectedQuarterId(value)}>
                    <SelectTrigger><SelectValue placeholder="Select quarter" /></SelectTrigger>
                    <SelectContent>
                      {quarters.map(q => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Type</Label>
                  <Select name="paymentTypeId" defaultValue={editing?.paymentTypeId ?? paymentTypes.find((t) => t.name === "Maintenance")?.id}>
                    <SelectTrigger><SelectValue placeholder="Select payment type" /></SelectTrigger>
                    <SelectContent>
                      {paymentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Wing</Label>
                    <Select value={formWing} onValueChange={(v) => { setFormWing(v); setFormFlatNo(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select wing" /></SelectTrigger>
                      <SelectContent>{wings.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Flat No</Label>
                    <Select value={formFlatNo} onValueChange={setFormFlatNo} disabled={!formWing}>
                      <SelectTrigger><SelectValue placeholder={formWing ? "Select flat" : "Select wing first"} /></SelectTrigger>
                      <SelectContent>{formFlats.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={editing?.amount ?? (selectedQuarterId ? String(quarters.find(q => q.id === selectedQuarterId)?.defaultAmount ?? "") : "")}
                    placeholder="Uses quarter default if left blank"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editing?.status ?? "PAID"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="WAIVED">Waived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editing && (
                  <>
                    <div><Label>Paid Date</Label><Input name="paidAt" type="date" defaultValue={editing?.paidAt?.split("T")[0]} /></div>
                    <div><Label>Payment Method</Label><Input name="paymentMethod" defaultValue={editing?.paymentMethod} /></div>
                    <div><Label>Transaction ID</Label><Input name="transactionId" defaultValue={editing?.transactionId} /></div>
                  </>
                )}
                <div>
                  <Label>Collected By</Label>
                  <Select name="collectedById" defaultValue={editing?.collectedById ?? session?.user?.id}>
                    <SelectTrigger><SelectValue placeholder="Select admin" /></SelectTrigger>
                    <SelectContent>
                      {admins.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Notes</Label><Input name="notes" defaultValue={editing?.notes} /></div>
                <Button type="submit" className="w-full">{editing ? "Update" : "Create"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select onValueChange={v => setFilters(p => ({ ...p, quarterId: v }))}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All quarters" /></SelectTrigger>
          <SelectContent>{quarters.map(q => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select onValueChange={v => setFilters(p => ({ ...p, wing: v }))}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="All wings" /></SelectTrigger>
        <SelectContent>{wings.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Flat No" className="w-[120px]" onChange={e => setFilters(p => ({ ...p, flatNo: e.target.value }))} />
        <Select onValueChange={v => setFilters(p => ({ ...p, status: v }))}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="WAIVED">Waived</SelectItem>
          </SelectContent>
        </Select>
        <div className="mb-4 rounded-lg bg-muted/50 border divide-y">
          <div className="flex items-center justify-between px-4 py-2.5"> 
            <span className="text-sm font-semibold align-right">Total Amount: {payments.reduce((sum, e) => sum + Number(e.amount), 0)}</span>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Quarter</TableHead>
            <TableHead>Flat</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paid On</TableHead>
            <TableHead>Collected By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.quarter.name}</TableCell>
              <TableCell>{p.wing}-{p.flatNo}</TableCell>
              <TableCell>₹{Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  p.status === "PAID" ? "bg-green-100 text-green-800" :
                  p.status === "OVERDUE" ? "bg-red-100 text-red-800" :
                  p.status === "WAIVED" ? "bg-gray-100 text-gray-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {p.status}
                </span>
              </TableCell>
              <TableCell>{p.paymentType?.name ?? "—"}</TableCell>
              <TableCell>{p.collectedBy?.name ?? "-"}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setFormWing(p.wing ?? ""); setFormFlatNo(p.flatNo ?? ""); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total: {total}</p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" disabled={payments.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}