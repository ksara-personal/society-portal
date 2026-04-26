"use client";

import { useEffect, useMemo, useState } from "react";
import { getResidents } from "@/actions/users";
import { BUILDING_CONFIG } from "@/config/building";
import { Phone, Mail, UserCheck, UserX, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SectionGroup } from "@/components/ui/section-group";

type Resident = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  wing: string | null;
  flatNo: string | null;
  isActive: boolean;
};

function ResidentCard({ resident }: { resident: Resident }) {
  return (
    <div
      className={`rounded-lg border bg-white p-4 flex flex-col gap-1.5 ${
        !resident.isActive ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm leading-snug">{resident.name}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            {resident.wing && resident.flatNo
              ? `${resident.wing}-${resident.flatNo}`
              : "—"}
          </p>
        </div>
        {!resident.isActive && (
          <Badge
            variant="outline"
            className="text-xs border-gray-300 text-gray-400 gap-1 shrink-0"
          >
            <UserX className="h-3 w-3" />
            Inactive
          </Badge>
        )}
      </div>

      {resident.phone && (
        <a
          href={`tel:${resident.phone}`}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-primary transition-colors"
        >
          <Phone className="h-3 w-3 shrink-0" />
          {resident.phone}
        </a>
      )}
      {resident.email && (
        <a
          href={`mailto:${resident.email}`}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors truncate"
        >
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{resident.email}</span>
        </a>
      )}
    </div>
  );
}

const configuredWings = BUILDING_CONFIG.wings.map((w) => w.name);

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);

  const [wingFilter, setWingFilter] = useState("all");
  const [flatFilter, setFlatFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");

  useEffect(() => {
    getResidents().then((data) => {
      setResidents(data as Resident[]);
      setLoading(false);
    });
  }, []);

  const hasActiveFilter =
    wingFilter !== "all" ||
    flatFilter.trim() !== "" ||
    nameFilter.trim() !== "" ||
    phoneFilter.trim() !== "";

  function clearFilters() {
    setWingFilter("all");
    setFlatFilter("");
    setNameFilter("");
    setPhoneFilter("");
  }

  const filtered = useMemo(() => {
    const name = nameFilter.trim().toLowerCase();
    const flat = flatFilter.trim().toLowerCase();
    const phone = phoneFilter.trim().toLowerCase();

    return residents
      .filter((r) => {
        if (wingFilter !== "all" && r.wing !== wingFilter) return false;
        if (flat && !(r.flatNo ?? "").toLowerCase().includes(flat)) return false;
        if (name && !r.name.toLowerCase().includes(name)) return false;
        if (phone && !(r.phone ?? "").toLowerCase().includes(phone)) return false;
        return true;
      })
      .sort((a, b) => {
        const wingA = a.wing ?? "ZZZ";
        const wingB = b.wing ?? "ZZZ";
        if (wingA !== wingB) return wingA.localeCompare(wingB);
        return parseInt(a.flatNo ?? "0", 10) - parseInt(b.flatNo ?? "0", 10);
      });
  }, [residents, wingFilter, flatFilter, nameFilter, phoneFilter]);

  const byWing = useMemo(() => {
    return filtered.reduce<Record<string, Resident[]>>((acc, r) => {
      const key = r.wing ?? "__unassigned__";
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {});
  }, [filtered]);

  const allWingKeys = Object.keys(byWing);
  const orderedKeys = [
    ...configuredWings.filter((w) => allWingKeys.includes(w)),
    ...allWingKeys.filter(
      (k) => k !== "__unassigned__" && !(configuredWings as string[]).includes(k)
    ),
    ...(allWingKeys.includes("__unassigned__") ? ["__unassigned__"] : []),
  ];

  const totalActive = residents.filter((r) => r.isActive).length;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold">Residents Directory</h1>
        <p className="text-sm text-gray-500">
          {loading ? "Loading…" : `${totalActive} active resident${totalActive !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-white p-3 flex flex-wrap gap-2 items-center">
        <select
          value={wingFilter}
          onChange={(e) => setWingFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Wings</option>
          {configuredWings.map((w) => (
            <option key={w} value={w}>Wing {w}</option>
          ))}
        </select>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={flatFilter}
            onChange={(e) => setFlatFilter(e.target.value)}
            placeholder="Flat no."
            className="h-9 pl-8 w-28 text-sm"
          />
        </div>

        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Search by name…"
            className="h-9 pl-8 text-sm"
          />
        </div>

        <div className="relative w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={phoneFilter}
            onChange={(e) => setPhoneFilter(e.target.value)}
            placeholder="Search by phone…"
            className="h-9 pl-8 text-sm"
          />
        </div>

        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {hasActiveFilter && !loading && (
        <p className="text-sm text-gray-500">
          Showing {filtered.length} of {residents.length} resident{residents.length !== 1 ? "s" : ""}
        </p>
      )}

      {loading ? (
        <div className="rounded-lg border bg-white p-12 text-center text-gray-400">
          <p className="text-sm">Loading residents…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center text-gray-400">
          <UserCheck className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          {residents.length === 0 ? (
            <>
              <p className="font-medium text-gray-500">No approved residents yet</p>
              <p className="text-sm mt-1">Approve registrations in the Users page to see residents here.</p>
            </>
          ) : (
            <>
              <p className="font-medium text-gray-500">No residents match your filters</p>
              <button onClick={clearFilters} className="text-sm text-primary mt-2 hover:underline">
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {orderedKeys.map((wingKey) => {
            const wingResidents = byWing[wingKey];
            const label = wingKey === "__unassigned__" ? "No Wing Assigned" : `Wing ${wingKey}`;
            const icon = wingKey === "__unassigned__" ? "?" : wingKey;

            return (
              <SectionGroup
                key={wingKey}
                icon={icon}
                label={label}
                count={wingResidents.length}
                countLabel="resident"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {wingResidents.map((resident) => (
                    <ResidentCard key={resident.id} resident={resident} />
                  ))}
                </div>
              </SectionGroup>
            );
          })}
        </div>
      )}
    </div>
  );
}
