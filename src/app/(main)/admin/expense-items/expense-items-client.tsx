"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2 } from "lucide-react";
import {
  createExpenseItem,
  deleteExpenseItem,
  getExpenseCategories,
  getExpenseItems,
  getExpenseTypes,
} from "@/actions/expense-master";
import { getActiveQuarters } from "@/actions/quarters";
import { getAdmins } from "@/actions/payments";

interface ExpenseItemsAdminClientProps {
  currentUserId: string;
}

export default function ExpenseItemsAdminClient({ currentUserId }: ExpenseItemsAdminClientProps) {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [quarters, setQuarters] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>("ALL");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStatic();
    loadItems();
  }, []);

  useEffect(() => {
    // reload items when quarter filter changes
    loadItems();
  }, [selectedQuarterId]);

  async function load() {
    const [itemsRes, categoriesRes, typesRes, quartersRes, adminsRes] = await Promise.all([
      getExpenseItems(),
      getExpenseCategories(),
      getExpenseTypes(),
      getActiveQuarters(),
      getAdmins(),
    ]);
    setItems(itemsRes);
    setCategories(categoriesRes);
    setTypes(typesRes);
    setQuarters(quartersRes);
    setAdmins(adminsRes);
  }

  async function loadStatic() {
    const [categoriesRes, typesRes, quartersRes, adminsRes] = await Promise.all([
      getExpenseCategories(),
      getExpenseTypes(),
      getActiveQuarters(),
      getAdmins(),
    ]);
    setCategories(categoriesRes);
    setTypes(typesRes);
    setQuarters(quartersRes);
    setAdmins(adminsRes);
  }

  async function loadItems() {
    const filter = selectedQuarterId && selectedQuarterId !== "ALL" ? { quarterId: selectedQuarterId } : undefined;
    const itemsRes = await getExpenseItems(filter);
    setItems(itemsRes);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const result = await createExpenseItem(form);
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Expense item created" });
      setOpen(false);
      await load();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense item?")) return;
    const result = await deleteExpenseItem(id);
    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Expense item deleted" });
      await load();
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">All Expenses</h1>
          <p className="text-sm text-gray-500">Manage administrative expense entry records.</p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <Select onValueChange={(v) => setSelectedQuarterId(v)} value={selectedQuarterId}>
              <SelectTrigger>
                <SelectValue placeholder="All quarters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All quarters</SelectItem>
                {quarters.map((q) => (
                  <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense Item
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>New Expense Item</DialogTitle>
              </DialogHeader>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                  </div>

                  <div>
                    <Label htmlFor="quarterId">Quarter</Label>
                    <Select name="quarterId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quarter" />
                      </SelectTrigger>
                      <SelectContent>
                        {quarters.map((q) => (
                          <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expenseCategoryId">Expense Category</Label>
                    <Select name="expenseCategoryId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expenseTypeId">Expense Type</Label>
                    <Select name="expenseTypeId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
                  </div>

                  <div>
                    <Label htmlFor="createdById">Paid by</Label>
                    <Select name="createdById" defaultValue={currentUserId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select admin" />
                      </SelectTrigger>
                      <SelectContent>
                        {admins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>{admin.name ?? admin.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Saving…" : "Create Expense Item"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Quarter</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                <TableCell>{item.quarter?.name}</TableCell>
                <TableCell>{item.expenseCategory?.name}</TableCell>
                <TableCell>{item.expenseType?.name}</TableCell>
                <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                <TableCell>₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                <TableCell>{item.createdBy?.name ?? item.createdBy?.email ?? "Admin"}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
