"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  createContactCategory,
  updateContactCategoryAdmin,
  deleteContactCategory,
} from "@/actions/contacts";

interface Category { id: string; name: string; slug: string; icon: string | null; color: string | null; order: number }

const BLANK = { name: "", icon: "", color: "#64748b", order: 0 };

export function ContactCategoryTable({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(BLANK);

  function openNew() { setEditing(null); setForm(BLANK); setShowDialog(true); }
  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon ?? "", color: cat.color ?? "#64748b", order: cat.order });
    setShowDialog(true);
  }

  function handleSave() {
    const formData = new FormData();
    formData.set("name",  form.name);
    formData.set("icon",  form.icon);
    formData.set("color", form.color);
    formData.set("order", String(form.order));

    startTransition(async () => {
      const res = editing
        ? await updateContactCategoryAdmin(editing.id, formData)
        : await createContactCategory(formData);
      if (res?.error) {
        toast({ title: "Error", description: String(res.error), variant: "destructive" });
        return;
      }
      toast({ title: editing ? "Category updated" : "Category created" });
      setShowDialog(false);
      router.refresh();
    });
  }

  function handleDelete(cat: Category) {
    if (!confirm(`Delete "${cat.name}"? Contacts in this category must be reassigned first.`)) return;
    startTransition(async () => {
      const res = await deleteContactCategory(cat.id);
      if (res?.error) {
        toast({ title: "Cannot delete", description: String(res.error), variant: "destructive" });
      } else {
        toast({ title: "Category deleted" });
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add category</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Colour</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-sm text-gray-500">{cat.icon}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded-full border" style={{ backgroundColor: cat.color ?? "#ccc" }} />
                    <span className="text-xs text-gray-500">{cat.color}</span>
                  </span>
                </TableCell>
                <TableCell>{cat.order}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDelete(cat)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-gray-400">No categories yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "Add category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Mason / Flooring" />
            </div>
            <div className="space-y-1.5">
              <Label>Icon (Lucide name)</Label>
              <Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="e.g. wrench, zap, hammer" />
            </div>
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="h-9 w-9 cursor-pointer rounded border p-0.5" />
                <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="#f59e0b" className="font-mono text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Column order</Label>
              <Input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} min={0} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPending || !form.name}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
