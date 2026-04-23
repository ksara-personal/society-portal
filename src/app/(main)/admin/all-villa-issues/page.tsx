import { Suspense } from "react";
import Link from "next/link";
import { getVillasWithIssueCounts } from "@/actions/villa-issues";
import { AllVillaFilter } from "@/components/villa-issues/all-villa-filter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, ChevronRight, Building2 } from "lucide-react";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AllVillaIssuesPage({ searchParams }: PageProps) {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") params[k] = v;
  }

  const villas = await getVillasWithIssueCounts(params);

  const activeWing = params.wing ?? null;
  const activeFlatNo = params.flatNo ?? null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          All Villa Issues
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {villas.length} villa{villas.length !== 1 ? "s" : ""} with reported issues
          {activeWing || activeFlatNo
            ? ` — filtered by${activeWing ? ` Wing ${activeWing}` : ""}${activeFlatNo ? ` Flat ${activeFlatNo}` : ""}`
            : ""}
        </p>
      </div>

      {/* Filters */}
      <Suspense>
        <AllVillaFilter />
      </Suspense>

      {/* Villa list */}
      {villas.length === 0 ? (
        <div className="text-center py-20">
          <Home className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">No villas match the current filter.</p>
          <p className="text-gray-400 text-sm mt-1">Try clearing the filter to see all villas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {villas.map((villa) => (
            <Link
              key={villa.id}
              href={`/admin/all-villa-issues/${villa.id}`}
              className="block"
            >
              <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Villa icon */}
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Home className="h-5 w-5 text-primary" />
                    </div>

                    {/* Villa info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {villa.wing && villa.flatNo
                            ? `Wing ${villa.wing} — Flat ${villa.flatNo}`
                            : villa.wing
                            ? `Wing ${villa.wing}`
                            : villa.flatNo
                            ? `Flat ${villa.flatNo}`
                            : "Villa"}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 font-semibold"
                        >
                          {villa.issueCount} issue{villa.issueCount !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">
                        {villa.name}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-gray-400 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
