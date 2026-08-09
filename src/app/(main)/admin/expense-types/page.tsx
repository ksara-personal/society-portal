"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createExpenseType,
  deleteExpenseType,
  getExpenseTypes,
  updateExpenseType,
} from "@/actions/expense-master";

type ExpenseType = Awaited<ReturnType<typeof getExpenseTypes>>[number];

export default function ExpenseTypesPage() {
  const [types, setTypes] = useState<ExpenseType[]>([]);
  const [editing, setEditing] = useState<ExpenseType | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await getExpenseTypes();
    setTypes(data);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = editing ? await updateExpenseType(editing.id, form) : await createExpenseType(form);

    if ("error" in res) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }

    toast({ title: editing ? "Expense type updated" : "Expense type created" });
    setOpen(false);
    setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense type?")) return;
    const res = await deleteExpenseType(id);
    if ("error" in res) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Expense type deleted" });
    load();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expense Types</h1>
          <p className="text-sm text-gray-500">Manage expense type master data.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Expense Type" : "New Expense Type"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editing?.name} required />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  defaultChecked={editing?.isActive ?? true}
                  value="true"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <Button type="submit" className="w-full">
                {editing ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((type) => (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell>{type.isActive ? "Active" : "Inactive"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(type);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(type.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
