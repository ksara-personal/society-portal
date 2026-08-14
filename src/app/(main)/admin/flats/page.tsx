"use client";

import { useState, useEffect } from "react";
import {
  getFlats,
  createFlat,
  updateFlat,
  deleteFlat,
  createFlatRange,
} from "@/actions/flats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Pencil, Trash2, Plus, LayoutGrid } from "lucide-react";

type Flat = Awaited<ReturnType<typeof getFlats>>[number];

export default function FlatsPage() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [editing, setEditing] = useState<Flat | null>(null);
  const [open, setOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [wingFilter, setWingFilter] = useState("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await getFlats();
    setFlats(data);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = editing
      ? await updateFlat(editing.id, form)
      : await createFlat(form);

    if ("error" in res) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Villa updated" : "Villa created" });
    setOpen(false);
    setEditing(null);
    load();
  }

  async function handleRangeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await createFlatRange(form);

    if ("error" in res) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: `${res.count} flat(s)/villa(s) created` });
    setRangeOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this flat/villa?")) return;
    const res = await deleteFlat(id);
    if ("error" in res) {
      toast({ title: "Error", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Flat/villa deleted" });
    load();
  }

  const wings = Array.from(new Set(flats.map((f) => f.wing))).sort((a, b) => a.localeCompare(b));
  const visibleFlats = wingFilter === "all" ? flats : flats.filter((f) => f.wing === wingFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Villas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the wings and villa numbers used across the app, and mark which are eligible for maintenance dues.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={rangeOpen} onOpenChange={setRangeOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Bulk Add Villas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Add Villas</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRangeSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="rangeWing">Wing</Label>
                  <Input id="rangeWing" name="wing" placeholder="e.g. A" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="flatStart">Start No.</Label>
                    <Input id="flatStart" name="flatStart" type="number" min="1" required />
                  </div>
                  <div>
                    <Label htmlFor="flatEnd">End No.</Label>
                    <Input id="flatEnd" name="flatEnd" type="number" min="1" required />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rangeEligible"
                    name="eligibleForMaintenance"
                    defaultChecked
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="rangeEligible">Eligible for Maintenance</Label>
                </div>
                <Button type="submit" className="w-full">Create Range</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Villa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Villa" : "New Villa"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="wing">Wing</Label>
                  <Input id="wing" name="wing" defaultValue={editing?.wing} placeholder="e.g. A" required />
                </div>
                <div>
                  <Label htmlFor="flatNo">Villa No.</Label>
                  <Input id="flatNo" name="flatNo" defaultValue={editing?.flatNo} placeholder="e.g. 001" required />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="eligibleForMaintenance"
                    name="eligibleForMaintenance"
                    defaultChecked={editing?.eligibleForMaintenance ?? true}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="eligibleForMaintenance">Eligible for Maintenance</Label>
                </div>
                <Button type="submit" className="w-full">
                  {editing ? "Update" : "Create"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="wingFilter" className="text-sm">Wing</Label>
        <select
          id="wingFilter"
          value={wingFilter}
          onChange={(e) => setWingFilter(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="all">All Wings</option>
          {wings.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Wing</TableHead>
            <TableHead>Villa No.</TableHead>
            <TableHead>Eligible for Maintenance</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleFlats.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-sm text-gray-500 py-8">
                No villas found.
              </TableCell>
            </TableRow>
          ) : (
            visibleFlats.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.wing}</TableCell>
                <TableCell>{f.flatNo}</TableCell>
                <TableCell>
                  {f.eligibleForMaintenance ? (
                    <Badge>Eligible</Badge>
                  ) : (
                    <Badge variant="outline">Not eligible</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(f);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
