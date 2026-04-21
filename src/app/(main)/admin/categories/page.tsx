"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
} from "@/actions/categories";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const cats = await getCategories();
    setCategories(cats);
  }

  useEffect(() => { load(); }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = editing
      ? await updateCategory(editing.id, formData)
      : await createCategory(formData);

    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: editing ? "Category updated!" : "Category created!" });
      setDialogOpen(false);
      setEditing(null);
      await load();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const result = await deleteCategory(id);
    if ("error" in result) {
      toast({ title: "Cannot delete", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Category deleted" });
      await load();
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} categories</p>
        </div>
        <Button
          onClick={() => { setEditing(null); setDialogOpen(true); }}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-gray-500 text-sm max-w-xs truncate">
                  {cat.description || "—"}
                </TableCell>
                <TableCell>
                  {cat.icon ? (
                    <Badge variant="outline" className="text-xs font-mono">
                      {cat.icon}
                    </Badge>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setEditing(cat); setDialogOpen(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input name="name" defaultValue={editing?.name || ""} required minLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea name="description" defaultValue={editing?.description || ""} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Icon (Lucide icon name)</Label>
              <Input name="icon" defaultValue={editing?.icon || ""} placeholder="e.g. droplets, zap, car" />
              <p className="text-xs text-gray-400">Find icons at lucide.dev</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
