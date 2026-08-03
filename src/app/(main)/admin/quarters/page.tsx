"use client";

import { useState, useEffect } from "react";
import { createQuarter, updateQuarter, deleteQuarter, getQuarters } from "@/actions/quarters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
//import { Checkbox } from "@/components/ui/";
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
import { Pencil, Trash2, Plus } from "lucide-react";

type Quarter = Awaited<ReturnType<typeof getQuarters>>[number];

export default function QuartersPage() {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [editing, setEditing] = useState<Quarter | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await getQuarters();
    setQuarters(data);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = editing
      ? await updateQuarter(editing.id, form)
      : await createQuarter(form);

    if ("error" in res) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Quarter updated" : "Quarter created" });
    setOpen(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this quarter?")) return;
    const res = await deleteQuarter(id);
    if ("error" in res) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Quarter deleted" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payment Quarters</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Quarter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Quarter" : "New Quarter"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editing?.name} placeholder="e.g. Q1 2026" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" name="startDate" type="date" defaultValue={editing?.startDate.toISOString().split("T")[0]} required />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" name="endDate" type="date" defaultValue={editing?.endDate.toISOString().split("T")[0]} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" name="year" type="number" defaultValue={editing?.year ?? new Date().getFullYear()} required />
                </div>
                <div>
                  <Label htmlFor="order">Order</Label>
                  <Input id="order" name="order" type="number" defaultValue={editing?.order ?? 0} required />
                </div>
              </div>
              <div>
                <Label htmlFor="defaultAmount">Default Amount (₹)</Label>
                <Input
                  id="defaultAmount"
                  name="defaultAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editing?.defaultAmount ? editing.defaultAmount.toString() : "0"}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  defaultChecked={editing?.isActive ?? true}
                  value="true"
                  title="Active"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <Button type="submit" className="w-full">
                {editing ? "Update Quarter" : "Create Quarter"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Default Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quarters.map((q) => (
            <TableRow key={q.id}>
              <TableCell className="font-medium">{q.name}</TableCell>
              <TableCell>
                {q.startDate.toLocaleDateString()} → {q.endDate.toLocaleDateString()}
              </TableCell>
              <TableCell>{q.year}</TableCell>
              <TableCell>{q.order}</TableCell>
              <TableCell>₹{Number(q.defaultAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
              <TableCell>{q.isActive ? "Active" : "Inactive"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(q);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}